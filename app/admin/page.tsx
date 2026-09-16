import {admin,getRecord} from '@/lib/content';import Admin from './editor';
export const dynamic='force-dynamic';
export default async function Page(){try{const record=await getRecord();return <Admin initial={record.content} revision={record.revision}/>}catch{return <main className="unavailable">تعذّر تحميل لوحة الإدارة. حاول مرة أخرى. / Unable to load. Please retry.</main>}}
