import Link from "next/link";
import { Nav, Footer } from "@/components/SiteChrome";
import { Photo } from "@/components/Photo";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Burst } from "@/components/Burst";
import { Seating, Unblur } from "@/components/ComoMotion";
import { Strip } from "@/components/Strip";
import { Squeeze } from "@/components/Squeeze";
import { db } from "@/lib/db";

export const revalidate = 300; // "Próxima mesa" card: refresh seat count every 5 min

const TZ = "America/Sao_Paulo";
/** Next upcoming table and its open seats (active = not removed, not declined; same rule as the admin). null if none or DB unavailable. */
async function nextTable(): Promise<{ when: string; open: number } | null> {
  try {
    const [t] = await db()<{ starts_at: Date; open: number }[]>`
      select t.starts_at, t.seats - count(i.*) filter (where i.removed_at is null and i.rsvp <> 'nao')::int as open
      from dinner_tables t left join invitations i on i.table_id = t.id
      where t.starts_at > now() group by t.id order by t.starts_at limit 1`;
    if (!t) return null;
    const wd = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long" }).format(t.starts_at).split("-")[0];
    const dm = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" }).format(t.starts_at);
    return { when: `${wd[0].toUpperCase()}${wd.slice(1)}, ${dm}`, open: Math.max(0, t.open) };
  } catch {
    return null;
  }
}
import { HostTeaser } from "@/components/Host";

