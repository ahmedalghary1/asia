import {env} from 'cloudflare:workers';
import {seed} from './seed';
import type {Content} from './model';
import { cookies } from 'next/headers';

export function database(){const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw new Error('Database unavailable');return db;}
export function bucket(){return (env as unknown as {BUCKET?:R2Bucket}).BUCKET;}
export function mediaKv(){return (env as unknown as {MEDIA_KV?:KVNamespace}).MEDIA_KV;}

export async function admin(){
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'true';
}

export async function getRecord(){const row=await database().prepare('SELECT data,revision FROM site_content WHERE id = ?').bind('main').first<{data:string;revision:number}>();return row?{content:JSON.parse(row.data) as Content,revision:row.revision}:{content:structuredClone(seed),revision:0};}
export async function getContent(all=false){const {content}=await getRecord();if(!all)content.campaigns=content.campaigns.filter(c=>c.published);return content;}

export function sameOrigin(req:Request){
  const origin = req.headers.get('origin');
  if(!origin){
    const referer = req.headers.get('referer');
    if(!referer) return true;
    try {
      return new URL(referer).hostname === new URL(req.url).hostname;
    } catch {
      return true;
    }
  }
  try {
    const originUrl = new URL(origin);
    const reqUrl = new URL(req.url);
    if(originUrl.origin === reqUrl.origin || originUrl.hostname === reqUrl.hostname) return true;
    const host = req.headers.get('host') || req.headers.get('x-forwarded-host');
    if(host && originUrl.host === host.split(',')[0].trim()) return true;
  } catch {}
  return false;
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

