import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Por quê" };

// DRAFT copy — Flavio to rewrite (open item in the plan).
export default function Page() {
  return (
    <div className="site">
      <Nav />
      <main>
        <section className="hero"><div className="wrap">
          <h1 className="caps">Por que<br />uma mesa?</h1>
          <div className="hero-side">
            <span className="eyebrow">A ideia</span>
            <p>A gente se acostumou a achar que receber alguém exige casa grande, louça bonita e tempo sobrando. E aí ninguém recebe ninguém.</p>
          </div>
        </div></section>

        <section className="statement"><div className="wrap">
          <span className="eyebrow">A aposta</span>
          <div>
            <h2>Conforto não é requisito para hospitalidade. <span className="pinkt">Proximidade é o que faz uma noite ficar na memória.</span> <span className="soft">Por isso 40 m², 8 cadeiras e nenhum salão.</span></h2>
          </div>
        </div></section>

        <section className="black"><div className="wrap">
          <h2>Os combinados</h2>
          <div className="bento">
            <article className="box big" style={{ background: "var(--lime)" }}>
              <span className="eyebrow tag">Simples e frequente</span>
              <h3>Toda sexta, a mesa abre</h3>
              <p>Melhor uma mesa simples toda semana do que um banquete uma vez por ano. Comida feita em casa, música boa, jogos para quem quiser.</p>
            </article>
            <article className="box" style={{ background: "var(--pink)" }}>
              <span className="eyebrow tag">Gente nova</span>
              <h3>6 a 8 pessoas que não se conhecem</h3>
              <p>As mesas são montadas a partir da inscrição. Quem deu liga pode ser chamado de novo.</p>
            </article>
            <article className="box dark">
              <span className="eyebrow tag">Dinheiro</span>
              <h3>Ninguém fica de fora</h3>
              <p>Cada jantar tem uma contribuição sugerida para os ingredientes, anônima. Quem pode, contribui mais e reserva um lugar para alguém.</p>
            </article>
            <article className="box" style={{ background: "var(--cyan)" }}>
              <span className="eyebrow tag">E depois</span>
              <h3>A mesa se espalha</h3>
              <p>Se der certo aqui, dá certo na sua casa também.</p>
            </article>
          </div>
        </div></section>

        <section className="black ready"><div className="wrap">
          <h2 className="caps">Quero meu lugar à mesa</h2>
          <Link className="btn btn-hot" href="/inscricao">Entrar na lista</Link>
        </div></section>
      </main>
      <Footer />
    </div>
  );
}
