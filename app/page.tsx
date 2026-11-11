import Link from "next/link";
import { Nav, Footer } from "@/components/SiteChrome";
import { Photo } from "@/components/Photo";

function Seats() {
  return (
    <svg viewBox="0 0 230 230" aria-hidden="true">
      <g>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const free = i >= 6;
          return (
            <circle key={i} cx={(130 + 86 * Math.cos(a)).toFixed(2)} cy={(130 + 86 * Math.sin(a)).toFixed(2)} r={18}
              style={{ fill: free ? "var(--pink)" : "var(--ink)", stroke: "var(--ink)" }} strokeWidth={2.5} strokeDasharray={free ? "5 4" : undefined} />
          );
        })}
      </g>
      <circle cx="130" cy="130" r="58" fill="#FFFFFF" style={{ stroke: "var(--ink)" }} strokeWidth="3" />
    </svg>
  );
}

const FAQ: [string, string][] = [
  ["Preciso conhecer alguém?", "Não. A maioria chega sem conhecer ninguém. Esse é o ponto."],
  ["E se eu tiver alergia ou restrição?", "Você conta na inscrição e o cardápio secreto é pensado com isso em mente. Sem surpresa ruim."],
  ["Posso levar vinho?", "Só se todo mundo da mesa topar. Se alguém não responder, a resposta é não. Ninguém precisa se explicar."],
  ["Posso levar um amigo?", "Mande o seu link de convite. Seu amigo se inscreve e entra na lista como todo mundo. Se quiser, você paga o lugar dele."],
  ["Quanto custa?", "Cada jantar tem sua própria contribuição, que chega junto com o convite, 2 a 3 semanas antes. Ninguém fica de fora por causa disso."],
  ["Onde é?", "No apartamento do Flavio. O endereço vai junto com a confirmação do convite."],
];

