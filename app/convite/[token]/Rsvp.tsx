"use client";
import { useState, useTransition } from "react";
import { setRsvp } from "./actions";

export default function Rsvp({ token, current }: { token: string; current: "pendente" | "sim" | "nao" }) {
  const [pending, start] = useTransition();
  const [full, setFull] = useState(false);
  const go = (v: "sim" | "nao") => start(async () => { const r = await setRsvp(token, v); setFull(!!(r as { full?: boolean }).full); });
  if (full) return <p className="mt-3 font-semibold">Esse lugar já foi passado pra outra pessoa. Fala com o anfitrião pelo WhatsApp que a gente vê a próxima mesa.</p>;
  return (
    <div className="flex flex-wrap gap-2.5 mt-3" aria-busy={pending}>
      {current !== "sim" && <button type="button" className="btn" style={{ background: "#000", color: "#fff" }} disabled={pending} onClick={() => go("sim")}>{pending ? "…" : "Vou, guarda meu lugar"}</button>}
      {current !== "nao" && <button type="button" className="btn btn-line" disabled={pending} onClick={() => go("nao")}>{current === "sim" ? "Não vou conseguir ir" : "Não vou conseguir"}</button>}
    </div>
  );
}
