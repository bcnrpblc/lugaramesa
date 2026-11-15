import type { Metadata } from "next";
import { Gate } from "@/components/Gate";

export const metadata: Metadata = { title: "Só por convite" };

export default async function Page({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const { codigo } = await searchParams;
  return (
    <Gate eyebrow="Jantar de sexta · 6 a 8 pessoas" title={<>Só por<br />convite.</>} codeForm
      erro={codigo === "invalido" ? "Não achamos esse código. Confere com quem te chamou." : undefined}>
      <p>Uma mesa pequena, comida feita em casa e gente perto de gente.</p>
      <p>Por enquanto, só entra quem recebe o link de alguém que já está na mesa. Se alguém te chamou, abra o link que você recebeu.</p>
    </Gate>
  );
}
