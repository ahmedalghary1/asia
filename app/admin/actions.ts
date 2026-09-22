'use server'

import { cookies } from 'next/headers'
import { database, admin } from '@/lib/content'
import { env } from 'cloudflare:workers'

interface CredentialsRow {
  username: string;
  password: string;
}

async function getStoredCredentials(): Promise<CredentialsRow> {
  const defaultUser = 'admin';
  const defaultPass = (env as unknown as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD || 'asiakhalil@1234';

  try {
    const db = database();
    const row = await db.prepare('SELECT username, password FROM admin_credentials WHERE id = ?')
      .bind('primary')
      .first<CredentialsRow>();

    if (row && row.username && row.password) {
      return { username: row.username, password: row.password };
    }
  } catch (e) {
    console.warn('Could not query admin_credentials from DB, using defaults:', e);
  }

  return { username: defaultUser, password: defaultPass };
}

export async function loginAction(username: string, password: string) {
  if (!username || !password) {
    return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }

  const credentials = await getStoredCredentials();

  const userMatch = username.trim().toLowerCase() === credentials.username.trim().toLowerCase();
  const passMatch = password === credentials.password;

  if (!userMatch || !passMatch) {
    return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_session', 'true', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax'
  });

  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return { success: true };
}

export async function getAdminProfile() {
  if (!await admin()) {
    return { success: false, error: 'Unauthorized' };
  }
  const credentials = await getStoredCredentials();
  return { success: true, username: credentials.username };
}

export async function updateCredentialsAction(currentPassword: string, newUsername: string, newPassword: string) {
  if (!await admin()) {
    return { success: false, error: 'غير مصرح لك بتغيير البيانات' };
  }

  if (!currentPassword || !newUsername || !newPassword) {
    return { success: false, error: 'يرجى ملء جميع الحقول المطلوبة' };
  }

  if (newUsername.trim().length < 3) {
    return { success: false, error: 'اسم المستخدم يجب ألا يقل عن 3 أحرف' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'كلمة المرور يجب ألا تقل عن 6 خانات' };
  }

  const credentials = await getStoredCredentials();
  if (currentPassword !== credentials.password) {
    return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
  }

  try {
    const db = database();
    await db.prepare(
      `INSERT INTO admin_credentials(id, username, password, updated_at)
       VALUES('primary', ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET username=excluded.username, password=excluded.password, updated_at=excluded.updated_at`
    ).bind(newUsername.trim(), newPassword, Date.now()).run();

    return { success: true, message: 'تم تحديث اسم المستخدم وكلمة المرور بنجاح' };
  } catch (e: any) {
    console.error('Error updating credentials:', e);
    return { success: false, error: 'تعذر حفظ البيانات في قاعدة البيانات: ' + (e?.message || '') };
  }
}
