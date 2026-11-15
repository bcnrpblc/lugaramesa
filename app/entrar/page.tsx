import type { Metadata } from "next";
import { Gate } from "@/components/Gate";
import { EmailForm } from "./EmailForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { guestByToken } from "@/lib/guest";
import { MEMBER_COOKIE } from "@/lib/network";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function Page() {
  // Already remembered on this phone: straight to their page.
  const t = (await cookies()).get(MEMBER_COOKIE)?.value;
  if (t && (await guestByToken(t))) redirect(`/eu/${t}`);
  return (
    <Gate eyebrow="Área de quem já está na mesa" title={<>Entrar.</>}>
      <p>Sem senha. Coloque o e-mail que você usou na inscrição e a gente manda um link para o seu espaço: suas sextas livres, sua foto e seu link de convite.</p>
      <EmailForm />
    </Gate>
  );
}
