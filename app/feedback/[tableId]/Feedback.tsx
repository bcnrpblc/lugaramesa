"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Flow, { type Step } from "@/components/Flow";
import { submitFeedback } from "./actions";

const SNT = [{ value: "sim", label: "Sim" }, { value: "talvez", label: "Talvez" }, { value: "nao", label: "Não" }];

const STEPS: Step[] = [
  { id: "welcome", kind: "scale", title: "Você se sentiu bem-vindo(a)?", scaleLabels: ["Nem um pouco", "Muito"] },
  { id: "real_talk", kind: "single", title: "Você conversou de verdade com alguém novo?", options: [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }] },
  { id: "again", kind: "single", title: "Jantaria com essa mesa de novo?", options: SNT },
  { id: "reconnect_count", kind: "single", title: "Quantas pessoas da mesa você quer reencontrar?", options: [
    { value: "0", label: "Nenhuma" }, { value: "1", label: "1" }, { value: "2-3", label: "2 ou 3" }, { value: "4+", label: "4 ou mais" }] },
  { id: "space", kind: "single", title: "O espaço pequeno atrapalhou?", options: [
    { value: "nada", label: "Nada" }, { value: "um-pouco", label: "Um pouco" }, { value: "muito", label: "Muito" }] },
  { id: "food", kind: "scale", title: "E a comida?", scaleLabels: ["Fraca", "Incrível"] },
  { id: "would_host", kind: "single", title: "Você toparia receber pessoas na sua casa?", options: SNT },
  { id: "one_word", kind: "text", optional: true, title: "Uma palavra para a noite", placeholder: "Uma palavra", maxLength: 40 },
  { id: "change", kind: "textarea", optional: true, title: "O que você mudaria?", help: "Pode ser sincero. É anônimo de verdade.", placeholder: "Escreva à vontade" },
];

export default function Feedback({ tableId, label }: { tableId: string; label: string }) {
  const key = `ulam-fb-${tableId}`;
  const [done, setDone] = useState(false);
  useEffect(() => { try { if (localStorage.getItem(key)) setDone(true); } catch {} }, [key]);

  if (done)
    return (
      <div className="min-h-[100svh] bg-black text-white flex items-center px-4">
        <div className="max-w-[720px] mx-auto grid gap-5">
          <span className="eyebrow text-pink">Resposta recebida</span>
          <h1 className="display uppercase text-[clamp(2.6rem,8vw,5rem)]">Obrigado por sentar com a gente.</h1>
          <p className="text-[#c9c9cf]">Sua resposta é anônima e vai ajudar a próxima mesa a ser ainda melhor.</p>
          <div><Link className="pill pill-hot" href="/">Voltar ao início</Link></div>
        </div>
      </div>
    );

  return (
    <Flow
      steps={STEPS}
      submitLabel="Enviar"
      intro={<p className="eyebrow mb-5 text-muted">{label} · anônimo · 2 minutos</p>}
      onSubmit={async (v) => {
        const r = await submitFeedback(tableId, v as Record<string, unknown>);
        if (!r.ok) return r.error || "Erro.";
        try { localStorage.setItem(key, "1"); } catch {}
        setDone(true);
        return null;
      }}
    />
  );
}
