'use server'

import { cookies } from 'next/headers'
import { env } from 'cloudflare:workers'

export async function loginAction(password: string) {
  const adminPassword = (env as unknown as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD;
  
  if (!adminPassword) {
    return { success: false, error: 'لم يتم إعداد كلمة المرور في الخادم' }
  }

  if (password !== adminPassword) {
    return { success: false, error: 'كلمة المرور غير صحيحة' }
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_session', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
  
  return { success: true }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session')
}
