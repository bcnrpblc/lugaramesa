import Link from "next/link";

export function Nav({ home = false }: { home?: boolean }) {
  const h = (id: string) => (home ? `#${id}` : `/#${id}`);
  return (
    <>
      {home && <div className="notice"><div className="wrap"><b>Natal</b> A primeira mesa é um jantar de Natal. Entra quem está na lista.</div></div>}
      <header className="nav"><div className="wrap">
        <Link className="logo" href="/"><i aria-hidden="true"></i><span>Um Lugar à Mesa</span></Link>
        <nav className="nav-links" aria-label="Seções">
          <a href={h("como")}>Como funciona</a>
          <Link href="/por-que">Por quê</Link>
          <a href={h("combinados")}>Dúvidas</a>
        </nav>
        <Link className="btn btn-hot" href="/inscricao">Reservar meu lugar</Link>
      </div></header>
    </>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap"><div className="news"><span>Vem que tem lugar.</span><Link className="btn btn-ink" href="/inscricao">Reservar meu lugar</Link></div></div>
      <div className="base"><div className="wrap">
        <span>Um Lugar à Mesa · gente perto de gente, toda sexta.</span>
        <span><Link href="/entrar">Entrar</Link> · <Link href="/por-que">Por quê</Link> · <Link href="/privacidade">Privacidade</Link> · Por convite.</span>
      </div></div>
    </footer>
  );
}
