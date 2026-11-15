import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guestByToken, nextFridays } from "@/lib/guest";
import { Fridays, PhotoBox } from "./Eu";
import { CopyButton } from "@/components/CopyButton";
import { siteUrl } from "@/lib/format";
import { LINK_CAP } from "@/lib/network";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seu espaço", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await guestByToken(token);
  if (!g) notFound();
  const days = nextFridays(8);
  const link = `${siteUrl()}/c/${g.referral_code}`;
  const left = Math.max(0, LINK_CAP - g.link_used);
  const wa = `https://wa.me/?text=${encodeURIComponent(`Tem lugar pra você numa mesa: jantar de sexta, 6 a 8 pessoas, comida feita em casa. É só por convite, e esse é o meu: ${link}`)}`;
  const marked = await db()`select to_char(day, 'YYYY-MM-DD') as d from availability where guest_id = ${g.id} and day >= ${days[0]}::date`;
  return (
    <div className="site">
      <header className="nav"><div className="wrap">
        <Link className="logo" href="/"><i aria-hidden="true"></i><span>Um Lugar à Mesa</span></Link>
        <span className="eyebrow">Seu espaço</span>
      </div></header>
      <main>
        <section className="hero"><div className="wrap">
          <h1 className="caps">Oi, {g.first}!</h1>
          <div className="hero-side">
            <span className="eyebrow">Só você tem este link</span>
            <p>Por aqui você diz quando está livre, manda uma foto se quiser e pega seu link de convite. Perdeu este link? Entre de novo em <Link className="link" href="/entrar">/entrar</Link> com seu e-mail.</p>
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
            <article className="box" style={{ background: "var(--lime)" }}>
              <span className="eyebrow tag">Seu convite</span>
              {left > 0 ? (<>
                <h3>Ainda vale para {left} {left === 1 ? "pessoa" : "pessoas"}</h3>
                <p>A mesa é só por convite. Seu link vale para {LINK_CAP} pessoas e depois expira. Entrar na lista não garante lugar: o anfitrião monta cada mesa.</p>
                <p style={{ fontSize: ".85rem", wordBreak: "break-all", background: "#fff", borderRadius: 8, padding: ".6em .8em" }}>{link}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="btn btn-hot" href={wa} target="_blank" rel="noopener">Mandar no WhatsApp</a>
                  <CopyButton text={link} label="Copiar link" className="btn btn-line" />
                </div>
              </>) : (<>
                <h3>Seu link já encheu</h3>
                <p>{LINK_CAP} pessoas entraram pelo seu convite. Obrigado por espalhar.</p>
              </>)}
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
