import Link from "next/link";

/** Full-screen dark page for the invite-only gate and the expired-link page. */
export function Gate({ eyebrow, title, children, codeForm = false, erro }: { eyebrow: string; title: React.ReactNode; children: React.ReactNode; codeForm?: boolean; erro?: string }) {
  return (
    <div className="min-h-[100svh] bg-black text-white flex items-center px-4 py-16">
      <div className="max-w-[720px] w-full min-w-0 mx-auto grid grid-cols-[minmax(0,1fr)] gap-6">
        <Link href="/" className="font-black uppercase tracking-tight flex items-center gap-3" style={{ fontFamily: "var(--display)" }}>
          <i aria-hidden="true" className="inline-block size-3 rounded-full bg-pink" />Um Lugar à Mesa
        </Link>
        <span className="eyebrow text-pink">{eyebrow}</span>
        <h1 className="display uppercase text-[clamp(2.6rem,8vw,5rem)] leading-[.92]">{title}</h1>
        <div className="grid gap-4 text-[#c9c9cf] text-[1.05rem] max-w-[46ch]">{children}</div>
        {codeForm && (
          <form action="/c" method="get" className="grid grid-cols-[minmax(0,1fr)] gap-2 w-full max-w-[420px]">
            <label htmlFor="codigo" className="eyebrow text-[#c9c9cf]">Recebeu um código?</label>
            <div className="flex gap-2">
              <input id="codigo" name="codigo" required maxLength={12} autoComplete="off" autoCapitalize="characters" placeholder="Ex.: 7F3A9C"
                className="w-0 min-w-0 flex-1 rounded-full bg-white/10 px-4 py-3 text-white placeholder:text-white/40 uppercase tracking-widest outline-none focus:bg-white/15" />
              <button className="pill pill-hot shrink-0">Entrar</button>
            </div>
            {erro && <p role="alert" className="text-pink text-sm font-semibold">{erro}</p>}
          </form>
        )}
        <p className="text-sm text-white/50"><Link href="/por-que" className="underline">Por quê</Link> · <Link href="/privacidade" className="underline">Privacidade</Link></p>
      </div>
    </div>
  );
}
