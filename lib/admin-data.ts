import "server-only";
import { db } from "@/lib/db";

export type TableRow = {
  id: string; public_id: string; title: string; meal_type: string; starts_at: Date; seats: number;
  address: string | null; address_notes: string | null; suggested_amount: string | null; pix_key: string | null;
  wine_note: string | null; menu: string | null; is_pilot: boolean; allow_nominations?: boolean; active?: number; confirmed?: number;
};

export type Seat = {
  invitation_id: string; token: string; status: string; rsvp: string; sent_at: Date | null; rsvp_at: Date | null;
  replaces_id: string | null; attended: boolean | null; host_rating: number | null; host_note: string | null; reinvite: boolean | null;
  guest_id: string; name: string; whatsapp: string; age_range: string | null; life_stage: string | null; friday_ok: string | null;
  wine: string | null; allergies: string[]; allergy_notes: string | null; never_eats: string | null; party_id: string | null;
  life_answer: string | null; past_tables: number; has_photo: boolean;
};

export type QueueRow = {
  id: string; name: string; whatsapp: string; created_at: Date; age_range: string | null; life_stage: string | null;
  friday_ok: string | null; wine: string | null; allergies: string[]; never_eats: string | null; party_id: string | null;
  is_pilot: boolean; host_rating: number | null; life_answer: string | null; home_dish: string | null;
  partner_name: string | null; invites: number; attended: number; last_table_at: Date | null; tier: number;
  has_photo: boolean; free: boolean | null; free_days: string[];
};

export async function getTable(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const r = await db()<TableRow[]>`select id, public_id, title, meal_type, starts_at, seats, address, address_notes,
    suggested_amount::text as suggested_amount, pix_key, wine_note, menu, is_pilot, allow_nominations from dinner_tables where id = ${id}`;
  return r[0] || null;
}

export async function getSeats(tableId: string) {
  return db()<Seat[]>`
    select i.id as invitation_id, i.token, i.status, i.rsvp, i.sent_at, i.rsvp_at, i.replaces_id, i.attended, i.host_rating,
           i.host_note, i.reinvite, g.id as guest_id, g.name, g.whatsapp, g.age_range, g.life_stage, g.friday_ok, g.wine,
           g.allergies, g.allergy_notes, g.never_eats, g.party_id, g.life_answer,
           (select count(*)::int from invitations x where x.guest_id = g.id and x.id <> i.id and x.attended) as past_tables,
           exists(select 1 from guest_photos p where p.guest_id = g.id) as has_photo
    from invitations i join guests g on g.id = i.guest_id
    where i.table_id = ${tableId}
    order by case i.status when 'sim' then 0 when 'enviado' then 1 when 'sentado' then 2 when 'nao' then 3 else 4 end, g.name`;
}

export async function getQueue(opts: { day?: string; excludeTable?: string; q?: string; tier?: string; idade?: string; all?: boolean; limit?: number }) {
  const sql = db();
  const q = (opts.q || "").trim().slice(0, 60);
  return sql<QueueRow[]>`
    select a.*, exists(select 1 from guest_photos p where p.guest_id = a.id) as has_photo,
      ${opts.day ? sql`exists(select 1 from availability v where v.guest_id = a.id and v.day = ${opts.day}::date)` : sql`null::boolean`} as free,
      coalesce((select array_agg(to_char(v.day, 'YYYY-MM-DD') order by v.day) from availability v where v.guest_id = a.id and v.day >= current_date), '{}') as free_days
    from admin_queue a
    where true
      ${opts.excludeTable ? sql`and not exists (select 1 from invitations i where i.guest_id = a.id and i.table_id = ${opts.excludeTable} and i.removed_at is null)` : sql``}
      ${opts.all ? sql`` : sql`and a.tier < 9`}
      ${opts.tier === "novos" ? sql`and a.tier = 0` : opts.tier === "reconvite" ? sql`and a.tier = 1` : sql``}
      ${opts.idade ? sql`and a.age_range = ${opts.idade}` : sql``}
      ${q ? sql`and (a.name ilike ${"%" + q + "%"} or a.whatsapp ilike ${"%" + q + "%"})` : sql``}
    order by a.tier, ${opts.day ? sql`exists(select 1 from availability v where v.guest_id = a.id and v.day = ${opts.day}::date) desc,` : sql``} (a.friday_ok = 'dificil') nulls first, a.created_at
    limit ${opts.limit ?? 60}`;
}

