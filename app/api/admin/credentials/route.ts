import { admin, getAdminCredentials, updateAdminCredentials, createSessionCookie, sameOrigin } from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!await admin(req)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const creds = await getAdminCredentials();
    return Response.json({ success: true, username: creds.username });
  } catch (err: any) {
    return Response.json({ success: false, error: err?.message || 'Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return Response.json({ success: false, error: 'طلب غير صالح' }, { status: 403 });
  }

  if (!await admin(req)) {
    return Response.json({ success: false, error: 'انتهت الجلسة أو تم تسجيل الدخول ببيانات جديدة من جهاز آخر. يرجى تسجيل الدخول مرة أخرى.' }, { status: 401 });
  }

  try {
    const body = await req.json() as { currentPassword?: string; newUsername?: string; newPassword?: string };
    const result = await updateAdminCredentials(
      body.currentPassword || '',
      body.newUsername || '',
      body.newPassword || ''
    );

    if (!result.success || !result.sessionToken) {
      return Response.json({ success: false, error: result.error || 'فشل التحديث' }, { status: 400 });
    }

    return new Response(JSON.stringify({
      success: true,
      message: result.message || 'تم تحديث اسم المستخدم وكلمة المرور بنجاح وتسجيل خروج الأجهزة الأخرى'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createSessionCookie(result.sessionToken)
      }
    });
  } catch (err: any) {
    return Response.json({ success: false, error: 'خطأ في حفظ البيانات: ' + (err?.message || '') }, { status: 500 });
  }
}
