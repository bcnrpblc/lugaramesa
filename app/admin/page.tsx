import Link from "next/link";
import { Shell, Card, btnInk, btnLine } from "@/components/admin/Shell";
import { TableFields } from "@/components/admin/TableForm";
import { requireAdmin, dayKey, STATUS_LABEL, STATUS_COLOR } from "@/lib/admin";
import { getSeats, getTable, monthTables, tableWarnings, type TableRow } from "@/lib/admin-data";
import { fmtTime } from "@/lib/format";
import { createTable } from "./actions";

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const WEEK = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const pad = (n: number) => String(n).padStart(2, "0");

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string; t?: string; erro?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const today = dayKey(new Date());
  const [y, m] = (/^\d{4}-\d{2}$/.test(sp.m || "") ? sp.m! : today.slice(0, 7)).split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // monday-first
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  const tables = await monthTables(`${y}-${pad(m)}-01T00:00:00-03:00`, `${next}-01T00:00:00-03:00`);
  const byDay = new Map<string, TableRow[]>();
  tables.forEach((t) => { const k = dayKey(t.starts_at); byDay.set(k, [...(byDay.get(k) || []), t]); });

  const snapT = sp.t ? await getTable(sp.t) : null;
  const snapSeats = snapT ? await getSeats(snapT.id) : [];
  const defaultFriday = (() => {
    const d = new Date(); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
    return dayKey(d);
  })();

  return (
    <Shell title="Calendário" erro={sp.erro}>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <Link href={`/admin?m=${prev}`} className="px-2 text-xl" aria-label="Mês anterior">‹</Link>
            <h2 className="text-lg font-bold capitalize">{MONTHS[m - 1]} {y}</h2>
            <Link href={`/admin?m=${next}`} className="px-2 text-xl" aria-label="Próximo mês">›</Link>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-muted">
            {WEEK.map((w) => <div key={w}>{w}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: lead }, (_, i) => <div key={`x${i}`} />)}
            {Array.from({ length: days }, (_, i) => {
              const k = `${y}-${pad(m)}-${pad(i + 1)}`;
              const ts = byDay.get(k) || [];
              const isFri = (lead + i) % 7 === 4;
              return (
                <div key={k} className={`min-h-[64px] rounded-lg border p-1 text-left text-xs ${k === today ? "border-ink" : "border-line"} ${isFri ? "bg-cyan/40" : ""}`}>
                  <div className="font-semibold text-muted">{i + 1}</div>
                  {ts.map((t) => (
                    <Link key={t.id} href={`/admin?m=${y}-${pad(m)}&t=${t.id}`}
                      className={`mt-0.5 block rounded px-1 py-0.5 font-bold leading-tight ${sp.t === t.id ? "bg-ink text-white" : "bg-lime"}`}>
                      {fmtTime(t.starts_at)} · {t.confirmed}/{t.seats}
                      <span className="block font-normal opacity-70">{t.active} na mesa</span>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">Número = confirmados / lugares. Sextas em azul.</p>
        </Card>

        <div className="grid content-start gap-5">
          {snapT ? (
            <Card>
              <p className="eyebrow text-muted">Resumo</p>
              <h2 className="text-xl font-bold">{snapT.title}</h2>
              <p className="mb-3 text-sm text-muted">{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" }).format(snapT.starts_at)}</p>
              <ul className="mb-3 grid gap-1">
                {snapSeats.filter((s) => s.status !== "removido").map((s) => (
                  <li key={s.invitation_id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{s.name}{s.allergies.some((a) => a !== "nenhuma") ? " ⚠" : ""}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                  </li>
                ))}
                {!snapSeats.length && <li className="text-sm text-muted">Ninguém sentado ainda.</li>}
              </ul>
              <ul className="mb-4 grid gap-1 text-sm">
                {tableWarnings(snapSeats, snapT.seats).map((w, i) => <li key={i} className={w.level === "warn" ? "font-semibold" : "text-muted"}>{w.level === "warn" ? "⚠ " : ""}{w.text}</li>)}
              </ul>
              <Link href={`/admin/mesa/${snapT.id}`} className={btnInk}>Montar mesa</Link>
            </Card>
          ) : (
            <Card><p className="text-sm text-muted">Toque numa mesa do calendário para ver quem está nela.</p></Card>
          )}
          <Card>
            <details>
              <summary className="cursor-pointer font-bold">+ Nova mesa</summary>
              <form action={createTable} className="mt-4 grid gap-4">
                <TableFields defaultDate={defaultFriday} />
                <button className={btnInk}>Criar mesa</button>
              </form>
            </details>
          </Card>
          <Link href="/admin/pessoas" className={btnLine}>Ver todas as pessoas</Link>
        </div>
      </div>
    </Shell>
  );
}
