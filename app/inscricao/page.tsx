import type { Metadata } from "next";
import Signup from "./Signup";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Quero meu lugar à mesa" };
export const dynamic = "force-dynamic";

const clean = (v?: string) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

export default async function Page({ searchParams }: { searchParams: Promise<{ ref?: string; par?: string; indica?: string }> }) {
  const { ref, par, indica } = await searchParams;
  const parCode = clean(par);
  let parName: string | undefined;
  if (parCode) {
    // Only the first name is shown; an unknown or already-paired code just falls back to a normal signup.
    const r = await db()`select split_part(g.name, ' ', 1) as first from guests g
      where g.partner_code = ${parCode} and (g.party_id is null or (select count(*) from guests x where x.party_id = g.party_id) < 2)`;
    parName = r[0]?.first;
  }
  let nomination: { id: string; label: string } | undefined;
  if (indica && /^[0-9a-f-]{36}$/.test(indica)) {
    const r = await db()`select split_part(g.name, ' ', 1) as first, t.starts_at from invitations i
      join guests g on g.id = i.guest_id join dinner_tables t on t.id = i.table_id
      where i.id = ${indica} and i.rsvp = 'sim' and i.removed_at is null and t.allow_nominations and t.starts_at > now()
        and not exists (select 1 from nominations n where n.nominator_id = i.id)`;
    if (r[0]) nomination = { id: indica, label: `${r[0].first} te indicou · ${fmtDate(r[0].starts_at)}` };
  }
  return <Signup refCode={clean(ref)} parCode={parName ? parCode : undefined} parName={parName} nomination={nomination} />;
}
