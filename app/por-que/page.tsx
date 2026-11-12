import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Por quê" };

export default function Page() {
  return (
    <div className="site">
      <Nav />
      <main>
        <section className="hero"><div className="wrap">
          <h1 className="caps">Por que<br />uma mesa?</h1>
          <div className="hero-side">
            <span className="eyebrow">A ideia</span>
            <p>A gente se acostumou a achar que receber alguém exige casa grande, louça bonita e tempo sobrando. E aí ninguém recebe ninguém. Cada um janta sozinho, com o celular, perto de gente que mora a dez minutos.</p>
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
              <h3>Toda sexta, uma mesa</h3>
              <p>Melhor uma mesa simples toda semana do que um banquete uma vez por ano. Comida feita em casa, cardápio surpresa, música boa e jogos para quem quiser. O anfitrião cozinha e serve; a mesa é de vocês.</p>
            </article>
            <article className="box" style={{ background: "var(--pink)" }}>
              <span className="eyebrow tag">Gente nova</span>
              <h3>6 a 8 pessoas, quase todas desconhecidas</h3>
              <p>Cada mesa é montada à mão a partir da inscrição: idades, momentos de vida e histórias diferentes. Não é encontro de solteiros nem networking. É jantar.</p>
            </article>
            <article className="box dark">
              <span className="eyebrow tag">Dinheiro</span>
              <h3>Ninguém fica de fora</h3>
              <p>Cada jantar tem uma contribuição sugerida para os ingredientes, anônima, que vem no convite. Pague o sugerido, o que puder, ou reserve um lugar para alguém.</p>
            </article>
            <article className="box" style={{ background: "var(--cyan)" }}>
              <span className="eyebrow tag">Pra quem</span>
              <h3>Qualquer pessoa</h3>
              <p>De qualquer crença ou de nenhuma. Recém-chegado na cidade, morando sozinho, com a família longe, ou só com saudade de mesa cheia.</p>
            </article>
            <article className="box" style={{ background: "var(--white)", border: "2px solid #000" }}>
              <span className="eyebrow tag">Como funciona</span>
              <h3>Inscrição, convite, mesa</h3>
              <p>1. Você se inscreve (2 minutos). 2. Quando abrir uma mesa que combina com você, o convite chega no WhatsApp 2 a 3 semanas antes. 3. Você confirma e recebe o endereço. 4. Depois, conta como foi, de forma anônima.</p>
            </article>
            <article className="box" style={{ background: "var(--lime)" }}>
              <span className="eyebrow tag">E depois</span>
              <h3>A mesa se espalha</h3>
              <p>A ideia não é ter um lugar famoso. É que, depois de sentar aqui, você abra a sua porta também. Se cabe em 40 m², cabe na sua casa.</p>
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
