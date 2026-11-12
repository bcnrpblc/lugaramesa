"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, adminToken, safeEqual } from "@/lib/admin-token";
import { requireAdmin, waInvite } from "@/lib/admin";

const UUID = /^[0-9a-f-]{36}$/;
const s = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const id = (f: FormData, k: string) => {
  const v = s(f, k, 40);
  if (!UUID.test(v)) throw new Error("bad id");
  return v;
};
const back = (path: string, erro?: string) => redirect(erro ? `${path}${path.includes("?") ? "&" : "?"}erro=${encodeURIComponent(erro)}` : path);

function dbError(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes("MESA_CHEIA")) return "A mesa está cheia.";
  if (m.includes("MESMA_NOITE")) return "Essa pessoa já está em outra mesa nesse dia.";
  console.error(e);
  return "Não deu certo. Tenta de novo.";
}

// ---------- auth ----------
export async function login(f: FormData) {
  const want = await adminToken();
  if (!want) back("/admin/login", "ADMIN_PASSWORD não configurada (mín. 8 caracteres).");
  const pw = s(f, "senha", 200);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("lugar-admin-v1"))), (b) => b.toString(16).padStart(2, "0")).join("");
  if (!safeEqual(sig, want!)) {
    await new Promise((r) => setTimeout(r, 800));
    back("/admin/login", "Senha errada.");
  }
  (await cookies()).set(ADMIN_COOKIE, want!, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

// ---------- tables ----------
function tableFields(f: FormData) {
  const date = s(f, "date", 10), time = s(f, "time", 5) || "20:00";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error("data");
  const seats = Math.min(12, Math.max(1, parseInt(s(f, "seats", 3) || "8", 10)));
  const amount = s(f, "suggested_amount", 12).replace(",", ".");
  return {
    title: s(f, "title", 80) || "Jantar de sexta",
    meal_type: ["jantar", "almoco", "cafe"].includes(s(f, "meal_type", 10)) ? s(f, "meal_type", 10) : "jantar",
    starts_at: `${date} ${time}:00-03`,
    seats,
    address: s(f, "address", 200) || null,
    address_notes: s(f, "address_notes", 200) || null,
    suggested_amount: amount && !isNaN(Number(amount)) ? Number(amount) : null,
    pix_key: s(f, "pix_key", 120) || null,
    wine_note: s(f, "wine_note", 200) || null,
    menu: s(f, "menu", 2000) || null,
    is_pilot: f.get("is_pilot") === "on",
  };
}

export async function createTable(f: FormData) {
  await requireAdmin();
  let v;
  try { v = tableFields(f); } catch { return back("/admin", "Data ou hora inválida."); }
  const r = await db()`insert into dinner_tables ${db()(v)} returning id`;
  revalidatePath("/admin");
  redirect(`/admin/mesa/${r[0].id}`);
}

export async function updateTable(f: FormData) {
  await requireAdmin();
  const tid = id(f, "table_id");
  let v;
  try { v = tableFields(f); } catch { return back(`/admin/mesa/${tid}`, "Data ou hora inválida."); }
  const active = await db()`select count(*)::int as n from invitations where table_id = ${tid} and removed_at is null and rsvp <> 'nao'`;
  if (active[0].n > v.seats) return back(`/admin/mesa/${tid}`, `Já tem ${active[0].n} pessoas na mesa. Tire alguém antes de reduzir lugares.`);
  try {
    await db()`update dinner_tables set ${db()(v)} where id = ${tid}`;
  } catch (e) { return back(`/admin/mesa/${tid}`, dbError(e)); }
  revalidatePath(`/admin/mesa/${tid}`);
  back(`/admin/mesa/${tid}?ok=1`);
}

// ---------- seats ----------
/** Seat a guest (and their partner if asked). Re-activates an earlier removed/declined row instead of duplicating. */
export async function seatGuest(f: FormData) {
  await requireAdmin();
  const tid = id(f, "table_id"), gid = id(f, "guest_id");
  const withPartner = f.get("partner") === "1";
  const replaces = s(f, "replaces_id", 40);
  const path = `/admin/mesa/${tid}`;
  try {
    await db().begin(async (tx) => {
      const ids = [gid];
      if (withPartner) {
        const p = await tx`select p.id from guests g join guests p on p.party_id = g.party_id and p.id <> g.id where g.id = ${gid}`;
        ids.push(...p.map((r) => r.id as string));
      }
      for (const [i, g] of ids.entries()) {
        const rep = i === 0 && UUID.test(replaces) ? replaces : null;
        await tx`
          insert into invitations (guest_id, table_id, replaces_id) values (${g}, ${tid}, ${rep})
          on conflict (guest_id, table_id) do update
            set removed_at = null, rsvp = 'pendente', rsvp_at = null, sent_at = null, replaces_id = coalesce(excluded.replaces_id, invitations.replaces_id)`;
      }
    });
  } catch (e) { return back(path, dbError(e)); }
  revalidatePath(path);
  back(path);
}

async function tableOf(invId: string) {
  const r = await db()`select table_id from invitations where id = ${invId}`;
  if (!r.length) redirect("/admin");
  return `/admin/mesa/${r[0].table_id}`;
}

/** Marks the invite as sent and opens WhatsApp with the text ready. */
export async function sendWhatsapp(f: FormData) {
  await requireAdmin();
  const inv = id(f, "invitation_id");
  const r = await db()`
    update invitations i set sent_at = coalesce(i.sent_at, now()) from guests g, dinner_tables t
    where i.id = ${inv} and g.id = i.guest_id and t.id = i.table_id
    returning i.token, g.name, g.whatsapp, t.title, t.starts_at, t.id as table_id`;
  if (!r.length) redirect("/admin");
  revalidatePath(`/admin/mesa/${r[0].table_id}`);
  redirect(waInvite(r[0].whatsapp, String(r[0].name).split(" ")[0], r[0].title, r[0].starts_at, r[0].token));
}

export async function markSent(f: FormData) {
  await requireAdmin();
  const inv = id(f, "invitation_id");
  await db()`update invitations set sent_at = coalesce(sent_at, now()) where id = ${inv}`;
  back(await tableOf(inv));
}

export async function removeSeat(f: FormData) {
  await requireAdmin();
  const inv = id(f, "invitation_id");
  await db()`update invitations set removed_at = now() where id = ${inv} and removed_at is null`;
  back(await tableOf(inv));
}

export async function setRsvp(f: FormData) {
  await requireAdmin();
  const inv = id(f, "invitation_id");
  const rsvp = s(f, "rsvp", 10);
  const path = await tableOf(inv);
  if (!["sim", "nao", "pendente"].includes(rsvp)) return back(path);
  try {
    await db()`update invitations set rsvp = ${rsvp}, rsvp_at = ${rsvp === "pendente" ? null : new Date()} where id = ${inv}`;
  } catch (e) { return back(path, dbError(e)); }
  back(path);
}

export async function saveAfter(f: FormData) {
  await requireAdmin();
  const inv = id(f, "invitation_id");
  const att = s(f, "attended", 5), rating = parseInt(s(f, "host_rating", 1), 10), reinv = s(f, "reinvite", 5);
  await db()`
    update invitations set
      attended = ${att === "sim" ? true : att === "nao" ? false : null},
      host_rating = ${rating >= 1 && rating <= 5 ? rating : null},
      reinvite = ${reinv === "sim" ? true : reinv === "nao" ? false : null},
      host_note = ${s(f, "host_note", 1000) || null}
    where id = ${inv}`;
  back(await tableOf(inv));
}

// ---------- people ----------
export async function saveGuest(f: FormData) {
  await requireAdmin();
  const gid = id(f, "guest_id");
  const rating = parseInt(s(f, "host_rating", 1), 10);
  await db()`update guests set host_rating = ${rating >= 1 && rating <= 5 ? rating : null}, host_notes = ${s(f, "host_notes", 2000) || null},
             is_pilot = ${f.get("is_pilot") === "on"} where id = ${gid}`;
  back(`/admin/pessoas/${gid}?ok=1`);
}

export async function linkPartner(f: FormData) {
  await requireAdmin();
  const gid = id(f, "guest_id"), other = id(f, "partner_id");
  const path = `/admin/pessoas/${gid}`;
  if (gid === other) return back(path, "Escolha outra pessoa.");
  try {
    await db().begin(async (tx) => {
      const rows = await tx`select id, party_id from guests where id in (${gid}, ${other}) for update`;
      if (rows.length !== 2) throw new Error("not found");
      if (rows.some((r) => r.party_id)) throw new Error("PAR_EXISTE");
      const p = await tx`insert into parties default values returning id`;
      await tx`update guests set party_id = ${p[0].id} where id in (${gid}, ${other})`;
    });
  } catch (e) {
    return back(path, e instanceof Error && e.message === "PAR_EXISTE" ? "Uma das duas pessoas já tem par. Desfaça antes." : dbError(e));
  }
  back(path);
}

export async function unlinkPartner(f: FormData) {
  await requireAdmin();
  const gid = id(f, "guest_id");
  await db()`update guests set party_id = null where party_id = (select party_id from guests where id = ${gid}) and party_id is not null`;
  back(`/admin/pessoas/${gid}`);
}

// ---------- nominations ----------
export async function toggleNominations(f: FormData) {
  await requireAdmin();
  const tid = id(f, "table_id");
  await db()`update dinner_tables set allow_nominations = not allow_nominations where id = ${tid}`;
  back(`/admin/mesa/${tid}`);
}

export async function decideNomination(f: FormData) {
  await requireAdmin();
  const nid = id(f, "nomination_id");
  const approve = f.get("decision") === "aprovar";
  const r = await db()`select table_id, nominee_id, status from nominations where id = ${nid}`;
  if (!r.length) redirect("/admin");
  const { table_id: tid, nominee_id } = r[0];
  const path = `/admin/mesa/${tid}`;
  if (r[0].status !== "pendente") return back(path);
  try {
    await db().begin(async (tx) => {
      if (approve) {
        // Takes the place of the oldest unreplaced drop-out, if any.
        const open = await tx`
          select i.id from invitations i where i.table_id = ${tid} and i.rsvp = 'nao' and i.removed_at is null
            and not exists (select 1 from invitations x where x.replaces_id = i.id and x.removed_at is null)
          order by i.rsvp_at nulls last limit 1`;
        await tx`
          insert into invitations (guest_id, table_id, replaces_id) values (${nominee_id}, ${tid}, ${open[0]?.id ?? null})
          on conflict (guest_id, table_id) do update set removed_at = null, rsvp = 'pendente', rsvp_at = null, sent_at = null`;
      }
      await tx`update nominations set status = ${approve ? "aprovada" : "recusada"}, decided_at = now() where id = ${nid}`;
    });
  } catch (e) { return back(path, dbError(e)); }
  back(path);
}

// ---------- drag-and-drop board ----------
/** Called from the board (client). Seat from queue, move between tables, or drop back to the queue (remove). */
export async function boardMove(input: { guestId: string; fromInvitation?: string | null; toTable?: string | null; withPartner?: boolean }) {
  await requireAdmin();
  const { guestId, fromInvitation, toTable, withPartner } = input;
  if (!UUID.test(guestId) || (fromInvitation && !UUID.test(fromInvitation)) || (toTable && !UUID.test(toTable))) return { ok: false, error: "Dados inválidos." };
  try {
    await db().begin(async (tx) => {
      if (fromInvitation) {
        const cur = await tx`select table_id from invitations where id = ${fromInvitation} and guest_id = ${guestId}`;
        if (!cur.length) throw new Error("not found");
        if (cur[0].table_id === toTable) return;
        await tx`update invitations set removed_at = now() where id = ${fromInvitation}`;
      }
      if (!toTable) return;
      const ids = [guestId];
      if (withPartner && !fromInvitation) {
        const p = await tx`select p.id from guests g join guests p on p.party_id = g.party_id and p.id <> g.id where g.id = ${guestId}`;
        ids.push(...p.map((r) => r.id as string));
      }
      for (const g of ids) {
        await tx`
          insert into invitations (guest_id, table_id) values (${g}, ${toTable})
          on conflict (guest_id, table_id) do update set removed_at = null, rsvp = 'pendente', rsvp_at = null, sent_at = null`;
      }
    });
  } catch (e) { return { ok: false, error: dbError(e) }; }
  revalidatePath("/admin/quadro");
  return { ok: true };
}
