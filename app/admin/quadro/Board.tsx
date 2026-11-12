"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { boardMove } from "../actions";

export type BCard = { guest_id: string; name: string; age_range: string | null; allergies: string[]; has_photo: boolean; partner?: string | null; free_days?: string[]; tier?: number; invitation_id?: string; status?: string };
export type BTable = { id: string; title: string; when: string; day: string; seats: number; list: BCard[] };
type Drag = { card: BCard; from: string | null }; // from = table id or null (queue)

const TIER = ["nunca veio", "reconvidar", "já convidado", "", "", "", "", "", "", "fora"];
const STATUS: Record<string, string> = { sentado: "não enviado", enviado: "enviado", sim: "confirmado" };

function Face({ c }: { c: BCard }) {
  const ini = c.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return c.has_photo
    ? <img src={`/admin/foto/${c.guest_id}`} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" draggable={false} />
    : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan text-[10px] font-bold">{ini}</span>;
}

export default function Board({ tables, queue }: { tables: BTable[]; queue: BCard[] }) {
  const router = useRouter();
  const drag = useRef<Drag | null>(null); // ref, not state: drop can fire before a re-render
  const [picked, setPicked] = useState<Drag | null>(null); // tap-to-move fallback (phones)
  const [over, setOver] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  const placed = useMemo(() => new Set(tables.flatMap((t) => t.list.map((c) => c.guest_id))), [tables]);
  const pool = queue.filter((c) => !placed.has(c.guest_id) && c.name.toLowerCase().includes(q.toLowerCase()));

  const drop = (d: Drag | null, to: string | null) => {
    setOver(null); drag.current = null; setPicked(null);
    if (!d || d.from === to) return;
    start(async () => {
      const r = await boardMove({ guestId: d.card.guest_id, fromInvitation: d.card.invitation_id ?? null, toTable: to, withPartner: !d.from && !!d.card.partner });
      setErr(r.ok ? null : r.error ?? "Erro.");
      router.refresh();
    });
  };
  const zone = (key: string | null) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(key ?? "fila"); },
    onDragLeave: () => setOver(null),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); drop(drag.current, key); },
  });

  const Card = ({ c, from }: { c: BCard; from: string | null }) => {
    const isPicked = picked?.card.guest_id === c.guest_id && picked.from === from;
    return (
      <li draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", c.guest_id); e.dataTransfer.effectAllowed = "move"; drag.current = { card: c, from }; }} onDragEnd={() => { drag.current = null; setOver(null); }}
        onClick={() => setPicked(isPicked ? null : { card: c, from })}
        className={`flex cursor-grab items-center gap-2 rounded-lg border bg-white p-2 text-sm active:cursor-grabbing ${isPicked ? "border-2 border-ink" : "border-line"}`}>
        <Face c={c} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{c.name}</p>
          <p className="truncate text-[11px] text-muted">
            {[c.age_range, c.status ? STATUS[c.status] : c.tier !== undefined ? TIER[c.tier] : null, c.allergies.some((a) => a !== "nenhuma") ? "⚠ alergia" : null, c.partner ? `+ ${c.partner.split(" ")[0]}` : null].filter(Boolean).join(" · ")}
          </p>
          {!from && c.free_days && c.free_days.some((d) => tables.some((t) => t.day === d)) && (
            <p className="text-[11px] font-bold"><span className="rounded bg-lime px-1">livre {tables.filter((t) => c.free_days!.includes(t.day)).map((t) => t.day.slice(8, 10) + "/" + t.day.slice(5, 7)).join(", ")}</span></p>
          )}
        </div>
      </li>
    );
  };

  return (
    <div aria-busy={pending}>
      {err && <p role="alert" className="mb-3 rounded-card bg-pink px-4 py-2 font-semibold">{err}</p>}
      {picked && <p className="mb-3 rounded-card bg-lime px-4 py-2 text-sm font-semibold">{picked.card.name} selecionado(a): toque em “Soltar aqui” numa mesa{picked.from ? " ou na fila" : ""}.</p>}
      <div className="flex gap-3 overflow-x-auto pb-4">
        <section {...zone(null)} className={`w-64 shrink-0 rounded-card border p-2 ${over === "fila" ? "border-2 border-ink bg-lime/30" : "border-line bg-field"}`}>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-bold">Fila ({pool.length})</h2>
            {picked?.from && <button className="rounded-full border border-ink px-2 text-xs font-bold" onClick={() => drop(picked, null)}>Soltar aqui</button>}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="mb-2 w-full rounded-lg border border-line bg-white px-2 py-1 text-sm" />
          <ul className="grid max-h-[70vh] gap-1.5 overflow-y-auto">{pool.map((c) => <Card key={c.guest_id} c={c} from={null} />)}</ul>
        </section>
        {tables.map((t) => {
          const full = t.list.length >= t.seats;
          return (
            <section key={t.id} {...zone(t.id)} className={`w-64 shrink-0 rounded-card border p-2 ${over === t.id ? "border-2 border-ink bg-lime/30" : "border-line bg-white"}`}>
              <div className="mb-2 px-1">
                <Link href={`/admin/mesa/${t.id}`} className="font-bold hover:underline">{t.title}</Link>
                <p className="text-xs text-muted">{t.when} · <b className={full ? "text-ink" : ""}>{t.list.length}/{t.seats}</b></p>
                {picked && picked.from !== t.id && <button className="mt-1 rounded-full border border-ink px-2 text-xs font-bold" disabled={full} onClick={() => drop(picked, t.id)}>Soltar aqui</button>}
              </div>
              <ul className="grid gap-1.5">
                {t.list.map((c) => <Card key={c.guest_id} c={c} from={t.id} />)}
                {Array.from({ length: Math.max(0, t.seats - t.list.length) }, (_, i) => <li key={i} className="h-12 rounded-lg border border-dashed border-line" />)}
              </ul>
            </section>
          );
        })}
        {!tables.length && <p className="self-center text-muted">Nenhuma mesa futura. Crie uma no calendário.</p>}
      </div>
      <p className="text-xs text-muted">Arraste da fila para uma mesa, entre mesas, ou de volta para a fila (tira da mesa). No celular: toque na pessoa e depois em “Soltar aqui”. Casal arrastado da fila entra junto.</p>
    </div>
  );
}
