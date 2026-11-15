import type { Metadata } from "next";
import { Gate } from "@/components/Gate";
import { EmailForm } from "./EmailForm";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function Page() {
  return (
    <Gate eyebrow="Área de quem já está na mesa" title={<>Entrar.</>}>
      <p>Sem senha. Coloque o e-mail que você usou na inscrição e a gente manda um link para o seu espaço: suas sextas livres, sua foto e seu link de convite.</p>
      <EmailForm />
    </Gate>
  );
}
