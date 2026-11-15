import type { Metadata } from "next";
import { Gate } from "@/components/Gate";
import { Finish } from "./Finish";

export const metadata: Metadata = { title: "Entrando", robots: { index: false } };

export default function Page() {
  return (
    <Gate eyebrow="Entrar" title={<>Um<br />instante.</>}>
      <Finish />
    </Gate>
  );
}
