import Link from "next/link";
import { Shell, Card, input, btnSmall } from "@/components/admin/Shell";
import { requireAdmin } from "@/lib/admin";
import { getQueue } from "@/lib/admin-data";

const TIER = ["Nunca veio", "Reconvidar", "Já convidado", "", "", "", "", "", "", "Fora"];

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await getQueue({ q: sp.q, tier: sp.f, all: true, limit: 500 });
  return (
    <Shell title={`Pessoas (${rows.length})`}>
      <Card>
        <form className="mb-4 flex flex-wrap gap-2">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar nome ou WhatsApp" className={`${input} max-w-xs`} />
          <select name="f" defaultValue={sp.f ?? ""} className="rounded-full border border-ink px-3 text-sm">
            <option value="">Todas</option><option value="novos">Nunca vieram</option><option value="reconvite">Reconvidar</option>
          </select>
          <button className={btnSmall}>Filtrar</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr><th className="py-2 pr-3">Nome</th><th className="pr-3">Fila</th><th className="pr-3">Idade</th><th className="pr-3">Convites</th><th className="pr-3">Par</th><th>Nota</th></tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id} className="border-t border-line">
                  <td className="py-2 pr-3"><Link href={`/admin/pessoas/${g.id}`} className="font-semibold hover:underline">{g.name}</Link>{g.is_pilot && <span className="ml-1 text-xs text-muted">piloto</span>}</td>
                  <td className="pr-3">{TIER[g.tier]}</td>
                  <td className="pr-3">{g.age_range ?? "—"}</td>
                  <td className="pr-3">{g.invites}{g.attended ? ` (veio ${g.attended})` : ""}</td>
                  <td className="pr-3">{g.partner_name ?? "—"}</td>
                  <td>{g.host_rating ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
