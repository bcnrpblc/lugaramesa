import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell, Card, input, btnInk, btnLine, btnSmall } from "@/components/admin/Shell";
import { TableFields } from "@/components/admin/TableForm";
import { QueueItem } from "@/components/admin/QueueItem";
import { CopyButton } from "@/components/CopyButton";
import { requireAdmin, shortDate, STATUS_LABEL, STATUS_COLOR } from "@/lib/admin";
import { getQueue, getSeats, getTable, tableWarnings, type Seat } from "@/lib/admin-data";
import { siteUrl } from "@/lib/format";
import { markSent, removeSeat, saveAfter, sendWhatsapp, setRsvp, updateTable } from "../../actions";

const AGES = ["18-24", "25-34", "35-44", "45-54", "55+"];

function Hidden({ s }: { s: Seat }) {
  return <input type="hidden" name="invitation_id" value={s.invitation_id} />;
}

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; ok?: string; q?: string; f?: string; idade?: string; todos?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const t = await getTable(id);
  if (!t) notFound();
  const seats = await getSeats(t.id);
  const active = seats.filter((s) => ["sentado", "enviado", "sim"].includes(s.status));
  const full = active.length >= t.seats;
  const past = t.starts_at.getTime() < Date.now();
  const replaced = new Set(seats.filter((s) => s.replaces_id && s.status !== "removido").map((s) => s.replaces_id));
  const openDropouts = seats.filter((s) => s.status === "nao" && !replaced.has(s.invitation_id));
  const [queue, suggestions] = await Promise.all([
    getQueue({ excludeTable: t.id, q: sp.q, tier: sp.f, idade: AGES.includes(sp.idade || "") ? sp.idade : undefined, all: sp.todos === "1" }),
    openDropouts.length && !full ? getQueue({ excludeTable: t.id, limit: 5 }) : Promise.resolve([]),
  ]);
  const feedbackUrl = `${siteUrl()}/feedback/${t.public_id}`;

  return (
    <Shell title={t.title} erro={sp.erro} ok={sp.ok === "1"}>
      <p className="-mt-3 mb-5 font-semibold text-muted">
        {shortDate(t.starts_at)} · {active.filter((s) => s.status === "sim").length} confirmados · {active.length}/{t.seats} na mesa
        {t.is_pilot && " · piloto"}
      </p>

      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <div className="grid content-start gap-5">
          <Card>
            <h2 className="mb-2 font-bold">Checagem da mesa</h2>
            <ul className="grid gap-1 text-sm">
              {tableWarnings(seats, t.seats).map((w, i) => <li key={i} className={w.level === "warn" ? "font-semibold" : "text-muted"}>{w.level === "warn" ? "⚠ " : ""}{w.text}</li>)}
            </ul>
          </Card>

          {openDropouts.length > 0 && !full && (
            <Card className="border-2 border-pink">
              <h2 className="mb-1 font-bold">Substituir: {openDropouts.map((s) => s.name.split(" ")[0]).join(", ")} não vem</h2>
              <p className="mb-3 text-sm text-muted">Próximos da fila. Um toque senta a pessoa; depois é só mandar o WhatsApp.</p>
              <ul className="grid gap-2">
                {suggestions.map((g) => <QueueItem key={g.id} g={g} tableId={t.id} replacesId={openDropouts[0].invitation_id} full={full} />)}
                {!suggestions.length && <li className="text-sm text-muted">Fila vazia.</li>}
              </ul>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 font-bold">Lugares</h2>
            <ul className="grid gap-3">
              {seats.filter((s) => s.status !== "removido").map((s) => (
                <li key={s.invitation_id} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/admin/pessoas/${s.guest_id}`} className="font-bold hover:underline">{s.name}</Link>
                      <p className="text-xs text-muted">{[s.age_range, s.life_stage, s.wine === "sim" ? "vinho ok" : "sem vinho", s.past_tables ? `veio ${s.past_tables}x` : "primeira vez"].filter(Boolean).join(" · ")}</p>
                      {s.allergies.some((a) => a !== "nenhuma") && <p className="text-xs font-semibold">⚠ {s.allergies.filter((a) => a !== "nenhuma").join(", ")}{s.allergy_notes ? ` (${s.allergy_notes})` : ""}</p>}
                      {s.never_eats && <p className="text-xs">Não come: {s.never_eats}</p>}
                      {s.life_answer && <p className="mt-1 text-xs italic">“{s.life_answer}”</p>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {s.status !== "nao" && (
                      <form action={sendWhatsapp}><Hidden s={s} /><button className={btnSmall}>{s.sent_at ? "Reenviar WhatsApp" : "Enviar no WhatsApp"}</button></form>
                    )}
                    <CopyButton text={`${siteUrl()}/convite/${s.token}`} label="Copiar link" className={btnSmall} />
                    {!s.sent_at && s.status === "sentado" && (
                      <form action={markSent}><Hidden s={s} /><button className={btnSmall}>Já mandei</button></form>
                    )}
                    <form action={setRsvp} className="flex items-center gap-1">
                      <Hidden s={s} />
                      <select name="rsvp" defaultValue={s.rsvp} className="rounded-full border border-ink px-2 py-1 text-xs">
                        <option value="pendente">Sem resposta</option><option value="sim">Vem</option><option value="nao">Não vem</option>
                      </select>
                      <button className={btnSmall}>ok</button>
                    </form>
                    <form action={removeSeat}><Hidden s={s} /><button className="text-xs text-muted underline">tirar da mesa</button></form>
                  </div>

                  {past && s.status === "sim" && (
                    <form action={saveAfter} className="mt-3 grid gap-2 rounded-lg bg-field p-3 text-sm sm:grid-cols-3">
                      <Hidden s={s} />
                      <label className="grid gap-1">Veio?
                        <select name="attended" defaultValue={s.attended === null ? "" : s.attended ? "sim" : "nao"} className={input}>
                          <option value="">—</option><option value="sim">Sim</option><option value="nao">Não</option>
                        </select></label>
                      <label className="grid gap-1">Nota (privada)
                        <select name="host_rating" defaultValue={s.host_rating ?? ""} className={input}>
                          <option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select></label>
                      <label className="grid gap-1">Reconvidar?
                        <select name="reinvite" defaultValue={s.reinvite === null ? "" : s.reinvite ? "sim" : "nao"} className={input}>
                          <option value="">—</option><option value="sim">Sim</option><option value="nao">Não</option>
                        </select></label>
                      <label className="grid gap-1 sm:col-span-3">Nota sobre a pessoa nessa mesa
                        <textarea name="host_note" rows={2} defaultValue={s.host_note ?? ""} className={input} /></label>
                      <button className={`${btnInk} sm:col-span-3`}>Salvar</button>
                    </form>
                  )}
                </li>
              ))}
              {!seats.some((s) => s.status !== "removido") && <li className="text-sm text-muted">Ninguém ainda. Escolha da fila ao lado.</li>}
            </ul>
            {seats.some((s) => s.status === "removido") && (
              <details className="mt-3 text-sm text-muted">
                <summary className="cursor-pointer">Removidos ({seats.filter((s) => s.status === "removido").length})</summary>
                <ul className="mt-2 grid gap-1">{seats.filter((s) => s.status === "removido").map((s) => <li key={s.invitation_id}>{s.name}</li>)}</ul>
              </details>
            )}
          </Card>

          <Card>
            <h2 className="mb-2 font-bold">Depois do jantar</h2>
            <p className="mb-2 text-sm text-muted">Link do feedback anônimo (mande no grupo ou um a um):</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-field px-2 py-1 text-xs">{feedbackUrl}</code>
              <CopyButton text={feedbackUrl} label="Copiar" className={btnSmall} />
            </div>
          </Card>

          <Card>
            <details>
              <summary className="cursor-pointer font-bold">Editar mesa (data, endereço, Pix, cardápio)</summary>
              <form action={updateTable} className="mt-4 grid gap-4">
                <input type="hidden" name="table_id" value={t.id} />
                <TableFields t={t} />
                <button className={btnInk}>Salvar mesa</button>
              </form>
            </details>
          </Card>
        </div>

        <aside className="grid content-start gap-3">
          <Card>
            <h2 className="mb-2 font-bold">Fila {full && <span className="text-sm font-normal text-muted">(mesa cheia)</span>}</h2>
            <form className="mb-3 grid gap-2">
              <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar nome ou WhatsApp" className={input} />
              <div className="flex flex-wrap gap-2">
                <select name="f" defaultValue={sp.f ?? ""} className="rounded-full border border-ink px-2 py-1 text-xs">
                  <option value="">Todos na fila</option><option value="novos">Nunca vieram</option><option value="reconvite">Reconvidar</option>
                </select>
                <select name="idade" defaultValue={sp.idade ?? ""} className="rounded-full border border-ink px-2 py-1 text-xs">
                  <option value="">Qualquer idade</option>{AGES.map((a) => <option key={a}>{a}</option>)}
                </select>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="todos" value="1" defaultChecked={sp.todos === "1"} /> incluir fora</label>
                <button className={btnSmall}>Filtrar</button>
              </div>
            </form>
            <ol className="grid gap-2">
              {queue.map((g) => <QueueItem key={g.id} g={g} tableId={t.id} full={full} />)}
              {!queue.length && <li className="text-sm text-muted">Ninguém com esse filtro.</li>}
            </ol>
          </Card>
          <Link href="/admin" className={btnLine}>Voltar ao calendário</Link>
        </aside>
      </div>
    </Shell>
  );
}
