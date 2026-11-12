import type { Metadata } from "next";
import { Nav, Footer } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Privacidade" };

// Contato: definir NEXT_PUBLIC_PRIVACY_EMAIL na Vercel. Mudou o texto? Suba a versão aqui e em CONSENT_VERSION (app/inscricao/actions.ts).
const CONTATO = process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "{email_de_contato}";
const VERSAO = "2026-11-v2";

export default function Page() {
  return (
    <div className="site">
      <Nav />
      <main className="faq-sec"><div className="wrap" style={{ maxWidth: 820 }}>
        <span className="eyebrow">Versão {VERSAO}</span>
        <h2 style={{ marginTop: 12 }}>Política de privacidade</h2>
        <div className="grid gap-5 mt-8 text-[1rem] leading-relaxed [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:grid [&_ul]:gap-1">
          <p>O Um Lugar à Mesa é um projeto pessoal, sem fins lucrativos, de jantares em casa. Quem cuida dos seus dados é o anfitrião, Flavio, que é o controlador nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018). O projeto é para maiores de 18 anos.</p>

          <h3>O que coletamos</h3>
          <ul>
            <li><b>Na inscrição:</b> e-mail, nome, WhatsApp, faixa de idade, momento de vida, comidas de que você gosta, o que você não come, se topa vinho, se sexta funciona, respostas sobre receber e ser recebido, se abriria sua casa, um prato que lembra casa e, se quiser, uma “primeira vez” recente.</li>
            <li><b>Alergias e restrições alimentares</b>, se você informar. A lei trata como dado sensível (saúde), por isso pedimos um consentimento separado.</li>
            <li><b>Quem te chamou:</b> o código de convite de quem te indicou, se houver.</li>
            <li><b>Seu par</b>, se vocês se inscreverem juntos: cada pessoa faz a própria inscrição e dá o próprio consentimento. Guardamos só que vocês são um casal, para sentarem juntos. Um não vê os dados do outro.</li>
            <li><b>Sextas livres</b> que você marcar na sua página.</li>
            <li><b>Foto</b>, só se você enviar e autorizar. Ela serve apenas para o anfitrião te reconhecer. Não aparece no site nem para outros convidados.</li>
            <li><b>Indicações:</b> se um convidado te indicar para um lugar que abriu, guardamos quem indicou e se a indicação foi aceita. Quem indicou vê apenas se foi aceita ou não.</li>
            <li><b>Participação:</b> em quais mesas você foi convidado, se confirmou, se compareceu, e anotações internas do anfitrião para organizar as próximas mesas. Também guardamos um histórico dessas mudanças, para nada se perder.</li>
          </ul>

          <h3>O que não coletamos</h3>
          <p>Não usamos cookies de rastreamento nem anúncios. A contribuição é feita por Pix direto, de forma anônima: o site não registra quem pagou nem quanto.</p>

          <h3>Feedback</h3>
          <p>O formulário depois do jantar é anônimo: guardamos apenas a qual mesa a resposta se refere, nunca quem respondeu.</p>

          <h3>Para que usamos</h3>
          <p>Para montar as mesas, mandar convites pelo WhatsApp, preparar o cardápio com segurança e entender se o projeto funciona (números agregados, sem nomes). Alergias e restrições servem só para o cardápio. A foto serve só para reconhecimento. Nada é vendido, usado para marketing ou exibido para outros convidados. Na mesa, os convidados se conhecem pelo primeiro nome, como em qualquer jantar.</p>

          <h3>Base legal</h3>
          <p>Seu consentimento (art. 7º, I). Para alergias e restrições, consentimento específico e destacado (art. 11, I). A foto tem consentimento próprio. Você pode retirar qualquer um deles quando quiser, e o restante continua valendo.</p>

          <h3>Onde ficam e por quanto tempo</h3>
          <p>Os dados ficam em um banco de dados da Supabase, as fotos ficam guardadas na Cloudflare (sem acesso público) e o site roda na Vercel. São empresas que prestam o serviço de hospedagem e podem processar dados fora do Brasil, com as garantias contratuais delas. Só o anfitrião tem acesso. Guardamos enquanto você quiser participar. Se você não participar de nenhuma mesa por 2 anos, apagamos sua inscrição. Se pedir, apagamos tudo em até 15 dias.</p>

          <h3>Seus direitos</h3>
          <p>Você pode pedir acesso a todos os seus dados, correção, exclusão ou a retirada do consentimento a qualquer momento (art. 18). A foto e as sextas livres você mesmo muda ou apaga na sua página pessoal, pelo link que recebeu. Para o resto, escreva para <b>{CONTATO}</b> ou mande uma mensagem no WhatsApp de onde recebeu o convite.</p>
        </div>
      </div></main>
      <Footer />
    </div>
  );
}
