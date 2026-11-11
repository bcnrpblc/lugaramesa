import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import Feedback from "./Feedback";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Como foi a noite?", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  if (!/^[a-z0-9]{6,40}$/.test(tableId)) notFound();
  const r = await db()`select title, starts_at from dinner_tables where public_id = ${tableId}`;
  if (!r.length) notFound();
  return <Feedback tableId={tableId} label={`${r[0].title} · ${fmtDate(new Date(r[0].starts_at))}`} />;
}
