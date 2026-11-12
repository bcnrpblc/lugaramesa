"use client";
import { useRef, useState, useTransition } from "react";
import { deletePhoto, savePhoto, toggleDay } from "./actions";

const fmt = (d: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(d + "T12:00:00Z"));

/** Resize to max 480px, JPEG 0.82 — keeps the stored photo ~40-60 KB. */
async function toJpeg(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 480 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

export function Fridays({ token, days, initial }: { token: string; days: string[]; initial: string[] }) {
  const [on, setOn] = useState(new Set(initial));
  const [, start] = useTransition();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {days.map((d) => {
        const sel = on.has(d);
        return (
          <button key={d} type="button" className="choice justify-center" aria-pressed={sel}
            onClick={() => {
              const next = new Set(on); if (sel) next.delete(d); else next.add(d); setOn(next);
              start(async () => { const r = await toggleDay(token, d, !sel); if (!r.ok) setOn(on); });
            }}>
            {sel ? "✓ " : ""}Sex {fmt(d)}
          </button>
        );
      })}
    </div>
  );
}

export function PhotoBox({ token, hasPhoto }: { token: string; hasPhoto: boolean }) {
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [v, setV] = useState(0);
  const [has, setHas] = useState(hasPhoto);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-3">
      {has && <img src={`/eu/${token}/foto?v=${v}`} alt="Sua foto" className="h-32 w-32 rounded-full object-cover" />}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        <span>Autorizo guardar minha foto <b>só</b> para o anfitrião me reconhecer. Ela não aparece no site nem para outros convidados, e posso apagar quando quiser.</span>
      </label>
      <input ref={input} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          start(async () => {
            setMsg(null);
            try {
              const r = await savePhoto(token, await toJpeg(f), consent);
              if (r.ok) { setHas(true); setV((x) => x + 1); setMsg("Foto salva."); } else setMsg(r.error ?? "Erro.");
            } catch { setMsg("Não conseguimos ler essa imagem. Tenta outra?"); }
            if (input.current) input.current.value = "";
          });
        }} />
      <div className="flex flex-wrap gap-2.5">
        <button type="button" className="btn btn-hot" disabled={!consent || pending} onClick={() => input.current?.click()}>
          {pending ? "Enviando…" : has ? "Trocar foto" : "Enviar foto"}
        </button>
        {has && <button type="button" className="btn btn-line" disabled={pending}
          onClick={() => start(async () => { await deletePhoto(token); setHas(false); setMsg("Foto apagada."); })}>Apagar foto</button>}
      </div>
      {msg && <p className="text-sm font-semibold" role="status">{msg}</p>}
    </div>
  );
}
