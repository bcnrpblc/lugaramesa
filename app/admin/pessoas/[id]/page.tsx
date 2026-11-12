import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell, Card, input, btnInk, btnSmall } from "@/components/admin/Shell";
import { requireAdmin, shortDate, STATUS_LABEL, STATUS_COLOR } from "@/lib/admin";
import { db } from "@/lib/db";
import { linkPartner, saveGuest, unlinkPartner } from "../../actions";

const LABELS: Record<string, string> = {
  email: "E-mail", whatsapp: "WhatsApp", age_range: "Idade", life_stage: "Momento", friday_ok: "Sexta funciona",
  wine: "Vinho", never_eats: "Não come", would_host: "Abriria a casa", cooks_for_groups: "Cozinha p/ grupos", home_dish: "Prato que lembra casa", foods: "Comidas favoritas",
  life_answer: "Uma primeira vez recente", base_hosted: "Recebeu (3 meses)", base_been_hosted: "Foi recebido (3 meses)", base_friends: "Amigos/mês",
};

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string; ok?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sql = db();
  const [g] = await sql`select g.*, r.name as referrer from guests g left join guests r on r.id = g.referred_by where g.id = ${id}`;
  if (!g) notFound();
  const [partner, invites, log, others] = await Promise.all([
    g.party_id ? sql`select id, name from guests where party_id = ${g.party_id} and id <> ${id}` : Promise.resolve([]),
    sql`select i.id, i.status, i.attended, i.host_rating, i.host_note, i.reinvite, t.id as table_id, t.title, t.starts_at
        from invitations i join dinner_tables t on t.id = i.table_id where i.guest_id = ${id} order by t.starts_at desc`,
    sql`select at, kind, changes from event_log where guest_id = ${id} order by at desc limit 30`,
    g.party_id ? Promise.resolve([]) : sql`select id, name from guests where id <> ${id} and party_id is null order by name limit 500`,
  ]);
  const allergies = (g.allergies as string[]).filter((a) => a !== "nenhuma");

  return (
    <Shell title={g.name} erro={sp.erro} ok={sp.ok === "1"}>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">Inscrição</h2>
          <dl className="grid gap-2 text-sm">
            {allergies.length > 0 && <div><dt className="text-xs uppercase text-muted">Alergias</dt><dd className="font-semibold">⚠ {allergies.join(", ")}{g.allergy_notes ? ` (${g.allergy_notes})` : ""}</dd></div>}
            {Object.entries(LABELS).map(([k, l]) => (Array.isArray(g[k]) ? g[k].length : g[k]) ? <div key={k}><dt className="text-xs uppercase text-muted">{l}</dt><dd>{Array.isArray(g[k]) ? g[k].join(", ") : String(g[k])}</dd></div> : null)}
            {g.referrer && <div><dt className="text-xs uppercase text-muted">Indicado por</dt><dd>{g.referrer}</dd></div>}
            <div><dt className="text-xs uppercase text-muted">Inscrito em</dt><dd>{shortDate(g.created_at)}</dd></div>
          </dl>
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <h2 className="mb-3 font-bold">Privado (só você vê)</h2>
            <form action={saveGuest} className="grid gap-3">
              <input type="hidden" name="guest_id" value={id} />
              <label className="grid gap-1 text-sm font-semibold">Nota geral
                <select name="host_rating" defaultValue={g.host_rating ?? ""} className={input}>
                  <option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
                </select></label>
              <label className="grid gap-1 text-sm font-semibold">Notas
                <textarea name="host_notes" rows={4} defaultValue={g.host_notes ?? ""} className={input} /></label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="is_pilot" defaultChecked={g.is_pilot} /> Piloto</label>
              <button className={btnInk}>Salvar</button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 font-bold">Par</h2>
            {partner.length ? (
              <div className="flex items-center justify-between gap-2">
                <Link href={`/admin/pessoas/${partner[0].id}`} className="font-semibold hover:underline">{partner[0].name}</Link>
                <form action={unlinkPartner}><input type="hidden" name="guest_id" value={id} /><button className={btnSmall}>Desfazer par</button></form>
              </div>
            ) : (
              <form action={linkPartner} className="flex flex-wrap gap-2">
                <input type="hidden" name="guest_id" value={id} />
                <select name="partner_id" required className={`${input} max-w-xs`} defaultValue="">
                  <option value="" disabled>Escolher pessoa…</option>
                  {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <button className={btnSmall}>Ligar como par</button>
              </form>
            )}
            <p className="mt-2 text-xs text-muted">Par senta junto com “+ par”. Cada um tem a própria inscrição e consentimento.</p>
          </Card>
        </div>

        <Card>
          <h2 className="mb-3 font-bold">Mesas ({invites.length})</h2>
          <ul className="grid gap-2 text-sm">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/mesa/${i.table_id}`} className="hover:underline">{i.title} · {shortDate(i.starts_at)}</Link>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_COLOR[i.status]}`}>{STATUS_LABEL[i.status]}{i.attended ? " · veio" : ""}{i.host_rating ? ` · ${i.host_rating}★` : ""}</span>
                {i.host_note && <p className="w-full text-xs italic">{i.host_note}</p>}
              </li>
            ))}
            {!invites.length && <li className="text-muted">Nenhuma ainda.</li>}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Histórico</h2>
          <ul className="grid gap-1 text-xs">
            {log.map((e, n) => (
              <li key={n}><span className="text-muted">{shortDate(e.at)}</span> · {e.kind} · <code>{JSON.stringify(e.changes)}</code></li>
            ))}
            {!log.length && <li className="text-muted">Nada ainda.</li>}
          </ul>
        </Card>
      </div>
    </Shell>
  );
}
