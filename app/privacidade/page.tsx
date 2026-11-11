import type { Metadata } from "next";
import { Nav, Footer } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Privacidade" };

// DRAFT — revisar antes do go-live. Preencher CONTATO.
const CONTATO = process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "{email_de_contato}";

export default function Page() {
  return (
    <div className="site">
      <Nav />
      <main className="faq-sec"><div className="wrap" style={{ maxWidth: 820 }}>
        <span className="eyebrow">Versão 2026-11-v1</span>
        <h2 style={{ marginTop: 12 }}>Política de privacidade</h2>
        <div className="grid gap-5 mt-8 text-[1rem] leading-relaxed [&_h3]:mt-4">
          <p>O Um Lugar à Mesa é um projeto pessoal, sem fins lucrativos, de jantares em casa. Quem cuida dos seus dados é o anfitrião, Flavio, que é o controlador nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
          <h3>O que coletamos</h3>
          <p>Na inscrição: e-mail, nome, WhatsApp, faixa de idade, momento de vida, preferências e o que você não come, se topa vinho, disponibilidade, respostas sobre receber e ser recebido, e quem te indicou. Se você informar, também alergias e restrições alimentares, que a lei trata como dado pessoal sensível (saúde).</p>
          <h3>Para que usamos</h3>
          <p>Para montar as mesas, mandar convites, preparar o cardápio com segurança e entender se o projeto funciona. Alergias e restrições são usadas apenas para o cardápio. Nada é vendido, compartilhado com terceiros para marketing ou exibido para outros convidados.</p>
          <h3>Base legal</h3>
          <p>Seu consentimento (art. 7º, I), e, para alergias e restrições, consentimento específico e destacado (art. 11, I). Você pode retirar o consentimento quando quiser.</p>
          <h3>Feedback</h3>
          <p>O formulário depois do jantar é anônimo: guardamos apenas a qual mesa a resposta se refere, nunca quem respondeu.</p>
          <h3>Onde ficam e por quanto tempo</h3>
          <p>Em um banco de dados hospedado pela Supabase, com acesso restrito ao anfitrião. Guardamos enquanto você quiser participar. Se pedir, apagamos tudo em até 15 dias.</p>
          <h3>Seus direitos</h3>
          <p>Você pode pedir acesso, correção, exclusão ou a retirada do consentimento a qualquer momento (art. 18). Escreva para <b>{CONTATO}</b> ou mande uma mensagem no WhatsApp de onde recebeu o convite.</p>
        </div>
      </div></main>
      <Footer />
    </div>
  );
}
