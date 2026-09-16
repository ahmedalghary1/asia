import {env} from 'cloudflare:workers';
import {seed} from './seed';
import type {Content} from './model';
import { cookies } from 'next/headers';

export function database(){const db=(env as unknown as {DB:D1Database}).DB;if(!db)throw new Error('Database unavailable');return db;}
export function bucket(){return (env as unknown as {BUCKET:R2Bucket}).BUCKET;}
export async function admin(){
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'true';
}
export async function getRecord(){const row=await database().prepare('SELECT data,revision FROM site_content WHERE id = ?').bind('main').first<{data:string;revision:number}>();return row?{content:JSON.parse(row.data) as Content,revision:row.revision}:{content:structuredClone(seed),revision:0};}
export async function getContent(all=false){const {content}=await getRecord();if(!all)content.campaigns=content.campaigns.filter(c=>c.published);return content;}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
