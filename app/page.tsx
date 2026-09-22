import Portfolio from "./portfolio";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    return <Portfolio content={await getContent()} mode="home" />;
  } catch {
    return (
      <main className="unavailable">
        <h1>تعذّر تحميل الموقع</h1>
        <p>حاول مرة أخرى بعد قليل. / Please try again shortly.</p>
        <a href="/">إعادة المحاولة · Retry</a>
      </main>
    );
  }
}