export async function monthTables(from: string, to: string) {
  return db()<TableRow[]>`
    select t.id, t.public_id, t.title, t.meal_type, t.starts_at, t.seats, t.is_pilot,
           count(i.*) filter (where i.removed_at is null and i.rsvp <> 'nao')::int as active,
           count(i.*) filter (where i.removed_at is null and i.rsvp = 'sim')::int as confirmed
    from dinner_tables t left join invitations i on i.table_id = t.id
    where t.starts_at >= ${from}::timestamptz and t.starts_at < ${to}::timestamptz
    group by t.id order by t.starts_at`;
}

/** Live warnings for a table. Hard limits are enforced in the DB; these are advice. */
export function tableWarnings(seats: Seat[], cap: number) {
  const act = seats.filter((s) => ["sentado", "enviado", "sim"].includes(s.status));
  const w: { level: "info" | "warn"; text: string }[] = [];
  const open = cap - act.length;
  w.push({ level: open > 0 ? "info" : "info", text: open > 0 ? `${open} lugar(es) livre(s) de ${cap}.` : `Mesa completa (${cap}).` });
  const allergies = [...new Set(act.flatMap((s) => s.allergies.filter((a) => a !== "nenhuma")))];
  if (allergies.length) w.push({ level: "warn", text: `Cardápio: ${allergies.join(", ")}.` });
  const notes = act.filter((s) => s.allergy_notes).map((s) => `${s.name.split(" ")[0]}: ${s.allergy_notes}`);
  if (notes.length) w.push({ level: "warn", text: `Detalhes de alergia: ${notes.join(" · ")}` });
  if (act.length) w.push({ level: "info", text: act.every((s) => s.wine === "sim") ? "Vinho liberado (todos toparam)." : "Sem vinho (nem todos toparam)." });
  const parties = new Map<string, number>();
  act.forEach((s) => s.party_id && parties.set(s.party_id, (parties.get(s.party_id) || 0) + 1));
  const couples = [...parties.values()].filter((n) => n >= 2).length;
  if (couples > 2) w.push({ level: "warn", text: `${couples} casais. Solteiros podem se sentir em minoria.` });
  const alone = act.filter((s) => s.party_id && parties.get(s.party_id) === 1);
  if (alone.length) w.push({ level: "warn", text: `Sem o par: ${alone.map((s) => s.name.split(" ")[0]).join(", ")}.` });
  const ages = new Set(act.map((s) => s.age_range).filter(Boolean));
  if (act.length >= 4 && ages.size === 1) w.push({ level: "warn", text: "Todo mundo na mesma faixa de idade." });
  const repeat = act.filter((s) => s.past_tables > 0);
  if (repeat.length > 1) w.push({ level: "warn", text: `${repeat.length} pessoas que já vieram antes. Ideal: no máximo 1.` });
  const hard = act.filter((s) => s.friday_ok === "dificil");
  if (hard.length) w.push({ level: "warn", text: `Disse que sexta é difícil: ${hard.map((s) => s.name.split(" ")[0]).join(", ")}.` });
  return w;
}

export type Nomination = { id: string; status: string; created_at: Date; nominee_id: string; nominee: string; nominator: string; age_range: string | null; allergies: string[]; life_answer: string | null; has_photo: boolean };
export async function getNominations(tableId: string) {
  return db()<Nomination[]>`
    select n.id, n.status, n.created_at, g.id as nominee_id, g.name as nominee, ng.name as nominator, g.age_range, g.allergies, g.life_answer,
           exists(select 1 from guest_photos p where p.guest_id = g.id) as has_photo
    from nominations n join guests g on g.id = n.nominee_id join invitations ni on ni.id = n.nominator_id join guests ng on ng.id = ni.guest_id
    where n.table_id = ${tableId} order by n.status = 'pendente' desc, n.created_at`;
}

/** Upcoming tables with their active seats, for the drag-and-drop board. */
export type BoardSeat = { invitation_id: string; status: string; guest_id: string; name: string; age_range: string | null; allergies: string[]; party_id: string | null; has_photo: boolean };
export async function boardTables(limit = 6) {
  const tables = await db()<TableRow[]>`
    select id, public_id, title, meal_type, starts_at, seats, is_pilot, allow_nominations from dinner_tables
    where starts_at > now() - interval '6 hours' order by starts_at limit ${limit}`;
  if (!tables.length) return [];
  const seats = await db()<(BoardSeat & { table_id: string })[]>`
    select i.table_id, i.id as invitation_id, i.status, g.id as guest_id, g.name, g.age_range, g.allergies, g.party_id,
           exists(select 1 from guest_photos p where p.guest_id = g.id) as has_photo
    from invitations i join guests g on g.id = i.guest_id
    where i.table_id in ${db()(tables.map((t) => t.id))} and i.removed_at is null and i.rsvp <> 'nao'
    order by g.name`;
  return tables.map((t) => ({ ...t, list: seats.filter((s) => s.table_id === t.id) }));
}
