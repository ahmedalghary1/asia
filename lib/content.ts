import {env} from 'cloudflare:workers';
import {seed} from './seed';
import type {Content} from './model';
import { cookies } from 'next/headers';

export function database(){const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw new Error('Database unavailable');return db;}
export function bucket(){return (env as unknown as {BUCKET?:R2Bucket}).BUCKET;}
export function mediaKv(){return (env as unknown as {MEDIA_KV?:KVNamespace}).MEDIA_KV;}

export interface AdminCredentials {
  username: string;
  password: string;
  session_token: string;
}

export async function getAdminCredentials(): Promise<AdminCredentials> {
  const defaultUser = 'admin';
  const defaultPass = (env as unknown as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD || 'asiakhalil@1234';

  try {
    const db = database();
    const row = await db.prepare('SELECT username, password, session_token FROM admin_credentials WHERE id = ?')
      .bind('primary')
      .first<AdminCredentials>();

    if (row && row.username && row.password) {
      if (!row.session_token) {
        const token = 's_' + crypto.randomUUID().replace(/-/g, '');
        await db.prepare('UPDATE admin_credentials SET session_token = ? WHERE id = ?').bind(token, 'primary').run();
        row.session_token = token;
      }
      return row;
    }
  } catch (e) {
    console.warn('Could not query admin_credentials from DB:', e);
  }

  return { username: defaultUser, password: defaultPass, session_token: 'default_token' };
}

export async function admin(req?: Request): Promise<boolean> {
  let token: string | null = null;
  if (req) {
    const rawCookie = req.headers.get('cookie') || '';
    const match = rawCookie.match(/(?:^|;\s*)admin_session=([^;]+)/);
    if (match) token = decodeURIComponent(match[1].trim());
  }
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('admin_session')?.value || null;
    } catch {}
  }

  if (!token) return false;

  try {
    const creds = await getAdminCredentials();
    if (creds.session_token && token === creds.session_token) {
      return true;
    }
  } catch (e) {
    console.warn('Error verifying admin token:', e);
  }

  return false;
}

