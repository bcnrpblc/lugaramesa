import Link from "next/link";
import { Shell, Card, input, btnInk, btnSmall } from "@/components/admin/Shell";
import { CopyButton } from "@/components/CopyButton";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/format";
import { LINK_CAP } from "@/lib/network";
import { createRootLink, setRootLink } from "@/app/admin/actions";

type Node = { id: string; name: string; created_at: Date; referred_by: string | null; root_link_id: string | null; invited_via: string | null; depth: number; link_used: number; children: number };
type Root = { id: string; code: string; label: string; max_uses: number; revoked_at: Date | null; created_at: Date; used: number };

const VIA: Record<string, string> = { par: "par", indica: "indicação" };
const dm = (d: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(d);

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const sql = db();
  const [nodes, roots] = await Promise.all([
    sql<Node[]>`select id, name, created_at, referred_by, root_link_id, invited_via, depth, link_used, children from admin_network order by path`,
    sql<Root[]>`select r.*, (select count(*)::int from guests g where g.root_link_id = r.id) as used from root_links r order by r.created_at desc`,
  ]);

  const total = nodes.length;
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  const byDepth = Array.from({ length: maxDepth }, (_, i) => nodes.filter((n) => n.depth === i + 1).length);
  const viaLink = nodes.filter((n) => n.depth > 1 && (n.invited_via ?? "link") === "link").length;
  const spent = nodes.filter((n) => n.link_used >= LINK_CAP).length;
  const inviters = nodes.filter((n) => n.link_used > 0).length;
  // Subtree size = everyone below a person, at any depth.
  const kids = new Map<string, string[]>();
  for (const n of nodes) if (n.referred_by) kids.set(n.referred_by, [...(kids.get(n.referred_by) ?? []), n.id]);
  const size = (id: string): number => (kids.get(id) ?? []).reduce((s, k) => s + 1 + size(k), 0);
  const top = nodes.map((n) => ({ ...n, below: size(n.id) })).filter((n) => n.below > 0).sort((a, b) => b.below - a.below).slice(0, 5);
  const rootLabel = new Map(roots.map((r) => [r.id, r.label]));

  return (
    <Shell title={`Rede (${total})`} erro={sp.erro} ok={!!sp.ok}>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card><p className="text-xs uppercase text-muted">Pessoas na rede</p><p className="display text-3xl">{total}</p></Card>
          <Card><p className="text-xs uppercase text-muted">Nível mais fundo</p><p className="display text-3xl">{maxDepth}</p><p className="text-xs text-muted">1 = convidado por você</p></Card>
          <Card><p className="text-xs uppercase text-muted">Entraram por amigo</p><p className="display text-3xl">{viaLink}</p><p className="text-xs text-muted">{inviters} {inviters === 1 ? "pessoa já convidou" : "pessoas já convidaram"}</p></Card>
          <Card><p className="text-xs uppercase text-muted">Links esgotados</p><p className="display text-3xl">{spent}</p><p className="text-xs text-muted">usaram os {LINK_CAP} convites</p></Card>
        </div>

        <Card>
          <h2 className="mb-2 font-bold">Por nível</h2>
          {byDepth.length ? (
            <ul className="grid gap-1.5">
              {byDepth.map((c, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-muted">Nível {i + 1}</span>
                  <span className="h-4 rounded-full bg-pink" style={{ width: `${Math.max(4, (c / Math.max(...byDepth)) * 100)}%` }} />
                  <b>{c}</b>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">Ninguém ainda. Crie um link abaixo e mande para alguém.</p>}
        </Card>

        <Card>
          <h2 className="font-bold">Seus links (raiz)</h2>
          <p className="mb-3 text-sm text-muted">Quem entra por um link seu fica no nível 1 e ganha o próprio link, que vale para {LINK_CAP} pessoas. Crie um por grupo (ex.: Natal, amigos do trabalho) para ver de onde cada ramo veio.</p>
          <form action={createRootLink} className="mb-4 flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm">Nome<input name="label" required maxLength={80} placeholder="Amigos do Natal" className={`${input} w-56`} /></label>
            <label className="grid gap-1 text-sm">Vale para<input name="max_uses" type="number" min={1} max={500} defaultValue={10} className={`${input} w-24`} /></label>
            <button className={btnInk}>Criar link</button>
          </form>
          <ul className="grid gap-2">
            {roots.map((r) => {
              const link = `${siteUrl()}/c/${r.code}`;
              const closed = !!r.revoked_at || r.used >= r.max_uses;
              return (
                <li key={r.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-line p-3 ${closed ? "opacity-60" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.label} <span className="text-sm font-normal text-muted">· {r.used}/{r.max_uses}{r.revoked_at ? " · revogado" : r.used >= r.max_uses ? " · esgotado" : ""}</span></p>
                    <p className="break-all text-xs text-muted">{link}</p>
                  </div>
                  <CopyButton text={link} label="Copiar" className={btnSmall} />
                  <form action={setRootLink} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={r.id} />
                    <input name="max_uses" type="number" min={1} max={500} defaultValue={r.max_uses} aria-label="Vale para" className="w-16 rounded-lg border border-line px-2 py-1 text-sm" />
                    <button className={btnSmall}>Salvar</button>
                  </form>
                  <form action={setRootLink}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="op" value={r.revoked_at ? "reabrir" : "revogar"} />
                    <button className={btnSmall}>{r.revoked_at ? "Reabrir" : "Revogar"}</button>
                  </form>
                </li>
              );
            })}
            {!roots.length && <li className="text-sm text-muted">Nenhum link ainda.</li>}
          </ul>
        </Card>

        {top.length > 0 && (
          <Card>
            <h2 className="mb-2 font-bold">Quem mais trouxe gente</h2>
            <ol className="grid gap-1 text-sm">
              {top.map((n) => <li key={n.id}><Link href={`/admin/pessoas/${n.id}`} className="font-semibold hover:underline">{n.name}</Link> · {n.below} abaixo ({n.children} direto)</li>)}
            </ol>
          </Card>
        )}

        <Card>
          <h2 className="mb-1 font-bold">Árvore</h2>
          <p className="mb-3 text-sm text-muted">Você → nível 1 → nível 2… O número é quantos convites do link a pessoa já usou.</p>
          <ul className="grid gap-0.5 text-sm">
            {nodes.map((n) => (
              <li key={n.id} className="flex items-center gap-2 border-t border-line py-1.5" style={{ paddingLeft: `${(n.depth - 1) * 20}px` }}>
                <span className="text-muted" aria-hidden="true">{n.depth > 1 ? "└" : "●"}</span>
                <Link href={`/admin/pessoas/${n.id}`} className="font-semibold hover:underline">{n.name}</Link>
                <span className={`rounded-full px-2 text-xs ${n.link_used >= LINK_CAP ? "bg-ink text-white" : n.link_used ? "bg-lime" : "bg-field"}`}>{n.link_used}/{LINK_CAP}</span>
                {n.invited_via && VIA[n.invited_via] && <span className="text-xs text-muted">{VIA[n.invited_via]}</span>}
                {n.depth === 1 && <span className="text-xs text-muted">{n.root_link_id ? rootLabel.get(n.root_link_id) : "antes da rede"}</span>}
                <span className="ml-auto text-xs text-muted">{dm(n.created_at)}</span>
              </li>
            ))}
            {!nodes.length && <li className="text-sm text-muted">Vazia por enquanto.</li>}
          </ul>
        </Card>
      </div>
    </Shell>
  );
}
