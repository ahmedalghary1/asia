export type Words={ar:string;en:string};
export type Category={id:string;name:Words;description:Words};
export type Media={url:string;type:"image"|"video";alt:Words};
export type Campaign={id:string;title:Words;client:Words;description:Words;categoryId:string;cover:string;media:Media[];published:boolean;featured:boolean};
export type Content={settings:{name:string;intro:Words;whatsapp:string;instagram:string;facebook:string;logo:string;heroImages?:string[];heroCampaignId?:string;fontAr?:string;fontEn?:string};categories:Category[];campaigns:Campaign[]};
export type Lang="ar"|"en";
