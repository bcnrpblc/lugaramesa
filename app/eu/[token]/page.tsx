import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guestByToken, nextFridays } from "@/lib/guest";
import { Fridays, PhotoBox } from "./Eu";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seu espaço", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await guestByToken(token);
  if (!g) notFound();
  const days = nextFridays(8);
  const marked = await db()`select to_char(day, 'YYYY-MM-DD') as d from availability where guest_id = ${g.id} and day >= ${days[0]}::date`;
  return (
    <div className="site">
      <header className="nav"><div className="wrap">
        <Link className="logo" href="/"><i aria-hidden="true"></i><span>Um Lugar à Mesa</span></Link>
        <span className="eyebrow">Seu espaço</span>
      </div></header>
      <main>
        <section className="hero"><div className="wrap">
          <h1 className="caps">Oi, {g.first}.</h1>
          <div className="hero-side">
            <span className="eyebrow">Só você tem este link</span>
            <p>Guarde esta página. Por aqui você diz quando está livre e, se quiser, manda uma foto.</p>
          </div>
        </div></section>
        <section className="wrap pb-12">
          <div className="bento">
            <article className="box big" style={{ background: "var(--cyan)" }}>
              <span className="eyebrow tag">Sextas livres</span>
              <h3>Quais sextas você consegue?</h3>
              <p>Ajuda a montar as mesas. Não é reserva: o convite ainda chega pelo WhatsApp.</p>
              <Fridays token={token} days={days} initial={marked.map((r) => r.d as string)} />
            </article>
            <article className="box" style={{ background: "var(--white)", border: "2px solid #000" }}>
              <span className="eyebrow tag">Foto (opcional)</span>
              <h3>Pra gente te reconhecer na porta</h3>
              <PhotoBox token={token} hasPhoto={g.has_photo} />
            </article>
          </div>
        </section>
      </main>
      <footer><div className="base"><div className="wrap"><span>Um Lugar à Mesa · gente perto de gente.</span><span><Link href="/privacidade">Privacidade</Link></span></div></div></footer>
    </div>
  );
}
