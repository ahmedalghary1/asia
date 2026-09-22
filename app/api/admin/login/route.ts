

import { verifyAdminLogin, createSessionCookie, sameOrigin } from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return Response.json({ success: false, error: 'طلب غير صالح' }, { status: 403 });
  }

  try {
    const body = await req.json() as { username?: string; password?: string };
    const result = await verifyAdminLogin(body.username || '', body.password || '');

    if (!result.success || !result.sessionToken) {
      return Response.json({ success: false, error: result.error || 'فشل تسجيل الدخول' }, { status: 401 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createSessionCookie(result.sessionToken)
      }
    });
  } catch (err: any) {
    return Response.json({ success: false, error: 'خطأ في معالجة الطلب: ' + (err?.message || '') }, { status: 500 });
  }
}
