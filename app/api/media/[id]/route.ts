import {readMedia} from '@/lib/content';

export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    if(!/^[a-f0-9-]{36}$/.test(id)){
      return new Response('Not found',{status:404});
    }

    const media = await readMedia(id);
    if(!media){
      return new Response('Not found',{status:404});
    }

    const headers = new Headers({
      'Content-Type': media.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
      'ETag': `"${id}"`
    });

    // Check If-None-Match for 304 Not Modified
    if(req.headers.get('if-none-match') === `"${id}"`){
      return new Response(null, { status: 304, headers });
    }

    const isArrayBuffer = media.data instanceof ArrayBuffer;
    const totalSize = media.size || (isArrayBuffer ? (media.data as ArrayBuffer).byteLength : undefined);

    const rangeHeader = req.headers.get('range');
    if(rangeHeader && isArrayBuffer && totalSize !== undefined){
      const buffer = media.data as ArrayBuffer;
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if(start >= totalSize || end >= totalSize || start > end){
        headers.set('Content-Range', `bytes */${totalSize}`);
        return new Response(null, { status: 416, headers });
      }

      const chunk = buffer.slice(start, end + 1);
      headers.set('Content-Range', `bytes ${start}-${end}/${totalSize}`);
      headers.set('Content-Length', String(chunk.byteLength));
      return new Response(chunk, { status: 206, headers });
    }

    if(totalSize !== undefined){
      headers.set('Content-Length', String(totalSize));
    }

    return new Response(media.data as BodyInit, { status: 200, headers });
  }catch (e) {
    console.error('Error serving media:', e);
    return new Response('Unavailable',{status:503});
  }
}

