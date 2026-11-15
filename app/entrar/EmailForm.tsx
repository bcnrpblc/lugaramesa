"use client";
import { useState } from "react";
import { requestLink } from "./actions";

export function EmailForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  if (state === "sent")
    return <p className="rounded-2xl bg-white/10 p-4 text-white">Se esse e-mail estiver na lista, o link chega em instantes. Abra no celular e pronto. Olhe também o spam.</p>;
  return (
    <form
      className="grid grid-cols-[minmax(0,1fr)] gap-2 w-full max-w-[420px]"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy"); setError(null);
        const r = await requestLink(email);
        if (r.ok) setState("sent"); else { setError(r.error ?? "Erro."); setState("idle"); }
      }}>
      <label htmlFor="email" className="eyebrow text-[#c9c9cf]">Seu e-mail da inscrição</label>
      <div className="flex gap-2">
        <input id="email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com"
          className="w-0 min-w-0 flex-1 rounded-full bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:bg-white/15" />
        <button className="pill pill-hot shrink-0" disabled={state === "busy"}>{state === "busy" ? "…" : "Mandar link"}</button>
      </div>
      {error && <p role="alert" className="text-pink text-sm font-semibold">{error}</p>}
    </form>
  );
}
