import {admin,getRecord} from '@/lib/content';import Admin from './editor';import LoginForm from './login-form';
export const dynamic='force-dynamic';
export default async function Page(){
  if (!await admin()) return <LoginForm />;
  try{const record=await getRecord();return <Admin initial={record.content} revision={record.revision}/>}catch{return <main className="unavailable">تعذّر تحميل لوحة الإدارة. حاول مرة أخرى. / Unable to load. Please retry.</main>}
}
