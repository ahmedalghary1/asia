import Portfolio from '@/app/portfolio';import {getContent} from '@/lib/content';import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const content=await getContent();if(!content.categories.some(c=>c.id===id))notFound();return <Portfolio content={content} mode="service" id={id}/>}