export default function Home() {
  return (
    <div className="site">
      <Nav home />
      <main id="top">
        <section className="hero"><div className="wrap">
          <h1 className="caps">Vem que<br />tem lugar.</h1>
          <div className="hero-side">
            <span className="eyebrow">Jantares de sexta para 6 a 8 pessoas</span>
            <p>Não é uma experiência gastronômica, é gente perto de gente. Um apartamento pequeno, uma mesa cheia e comida feita em casa por quem cozinha e serve.</p>
            <div className="hero-cta"><Link className="btn btn-hot" href="/inscricao">Entrar na lista</Link><a className="btn btn-line" href="#como">Como funciona</a></div>
          </div>
        </div></section>

        <section className="strip" aria-label="A mesa em resumo">
          <Photo src="/fotos/mesa-cheia.jpg" alt="Amigos rindo em volta de uma mesa pequena e cheia" caption="Foto: mesa cheia, gente rindo" />
          <div className="tile t-pink"><span>Mesa</span><b>8<br />lugares</b><Seats /></div>
          <Photo src="/fotos/maos-prato.jpg" alt="Mãos passando uma travessa de comida caseira" caption="Foto: mãos passando a travessa" />
          <div className="tile t-lime"><span>Quando</span><b>Sexta,<br />20h</b></div>
          <Photo src="/fotos/brinde.jpg" alt="Copos se encontrando num brinde" caption="Foto: brinde" />
        </section>

        <section className="statement"><div className="wrap">
          <span className="eyebrow">Conforto não é requisito.</span>
          <div>
            <h2>Ninguém lembra do guardanapo de pano. A gente lembra de quem estava do lado, <span className="pinkt">da conversa que esticou</span> <span className="soft">e da risada que veio do nada.</span></h2>
          </div>
          <div className="stats">
            <div className="stat"><b><sup>*</sup>40 m²</b><span>De apartamento, sem salão</span></div>
            <div className="stat"><b><sup>*</sup>6–8</b><span>Pessoas por mesa</span></div>
            <div className="stat"><b><sup>*</sup>0</b><span>Spoilers do cardápio</span></div>
          </div>
        </div></section>

        <section className="black" id="como"><div className="wrap">
          <h2>Como funciona</h2>
          <div className="bento">
            <article className="box big" style={{ background: "var(--pink)" }}>
              <span className="eyebrow tag">Convite</span>
              <h3>Lugares contados, de propósito</h3>
              <p>Entra quem está na lista ou recebeu o link de alguém que já sentou à mesa. Quando enche, enche.</p>
              <div className="seating" aria-label="6 lugares ocupados, 2 livres">{[0,1,2,3,4,5].map(i => <i key={i}></i>)}<i className="free"></i><i className="free"></i></div>
            </article>
            <article className="box" style={{ background: "var(--lime)" }}>
              <span className="eyebrow tag">Sexta, 20h</span>
              <h3>Jantar feito do zero</h3>
              <p>Uma mesa por semana. Você chega, senta e o resto é com a cozinha.</p>
            </article>
            <article className="box dark">
              <span className="eyebrow tag">Cardápio secreto</span>
              <h3>Ninguém sabe o que vem</h3>
              <p>Suas alergias e restrições a gente sabe, e respeita. O resto é surpresa.</p>
            </article>
            <article className="box" style={{ background: "var(--cyan)" }}>
              <span className="eyebrow tag">Depois</span>
              <h3>A mesa continua</h3>
              <p>Grupos que deram liga podem ser chamados de novo. E um dia, quem sabe, você abre a sua casa.</p>
            </article>
          </div>
        </div>
        <div className="quote"><div className="wrap">
          <blockquote>Hospitalidade não precisa de espaço. Precisa de uma cadeira a mais.</blockquote>
          <cite><b>Flavio</b>Anfitrião e cozinheiro</cite>
        </div></div>
        </section>

        <section className="gallery" id="fotos"><div className="wrap">
          <div className="head">
            <span className="eyebrow">Fotos</span>
            <h2>Mesa apertada, conversa comprida.</h2>
            <p>É assim que uma sexta fica: pouca cerimônia, muita gente perto.</p>
          </div>
          <div className="gal">
            <Photo src="/fotos/galeria-1.jpg" alt="Mesa vista de cima com pratos e mãos de várias pessoas" caption="Foto: mesa de cima, pratos e mãos" />
            <Photo src="/fotos/galeria-2.jpg" alt="Duas pessoas conversando de perto à mesa" caption="Foto: conversa de perto" />
            <Photo src="/fotos/galeria-3.jpg" alt="Panela no fogão de uma cozinha pequena" caption="Foto: cozinha pequena" />
            <Photo src="/fotos/galeria-4.jpg" alt="Jogo de cartas no fim do jantar" caption="Foto: jogo depois do jantar" />
            <div className="note"><span className="eyebrow">Primeira mesa</span><b>Natal à mesa, com quem chegar.</b></div>
            <Photo src="/fotos/galeria-5.jpg" alt="Velas e pratos vazios no fim da noite" caption="Foto: fim de noite" />
          </div>
        </div></section>

        <section className="faq-sec" id="combinados"><div className="wrap">
          <h2>Combinados da casa</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div></section>

        <section className="black ready" id="lista"><div className="wrap">
          <h2 className="caps">Quero meu lugar à mesa</h2>
          <ol className="steps">
            <li><span className="n">1</span>Inscreva-se em 2 minutos</li>
            <li><span className="n">2</span>Receba o convite 2 a 3 semanas antes</li>
            <li><span className="n">3</span>Sexta, 20h. Traga só você</li>
          </ol>
          <Link className="btn btn-hot" href="/inscricao" style={{ fontSize: ".95rem", padding: "1.1em 2em" }}>Quero meu lugar à mesa</Link>
          <p style={{ fontSize: ".85rem", color: "#9a9aa3" }}>Seus dados ficam só com o anfitrião. Sem spam, sem grupo de WhatsApp.</p>
        </div></section>
      </main>
      <Footer />
    </div>
  );
}
