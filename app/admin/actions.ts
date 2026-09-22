'use server'

import { cookies } from 'next/headers'
import { admin, getAdminCredentials, verifyAdminLogin, updateAdminCredentials } from '@/lib/content'

export async function loginAction(username: string, password: string) {
  const result = await verifyAdminLogin(username, password);
  if (!result.success || !result.sessionToken) {
    return { success: false, error: result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_session', result.sessionToken, {
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
  const credentials = await getAdminCredentials();
  return { success: true, username: credentials.username };
}

export async function updateCredentialsAction(currentPassword: string, newUsername: string, newPassword: string) {
  if (!await admin()) {
    return { success: false, error: 'انتهت الجلسة أو تم تسجيل الدخول ببيانات جديدة من جهاز آخر' };
  }

  const result = await updateAdminCredentials(currentPassword, newUsername, newPassword);
  if (!result.success || !result.sessionToken) {
    return { success: false, error: result.error || 'فشل التحديث' };
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_session', result.sessionToken, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax'
  });

  return { success: true, message: result.message };
}
