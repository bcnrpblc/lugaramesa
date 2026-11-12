import { Shell } from "@/components/admin/Shell";
import { requireAdmin, dayKey, shortDate } from "@/lib/admin";
import { boardTables, getQueue } from "@/lib/admin-data";
import Board, { type BCard, type BTable } from "./Board";

export default async function Page() {
  await requireAdmin();
  const [tables, queue] = await Promise.all([boardTables(6), getQueue({ limit: 300 })]);
  const bt: BTable[] = tables.map((t) => ({
    id: t.id, title: t.title, when: shortDate(t.starts_at), day: dayKey(t.starts_at), seats: t.seats,
    list: t.list.map((s) => ({ guest_id: s.guest_id, name: s.name, age_range: s.age_range, allergies: s.allergies, has_photo: s.has_photo, invitation_id: s.invitation_id, status: s.status })),
  }));
  const bq: BCard[] = queue.map((g) => ({ guest_id: g.id, name: g.name, age_range: g.age_range, allergies: g.allergies, has_photo: g.has_photo, partner: g.partner_name, free_days: g.free_days, tier: g.tier }));
  return (
    <Shell title="Quadro">
      <Board tables={bt} queue={bq} />
    </Shell>
  );
}
