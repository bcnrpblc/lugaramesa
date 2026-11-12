import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/SiteChrome";
import { CopyButton } from "@/components/CopyButton";
import { siteUrl } from "@/lib/format";

export const metadata: Metadata = { title: "Você está na lista", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string; n?: string; p?: string; g?: string; i?: string }> }) {
  const { c = "", n = "", p = "", g = "", i = "" } = await searchParams;
  const gtok = /^[a-z0-9]{16,40}$/.test(g) ? g : "";
  const par = p.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const parLink = `${siteUrl()}/inscricao?par=${par}`;
  const parWa = `https://wa.me/?text=${encodeURIComponent(`Me inscrevi no Um Lugar à Mesa. Faz a sua por este link pra gente ir junto: ${parLink}`)}`;
  const code = c.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const name = n.replace(/[<>&"]/g, "").slice(0, 40);
  const link = `${siteUrl()}/inscricao?ref=${code}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`Tem lugar pra você numa mesa: jantar de sexta, 6 a 8 pessoas, comida feita em casa. Usa meu convite: ${link}`)}`;
  return (
    <div className="site">
      <Nav />
      <main>
        <section className="hero"><div className="wrap">
          <h1 className="caps">Tem lugar<br />pra você{name ? `, ${name}` : ""}.</h1>
          <div className="hero-side">
            <span className="eyebrow">Inscrição recebida</span>
            {i === "1" && <p><b>Sua indicação foi para o anfitrião.</b> Se der certo, o convite chega no seu WhatsApp.</p>}
            {gtok && <p><Link className="link" href={`/eu/${gtok}`}>Seu espaço: marque suas sextas livres e mande uma foto (opcional).</Link> Guarde este link.</p>}
            <p>Você está na lista. Quando abrir uma mesa que combina com você, o convite chega no seu WhatsApp, 2 a 3 semanas antes.</p>
            <Link className="btn btn-line" href="/">Voltar ao início</Link>
          </div>
        </div></section>
        {code && (
          <section className="black"><div className="wrap" style={{ paddingBlock: 64 }}>
            <div className="bento">
              <article className="box big" style={{ background: "var(--lime)" }}>
                <span className="eyebrow tag">Seu convite</span>
                <h3>Chame até 2 pessoas</h3>
                <p>Quem entra com o seu link vai para a lista como todo mundo. Seu código: <b style={{ letterSpacing: ".08em" }}>{code}</b></p>
                <p style={{ fontSize: ".85rem", wordBreak: "break-all", background: "#fff", borderRadius: 8, padding: ".6em .8em" }}>{link}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="btn btn-hot" href={wa} target="_blank" rel="noopener">Mandar no WhatsApp</a>
                  <CopyButton text={link} label="Copiar link" className="btn btn-line" />
                </div>
              </article>
              {par && (
                <article className="box" style={{ background: "var(--cyan)" }}>
                  <span className="eyebrow tag">Vem em casal?</span>
                  <h3>Seu par faz a própria inscrição</h3>
                  <p>Cada um responde as suas alergias e preferências. Por este link vocês ficam ligados e sentam juntos.</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <a className="btn btn-line" href={parWa} target="_blank" rel="noopener">Mandar pro meu par</a>
                    <CopyButton text={parLink} label="Copiar link" className="btn btn-line" />
                  </div>
                </article>
              )}
              <article className="box dark">
                <span className="eyebrow tag">Até lá</span>
                <h3>Nada pra fazer</h3>
                <p>Sem grupo, sem app. O cardápio é segredo e suas restrições já estão anotadas.</p>
              </article>
            </div>
          </div></section>
        )}
      </main>
      <Footer />
    </div>
  );
}
