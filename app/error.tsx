'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="unavailable"><h1>تعذّر تحميل الصفحة</h1><p>حاول مرة أخرى بعد قليل. / Please try again shortly.</p><button className="pill" onClick={reset}>إعادة المحاولة / Retry</button><a href="/">العودة للرئيسية / Home</a></main>}
