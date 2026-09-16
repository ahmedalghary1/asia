import type {Content} from './model';
export const arabicFonts=['Arial','Tahoma','Cairo','IBM Plex Sans Arabic'] as const;
export const englishFonts=['Arial','Inter','Montserrat','Georgia'] as const;
export function heroImages(content:Content):string[]{if(content.settings.heroImages?.length===3)return content.settings.heroImages;const c=content.campaigns.find(c=>c.featured&&c.published)||content.campaigns.find(c=>c.published);const images=c?.media.filter(m=>m.type==='image').slice(0,3).map(m=>m.url)||[];while(images.length<3)images.push(c?.cover||content.settings.logo);return images;}
export function siteFont(ar?:string,en?:string){return `"ASIA ${englishFonts.includes(en as typeof englishFonts[number])?en:'Arial'}", "${arabicFonts.includes(ar as typeof arabicFonts[number])?ar:'Arial'}", sans-serif`;}
