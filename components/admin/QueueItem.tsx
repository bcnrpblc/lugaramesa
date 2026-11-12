import Link from "next/link";
import type { QueueRow } from "@/lib/admin-data";
import { seatGuest } from "@/app/admin/actions";
import { btnSmall } from "./Shell";

const TIER = ["Nunca veio", "Reconvidar", "Já convidado", "", "", "", "", "", "", "Fora (3+ ou não reconvidar)"];

export function QueueItem({ g, tableId, replacesId, full }: { g: QueueRow; tableId: string; replacesId?: string; full: boolean }) {
  const allergies = g.allergies.filter((a) => a !== "nenhuma");
  return (
    <li className="rounded-lg border border-line bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/admin/pessoas/${g.id}`} className="font-bold hover:underline">{g.name}</Link>
          <p className="text-xs text-muted">
            {[g.age_range, g.life_stage, TIER[g.tier], g.friday_ok === "dificil" ? "sexta difícil" : null, g.is_pilot ? "piloto" : null].filter(Boolean).join(" · ")}
          </p>
          {g.partner_name && <p className="text-xs font-semibold">Par: {g.partner_name}</p>}
          {allergies.length > 0 && <p className="text-xs font-semibold">⚠ {allergies.join(", ")}</p>}
          {g.life_answer && <p className="mt-1 line-clamp-2 text-xs italic">“{g.life_answer}”</p>}
        </div>
        <div className="grid shrink-0 gap-1">
          <form action={seatGuest}>
            <input type="hidden" name="table_id" value={tableId} />
            <input type="hidden" name="guest_id" value={g.id} />
            {replacesId && <input type="hidden" name="replaces_id" value={replacesId} />}
            <button className={btnSmall} disabled={full && !replacesId}>{replacesId ? "Convidar no lugar" : "Sentar"}</button>
          </form>
          {g.party_id && g.partner_name && !replacesId && (
            <form action={seatGuest}>
              <input type="hidden" name="table_id" value={tableId} />
              <input type="hidden" name="guest_id" value={g.id} />
              <input type="hidden" name="partner" value="1" />
              <button className={btnSmall} disabled={full}>+ par</button>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}