export function createSessionCookie(token: string): string {
  return `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}

export function clearSessionCookie(): string {
  return `admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function verifyAdminLogin(username: string, password: string): Promise<{ success: boolean; error?: string; sessionToken?: string }> {
  if (!username || !password) {
    return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }

  const creds = await getAdminCredentials();
  const userMatch = username.trim().toLowerCase() === creds.username.trim().toLowerCase();
  const passMatch = password === creds.password;

  if (!userMatch || !passMatch) {
    return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }

  return { success: true, sessionToken: creds.session_token };
}

export async function updateAdminCredentials(currentPassword: string, newUsername: string, newPassword: string): Promise<{ success: boolean; error?: string; sessionToken?: string; message?: string }> {
  if (!currentPassword || !newUsername || !newPassword) {
    return { success: false, error: 'يرجى ملء جميع الحقول المطلوبة' };
  }

  const cleanUser = newUsername.trim();
  if (cleanUser.length < 3) {
    return { success: false, error: 'اسم المستخدم يجب ألا يقل عن 3 أحرف' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'كلمة المرور يجب ألا تقل عن 6 خانات' };
  }

  const creds = await getAdminCredentials();
  if (currentPassword !== creds.password) {
    return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
  }

  const newSessionToken = 's_' + crypto.randomUUID().replace(/-/g, '');

  try {
    const db = database();
    await db.prepare(
      `INSERT INTO admin_credentials(id, username, password, session_token, updated_at)
       VALUES('primary', ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         username = excluded.username,
         password = excluded.password,
         session_token = excluded.session_token,
         updated_at = excluded.updated_at`
    ).bind(cleanUser, newPassword, newSessionToken, Date.now()).run();

    return {
      success: true,
      sessionToken: newSessionToken,
      message: 'تم تحديث اسم المستخدم وكلمة المرور بنجاح وتسجيل خروج الأجهزة الأخرى'
    };
  } catch (e: any) {
    console.error('Error updating credentials:', e);
    return { success: false, error: 'تعذر حفظ البيانات في قاعدة البيانات: ' + (e?.message || '') };
  }
}

export async function getRecord(){const row=await database().prepare('SELECT data,revision FROM site_content WHERE id = ?').bind('main').first<{data:string;revision:number}>();return row?{content:JSON.parse(row.data) as Content,revision:row.revision}:{content:structuredClone(seed),revision:0};}
export async function getContent(all=false){const {content}=await getRecord();if(!all)content.campaigns=content.campaigns.filter(c=>c.published);return content;}

export function sameOrigin(req:Request){
  const origin = req.headers.get('origin');
  if(!origin || origin === 'null') return true;
  try {
    const originUrl = new URL(origin);
    const reqUrl = new URL(req.url);
    if(originUrl.origin === reqUrl.origin) return true;
    if(originUrl.hostname === reqUrl.hostname) return true;
    const originHost = originUrl.hostname.toLowerCase();
    const reqHost = reqUrl.hostname.toLowerCase();
    if(originHost.replace(/^www\./, '') === reqHost.replace(/^www\./, '')) return true;
    const hostHeader = (req.headers.get('host') || req.headers.get('x-forwarded-host') || '').toLowerCase().split(',')[0].trim().split(':')[0];
    if(hostHeader && originHost.replace(/^www\./, '') === hostHeader.replace(/^www\./, '')) return true;
    const allowed = ['asia-agency.online', 'site-creator-vinext-starter.ahmedalghary1.workers.dev', 'localhost', '127.0.0.1'];
    if(allowed.some(d => originHost === d || originHost.endsWith('.' + d))) return true;
  } catch {}
  return true;
}

export async function saveMedia(id: string, data: ArrayBuffer, contentType: string): Promise<void> {
  let saved = false;
  const b = bucket();
  if (b) {
    try {
      await b.put(id, data, { httpMetadata: { contentType } });
      saved = true;
    } catch (e) {
      console.warn('R2 put error:', e);
    }
  }

  const kv = mediaKv();
  if (kv) {
    try {
      await kv.put(id, data, {
        metadata: { contentType, size: data.byteLength }
      });
      saved = true;
    } catch (e) {
      console.warn('KV put error:', e);
    }
  }

  try {
    const db = (env as unknown as {DB?:D1Database}).DB;
    if (db && data.byteLength <= 2 * 1024 * 1024) {
      await db.prepare(
        'INSERT OR REPLACE INTO media_storage(id, content_type, data, size, created_at) VALUES(?, ?, ?, ?, ?)'
      ).bind(id, contentType, data, data.byteLength, Date.now()).run();
      saved = true;
    }
  } catch (e) {
    console.warn('D1 media backup error:', e);
  }

  if (!saved) {
    throw new Error('No storage backend available to save media');
  }
}

export async function readMedia(id: string): Promise<{ data: ArrayBuffer | ReadableStream; contentType: string; size?: number } | null> {
  const b = bucket();
  if (b) {
    try {
      const obj = await b.get(id);
      if (obj) {
        return {
          data: obj.body,
          contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
          size: obj.size
        };
      }
    } catch (e) {
      console.warn('R2 get error:', e);
    }
  }

  const kv = mediaKv();
  if (kv) {
    try {
      const res = await kv.getWithMetadata<{ contentType?: string; size?: number }>(id, { type: 'arrayBuffer' });
      if (res && res.value) {
        return {
          data: res.value,
          contentType: res.metadata?.contentType || 'application/octet-stream',
          size: res.metadata?.size || res.value.byteLength
        };
      }
    } catch (e) {
      console.warn('KV get error:', e);
    }
  }

  try {
    const db = (env as unknown as {DB?:D1Database}).DB;
    if (db) {
      const row = await db.prepare('SELECT content_type, data, size FROM media_storage WHERE id = ?').bind(id).first<{ content_type: string; data: ArrayBuffer; size: number }>();
      if (row && row.data) {
        return {
          data: row.data,
          contentType: row.content_type || 'application/octet-stream',
          size: row.size
        };
      }
    }
  } catch (e) {
    console.warn('D1 get media error:', e);
  }

  return null;
}

export async function deleteMedia(id: string): Promise<void> {
  const b = bucket();
  if (b) {
    try { await b.delete(id); } catch {}
  }
  const kv = mediaKv();
  if (kv) {
    try { await kv.delete(id); } catch {}
  }
  try {
    const db = (env as unknown as {DB?:D1Database}).DB;
    if (db) {
      await db.prepare('DELETE FROM media_storage WHERE id = ?').bind(id).run();
    }
  } catch {}
}

