import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/SiteChrome";
import { Photo } from "@/components/Photo";
import { Rolodex } from "@/components/Rolodex";

const description = "Conforto não é requisito para hospitalidade. Por que uma mesa pequena, toda sexta, com gente que ainda não se conhece.";
export const metadata: Metadata = { title: "Por quê", description, openGraph: { title: "Por que uma mesa?", description, locale: "pt_BR", type: "article" } };

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

        <section className="manifesto">
          <Photo src="/fotos/manifesto.avif" priority alt="Pessoas rindo em volta de uma mesa simples, com luz quente" caption="Foto: pessoas rindo em volta de uma mesa simples, luz quente e natural" />
          <div className="wrap">
            <span className="eyebrow">A aposta</span>
            <h2>Conforto não é requisito para hospitalidade. Proximidade é o que faz uma noite ficar na memória.</h2>
            <p>O mundo lá fora está barulhento, dividido e cansativo. No meio desse caos, a mesa sempre foi o lugar mais seguro do mundo.</p>
            <p>É onde a vida desacelera, onde a abundância não está no luxo dos pratos, mas na fartura das risadas e na escuta atenta.</p>
            <p>Aqui, a mesa funciona como uma ponte de experiências reais, e não como um pódio para discursos.</p>
            <p>Não importa de onde você vem ou o que pensa: duas coisas são pedidas a quem chega: um coração aberto para novas conexões e uma dose inteira de gratidão.</p>
            <Link className="btn btn-hot" href="/inscricao">Reservar meu lugar</Link>
          </div>
        </section>

        <section className="black"><div className="wrap">
          <h2 className="stack-head">Os combinados</h2>
          <Rolodex className="bento bento-stack">
            <article className="box big t-lime">
              <span className="eyebrow tag">Simples e frequente</span>
              <h3>Toda sexta, uma mesa</h3>
              <p>Melhor uma mesa simples toda semana do que um banquete uma vez por ano. Comida feita em casa, cardápio surpresa, música boa e jogos para quem quiser. O anfitrião cozinha e serve; a mesa é de vocês.</p>
            </article>
            <article className="box t-pink">
              <span className="eyebrow tag">Gente nova</span>
              <h3>6 a 8 pessoas, quase todas desconhecidas</h3>
              <p>Cada mesa é montada à mão a partir da inscrição: idades, momentos de vida e histórias diferentes. Não é encontro de solteiros nem networking. É jantar.</p>
            </article>
            <article className="box dark">
              <span className="eyebrow tag">Dinheiro</span>
              <h3>Ninguém fica de fora</h3>
              <p>Cada jantar tem uma contribuição sugerida para os ingredientes, anônima, que chega um dia depois do jantar. Pague o sugerido, o que puder, ou reserve um lugar para alguém.</p>
            </article>
            <article className="box t-cyan">
              <span className="eyebrow tag">Pra quem</span>
              <h3>Qualquer pessoa</h3>
              <p>De qualquer crença ou de nenhuma. Recém-chegado na cidade, morando sozinho, com a família longe, ou só com saudade de mesa cheia.</p>
            </article>
            <article className="box t-white">
              <span className="eyebrow tag">Como funciona</span>
              <h3>Inscrição, convite, mesa</h3>
              <p>1. Você se inscreve (2 minutos). 2. Quando abrir uma mesa que combina com você, o convite chega no WhatsApp 2 a 3 semanas antes. 3. Você confirma e recebe o endereço. 4. Depois, conta como foi, de forma anônima.</p>
            </article>
            <article className="box t-lime">
              <span className="eyebrow tag">E depois</span>
              <h3>A mesa se espalha</h3>
              <p>A ideia não é ter um lugar famoso. É que, depois de sentar aqui, você abra a sua porta também. Se cabe em 40 m², cabe na sua casa.</p>
            </article>
          </Rolodex>
        </div></section>

        <section className="black ready"><div className="wrap">
          <h2 className="caps">Quero meu lugar à mesa</h2>
          <Link className="btn btn-hot btn-lg" href="/inscricao">Reservar meu lugar</Link>
        </div></section>
      </main>
      <Footer />
    </div>
  );
}
