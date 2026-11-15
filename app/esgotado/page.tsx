import type { Metadata } from "next";
import { Gate } from "@/components/Gate";
import { LINK_CAP } from "@/lib/network";

export const metadata: Metadata = { title: "Convite esgotado", robots: { index: false } };

export default function Page() {
  return (
    <Gate eyebrow="Convite esgotado" title={<>Esse convite<br />já encheu.</>} codeForm>
      <p>A mesa é só por convite, e cada link vale para {LINK_CAP} pessoas. Esse já foi usado {LINK_CAP} vezes.</p>
      <p>Peça o link para outra pessoa que já está na mesa. Cada um tem o seu.</p>
    </Gate>
  );
}
