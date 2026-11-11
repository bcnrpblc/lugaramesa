"use client";
import { useTransition } from "react";
import { setRsvp } from "./actions";

export default function Rsvp({ token, current }: { token: string; current: "pendente" | "sim" | "nao" }) {
  const [pending, start] = useTransition();
  const go = (v: "sim" | "nao") => start(async () => { await setRsvp(token, v); });
  return (
    <div className="flex flex-wrap gap-2.5 mt-3" aria-busy={pending}>
      {current !== "sim" && <button type="button" className="btn" style={{ background: "#000", color: "#fff" }} disabled={pending} onClick={() => go("sim")}>{pending ? "…" : "Vou, guarda meu lugar"}</button>}
      {current !== "nao" && <button type="button" className="btn btn-line" disabled={pending} onClick={() => go("nao")}>{current === "sim" ? "Não vou conseguir ir" : "Não vou conseguir"}</button>}
    </div>
  );
}
