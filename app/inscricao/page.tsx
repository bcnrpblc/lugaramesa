import type { Metadata } from "next";
import Signup from "./Signup";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Quero meu lugar à mesa" };

const clean = (v?: string) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

export default async function Page({ searchParams }: { searchParams: Promise<{ ref?: string; par?: string }> }) {
  const { ref, par } = await searchParams;
  const parCode = clean(par);
  let parName: string | undefined;
  if (parCode) {
    // Only the first name is shown; an unknown or already-paired code just falls back to a normal signup.
    const r = await db()`select split_part(g.name, ' ', 1) as first from guests g
      where g.partner_code = ${parCode} and (g.party_id is null or (select count(*) from guests x where x.party_id = g.party_id) < 2)`;
    parName = r[0]?.first;
  }
  return <Signup refCode={clean(ref)} parCode={parName ? parCode : undefined} parName={parName} />;
}