function Seats() {
  return (
    <svg viewBox="0 0 260 260" aria-hidden="true">
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
  ["Preciso conhecer alguém?", "Não. A maioria chega sem conhecer ninguém. Esse é exatamente o ponto."],
  ["E se eu tiver alergia ou restrição?", "Você avisa na inscrição e o cardápio secreto é pensado com isso em mente. Zero surpresa ruim."],
  ["Posso levar vinho?", "Só se todo mundo da mesa topar. Se alguém não responder, a resposta é não. Ninguém precisa se explicar."],
  ["Posso levar um amigo?", "Mande o seu link de convite. Seu amigo se inscreve e entra na lista como todo mundo. Se quiser, você paga o lugar dele."],
  ["Quanto custa?", "Não cobramos entrada. Cada mesa tem sua própria contribuição, que chega um dia depois do jantar. Ninguém fica de fora por causa disso."],
  ["Onde é?", "No apartamento do Flavio. O endereço vai junto com a confirmação do convite."],
];

export default async function Home() {
  const next = await nextTable();
  return (
    <div className="site">
      <Nav home />
      <main id="top">
        <section className="hero"><div className="wrap">
          <h1 className="caps">Vem que<br />tem lugar.</h1>
          <div className="hero-side">
            <span className="eyebrow">Jantares às Sextas para um punhado de pessoas</span>
            <p>Não é uma experiência gastronômica, é gente perto de gente. Aqui, a porta está aberta para 6 a 8 pessoas que querem trocar a pressa do mundo por uma noite de boa comida e conversas reais.</p>
            <div className="hero-cta"><Link className="btn btn-hot" href="/inscricao">Reservar meu lugar</Link><a className="btn btn-line" href="#como">Como funciona</a></div>
          </div>
        </div></section>

        <Strip label="A mesa em resumo">
          <Photo src="/fotos/mesa-cheia.jpg" alt="Amigos rindo em volta de uma mesa pequena e cheia" caption="Foto: mesa cheia, gente rindo" />
          <div className="tile t-pink"><span>Mesa</span><b>8<br />lugares</b><Seats /></div>
          <Photo src="/fotos/maos-prato.jpg" alt="Mãos passando uma travessa de comida caseira" caption="Foto: mãos passando a travessa" />
          <div className="tile t-lime"><span>Quando</span><b>Às<br />Sextas,<br />20h</b></div>
          <Photo src="/fotos/brinde.jpg" alt="Copos se encontrando num brinde" caption="Foto: brinde" />
          <div className="tile t-cyan"><span>Cardápio</span><b>Zero<br />spoilers</b></div>
          <Photo src="/fotos/Jantar aconchegante entre amigos.png" alt="Amigos jantando juntos num ambiente aconchegante" caption="Foto: jantar aconchegante entre amigos" />
        </Strip>

        <section className="statement"><div className="wrap">
          <div>
            <ScrollReveal parts={[
              { text: "Ninguém lembra do que foi servido. A gente lembra de quando desconhecidos chegaram à mesa sem pressa," },
              { text: "da conversa que esticou além da conta", hot: true },
              { text: "e" },
              { text: "das histórias que surgem", hot: true },
              { text: "quando a gente desacelera." },
            ]} />
          </div>
        </div></section>

        <section className="black" id="como"><div className="wrap">
          <h2>Como funciona</h2>
          <div className="bento">
            <article className="box big t-pink">
              <span className="eyebrow tag">Convite</span>
              <h3>Lugares contados, de propósito</h3>
              <p>Entra quem está na lista ou recebeu o link de alguém que já sentou à mesa. Quando enche, enche.</p>
              <Seating />
            </article>
            <article className="box t-lime">
              <span className="eyebrow tag">Às Sextas, 20h</span>
              <h3>Jantar feito do zero</h3>
              <p>Uma mesa por semana. O anfitrião cozinha, serve e cuida de tudo. Você só precisa chegar.</p>
            </article>
            <article className="box t-white">
              <span className="eyebrow tag">Cardápio</span>
              <Unblur>
                <h3>Ninguém sabe o que vem</h3>
                <p>O cardápio é surpresa e feito do zero. A comida aqui é só o pretexto pra chegar à mesa.</p>
              </Unblur>
            </article>
            <article className="box t-cyan">
              <span className="eyebrow tag">A intenção</span>
              <h3>Presença</h3>
              <p>A intenção não é mudar o mundo em uma noite. É só lembrar que, fora das telas e da pressa, ainda existem pessoas reais prontas para uma boa conversa.</p>
            </article>
          </div>
        </div>
        <div className="quote"><div className="wrap">
          <blockquote>Hospitalidade não precisa de espaço. Precisa de uma cadeira a mais.</blockquote>
          <cite><b>Flavio</b>Anfitrião</cite>
        </div></div>
        </section>

        <section className="gallery" id="fotos"><div className="wrap">
          <div className="head">
            <span className="eyebrow">Fotos</span>
            <h2>Mesa apertada, conversa comprida.</h2>
            <p>É assim que uma sexta fica: pouca cerimônia, muita gente perto.</p>
          </div>
          <Squeeze className="gal">
            <Photo src="/fotos/galeria-1.jpg" alt="Mesa vista de cima com pratos e mãos de várias pessoas" caption="Foto: mesa de cima, pratos e mãos" />
            <Photo src="/fotos/galeria-2.jpg" alt="Duas pessoas conversando de perto à mesa" caption="Foto: conversa de perto" />
            <Photo src="/fotos/galeria-3.jpg" alt="Panela no fogão de uma cozinha pequena" caption="Foto: cozinha pequena" />
            <Photo src="/fotos/galeria-4.jpg" alt="Jogo de cartas no fim do jantar" caption="Foto: jogo depois do jantar" />
            <div className="note">
              <span className="eyebrow">Próxima mesa</span>
              <b>{next ? next.when : "Em breve"}</b>
              <p>
                {!next ? "Entre na lista e o convite chega no WhatsApp."
                  : next.open === 0 ? "Mesa cheia. Entre na lista para a próxima."
                  : `Restam ${next.open} ${next.open === 1 ? "lugar" : "lugares"}.`}
                <Link className="link" href="/inscricao">{next && next.open > 0 ? "Reservar meu lugar" : "Entrar na lista"}</Link>
              </p>
            </div>
            <Photo src="/fotos/galeria-5.jpg" alt="Velas e pratos vazios no fim da noite" caption="Foto: fim de noite" />
          </Squeeze>
        </div></section>

        <HostTeaser />

        <section className="faq-sec" id="combinados"><div className="wrap">
          <h2>Tem alguma dúvida?</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div></section>

        <Burst id="lista">
          <h2 className="caps">Quero meu lugar à mesa</h2>
          <Link className="btn btn-hot btn-lg" href="/inscricao">Reservar meu lugar</Link>
          <ol className="steps">
            <li><span className="n">1</span>Inscreva-se em 2 minutos</li>
            <li><span className="n">2</span>Receba o convite 2 a 3 semanas antes</li>
            <li><span className="n">3</span>Vem pra mesa!</li>
          </ol>
          <p className="fine">Seus dados ficam só com o anfitrião. Sem spam, sem grupo de WhatsApp.</p>
        </Burst>
      </main>
      <Footer />
    </div>
  );
}
