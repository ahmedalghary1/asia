import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
export const metadata: Metadata = {title:"ASIA AGENCY | آسيا أجينسي",description:"أفكار تُرى. علامات تُذكر. اكتشف أعمال آسيا أجينسي في التصميم والهوية والتسويق — Creative campaigns, branding and digital marketing.",icons:{icon:"/work/IMG_0154.jpeg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
