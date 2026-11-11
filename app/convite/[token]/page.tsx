import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvite } from "@/lib/invite";
import { fmtBRL, fmtDate, fmtTime, siteUrl } from "@/lib/format";
import { CopyButton } from "@/components/CopyButton";
import Rsvp from "./Rsvp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seu convite", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvite(token);
  if (!inv) notFound();

  const start = new Date(inv.starts_at);
  const ended = Date.now() > start.getTime() + inv.duration_min * 60000;
  const amount = fmtBRL(inv.suggested_amount);
  const yes = inv.rsvp === "sim";
  const refLink = `${siteUrl()}/inscricao?ref=${inv.referral_code}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`Tem lugar pra você numa mesa: jantar de sexta, 6 a 8 pessoas, comida feita em casa. Usa meu convite: ${refLink}`)}`;

  return (
    <div className="site">
      <header className="nav"><div className="wrap">
        <Link className="logo" href="/"><i aria-hidden="true"></i><span>Um Lugar à Mesa</span></Link>
        <span className="eyebrow">Convite pessoal</span>
      </div></header>

      <main>
        <section className="hero"><div className="wrap">
          <h1 className="caps">Vem que tem<br />lugar, {inv.guest_name}.</h1>
          <div className="hero-side">
            <span className="eyebrow">{inv.title}</span>
            <p>Uma mesa pequena, {inv.seats} lugares e comida feita em casa. O cardápio é segredo, mas suas restrições já estão anotadas.</p>
          </div>
        </div></section>

        <section className="wrap" aria-label="Quando">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="tile t-pink min-h-[170px]"><span>Quando</span><b className="!text-[clamp(1.6rem,3vw,2.3rem)]">{fmtDate(start)}</b></div>
            <div className="tile t-lime min-h-[170px]"><span>Hora</span><b>{fmtTime(start)}</b></div>
            <div className="tile t-cyan min-h-[170px]"><span>Mesa</span><b>{inv.confirmed} de {inv.seats}<br /><span className="!text-[1rem] !font-semibold normal-case tracking-normal">confirmados</span></b></div>
          </div>
        </section>

        <section className="wrap py-12">
          <div className="bento">
            <article className="box big" style={{ background: yes ? "var(--lime)" : inv.rsvp === "nao" ? "#ECECEF" : "var(--pink)" }}>
              <span className="eyebrow tag">Confirmação</span>
              {yes ? (
                <>
                  <h3>Seu lugar está guardado.</h3>
                  {inv.address ? (
                    <div className="grid gap-1">
                      <p className="eyebrow">Endereço</p>
                      <p className="text-[1.15rem] font-semibold">{inv.address}</p>
                      {inv.address_notes && <p>{inv.address_notes}</p>}
                      <a className="link mt-2" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inv.address)}`} target="_blank" rel="noopener">Abrir no mapa</a>
                    </div>
                  ) : (
                    <p>O endereço chega por aqui em breve.</p>
                  )}
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    <a className="btn btn-line" href={`/convite/${inv.token}/calendario`}>Pôr na agenda</a>
                  </div>
                </>
              ) : inv.rsvp === "nao" ? (
                <><h3>Fica para a próxima.</h3><p>Sem problema. Se mudar de ideia, ainda dá tempo.</p></>
              ) : (
                <><h3>Você vem?</h3><p>Confirme para ver o endereço. Se não der, avise: o lugar vai para outra pessoa.</p></>
              )}
              {!ended && <Rsvp token={inv.token} current={inv.rsvp} />}
            </article>

            <article className="box dark">
              <span className="eyebrow tag">Contribuição</span>
              {amount ? <h3>Contribuição sugerida: {amount}</h3> : <h3>Contribuição livre</h3>}
              <p>Cobre os ingredientes. Ninguém fica de fora por dinheiro. Contribua o sugerido, contribua o que puder, ou reserve um lugar à mesa para alguém. A contribuição é anônima, via Pix.</p>
              {inv.pix_key && (
                <div className="grid gap-2 mt-1">
                  <p className="eyebrow">Chave Pix</p>
                  <p className="font-semibold break-all bg-white/10 rounded-lg px-3 py-2">{inv.pix_key}</p>
                  <div><CopyButton text={inv.pix_key} label="Copiar chave Pix" className="btn btn-hot" /></div>
                </div>
              )}
            </article>

            {inv.wine_ok && inv.wine_note && (
              <article className="box" style={{ background: "var(--cyan)" }}>
                <span className="eyebrow tag">Vinho liberado</span>
                <h3>A mesa toda topou</h3>
                <p>{inv.wine_note}</p>
              </article>
            )}

            {ended ? (
              <article className="box" style={{ background: "var(--lime)" }}>
                <span className="eyebrow tag">Depois</span>
                <h3>Como foi a noite?</h3>
                <p>2 minutos, anônimo. Ninguém sabe quem respondeu o quê.</p>
                <div><Link className="btn btn-hot" href={`/feedback/${inv.public_id}`}>Contar como foi</Link></div>
              </article>
            ) : (
              <article className="box" style={{ background: "var(--white)", border: "2px solid #000" }}>
                <span className="eyebrow tag">Chame alguém</span>
                <h3>Conhece quem precisa de uma mesa?</h3>
                <p>Seu link coloca a pessoa na lista para as próximas mesas.</p>
                <div className="flex flex-wrap gap-2.5"><a className="btn btn-hot" href={wa} target="_blank" rel="noopener">Mandar no WhatsApp</a><CopyButton text={refLink} label="Copiar link" className="btn btn-line" /></div>
              </article>
            )}
          </div>
        </section>
      </main>

      <footer><div className="base"><div className="wrap"><span>Um Lugar à Mesa · gente perto de gente.</span><span><Link href="/privacidade">Privacidade</Link></span></div></div></footer>
    </div>
  );
}
