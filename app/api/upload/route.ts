import {admin,sameOrigin,saveMedia} from '@/lib/content';

export async function POST(req:Request){
  const isAdmin = await admin(req);
  if(!isAdmin){
    return Response.json({error:'جلسة الإدارة منتهية أو غير مصرح بها. يرجى تسجيل الدخول مجددًا.'},{status:403});
  }
  if(!sameOrigin(req)){
    return Response.json({error:'طلب من مصدر غير مصرح به (Cross-Origin)'},{status:403});
  }
  try{
    const form=await req.formData();
    const file=form.get('file');
    if(!(file instanceof File)){
      return Response.json({error:'لم يتم إرسال ملف صحيح'},{status:400});
    }
    if(file.size > 30 * 1024 * 1024){
      return Response.json({error:'حجم الملف يتجاوز 30 ميجابايت'},{status:400});
    }

    // Determine content type safely
    let contentType = file.type;
    const name = (file.name || '').toLowerCase();
    if (!contentType || contentType === 'application/octet-stream') {
      if (name.endsWith('.jpg') || name.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (name.endsWith('.png')) contentType = 'image/png';
      else if (name.endsWith('.webp')) contentType = 'image/webp';
      else if (name.endsWith('.gif')) contentType = 'image/gif';
      else if (name.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (name.endsWith('.mp4')) contentType = 'video/mp4';
      else if (name.endsWith('.webm')) contentType = 'video/webm';
      else if (name.endsWith('.heic')) contentType = 'image/heic';
      else if (name.endsWith('.avif')) contentType = 'image/avif';
      else if (name.endsWith('.jfif')) contentType = 'image/jpeg';
    }

    const isImage = contentType.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|heic|avif|jfif)$/i.test(file.name);
    const isVideo = contentType.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg)$/i.test(file.name);

    if(!isImage && !isVideo){
      return Response.json({error:'نوع الملف غير مدعوم. يرجى استخدام صورة أو فيديو.'},{status:400});
    }

    if (!contentType) {
      contentType = isImage ? 'image/jpeg' : 'video/mp4';
    }

    const id=crypto.randomUUID();
    const buffer=await file.arrayBuffer();
    await saveMedia(id, buffer, contentType);
    return Response.json({
      url:'/api/media/'+id,
      type:isVideo ? 'video' : 'image'
    });
  }catch (e: any) {
    console.error('Upload failed error:', e);
    return Response.json({error: e?.message || 'فشل رفع الملف إلى التخزين السحابي'},{status:500});
  }
}

