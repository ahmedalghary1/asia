import Portfolio from '../portfolio';import {getContent} from '@/lib/content';
export const dynamic='force-dynamic';
export default async function Page(){return <Portfolio content={await getContent()} mode="work"/>}
