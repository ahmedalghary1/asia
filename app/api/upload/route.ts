import {admin,sameOrigin,saveMedia} from '@/lib/content';

export async function POST(req:Request){
  if(!sameOrigin(req)||!await admin()){
    return Response.json({error:'Unauthorized'},{status:403});
  }
  try{
    const form=await req.formData();
    const file=form.get('file');
    if(!(file instanceof File)||file.size>25*1024*1024){
      return Response.json({error:'Maximum file size: 25 MB'},{status:400});
    }
    if(!file.type.startsWith('image/')&&!file.type.startsWith('video/')){
      return Response.json({error:'Use Image or Video'},{status:400});
    }
    const id=crypto.randomUUID();
    const buffer=await file.arrayBuffer();
    await saveMedia(id, buffer, file.type);
    return Response.json({
      url:'/api/media/'+id,
      type:file.type.startsWith('video')?'video':'image'
    });
  }catch (e: any) {
    console.error('Upload failed error:', e);
    return Response.json({error: e?.message || 'Upload failed. Please retry.'},{status:500});
  }
}

