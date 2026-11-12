import Link from "next/link";
import { logout } from "@/app/admin/actions";

export function Shell({ children, title, erro, ok }: { children: React.ReactNode; title: string; erro?: string; ok?: boolean }) {
  return (
    <div className="min-h-dvh bg-cream text-ink">
      <header className="sticky top-0 z-10 bg-ink text-white">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 text-sm font-semibold">
          <Link href="/admin" className="eyebrow">Um Lugar à Mesa</Link>
          <Link href="/admin" className="opacity-80 hover:opacity-100">Calendário</Link>
          <Link href="/admin/pessoas" className="opacity-80 hover:opacity-100">Pessoas</Link>
          <form action={logout} className="ml-auto"><button className="opacity-60 hover:opacity-100">Sair</button></form>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="display mb-5 text-3xl md:text-4xl">{title}</h1>
        {erro && <p role="alert" className="mb-4 rounded-card bg-pink px-4 py-3 font-semibold">{erro}</p>}
        {ok && <p className="mb-4 rounded-card bg-lime px-4 py-3 font-semibold">Salvo.</p>}
        {children}
      </main>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-card border border-line bg-white p-4 ${className}`}>{children}</section>;
}

export const input = "w-full rounded-lg border border-line bg-field px-3 py-2 text-base";
export const btn = "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition hover:-translate-y-px";
export const btnInk = `${btn} bg-ink text-white`;
export const btnLine = `${btn} border-2 border-ink`;
export const btnHot = `${btn} bg-pink text-ink`;
export const btnSmall = "rounded-full border border-ink px-3 py-1 text-xs font-bold hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-30";
