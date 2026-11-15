import "server-only";
import type postgres from "postgres";

/** Each member's personal link lets in this many people. Then it expires. */
export const LINK_CAP = 3;
export const INVITE_COOKIE = "lugar_convite";
/** Remembers a member on this phone (value = their guest_token, same secret as their /eu link). 1 year. */
export const MEMBER_COOKIE = "lugar_membro";
export const MEMBER_MAX_AGE = 60 * 60 * 24 * 365;

export const cleanCode = (v?: unknown) => (typeof v === "string" ? v : "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

export type CodeInfo =
  | { status: "ok"; kind: "member"; id: string; used: number; max: number; first: string }
  | { status: "ok"; kind: "root"; id: string; used: number; max: number; first: null }
  | { status: "full" | "unknown" };

type Q = postgres.Sql | postgres.TransactionSql;

/** Looks up an invite code (member referral_code or host root link). `lock` = inside a signup transaction. */
export async function lookupCode(sql: Q, raw: unknown, lock = false): Promise<CodeInfo> {
  const code = cleanCode(raw);
  if (!code) return { status: "unknown" };
  const m = lock
    ? await sql`select id, split_part(name, ' ', 1) as first from guests where referral_code = ${code} for update`
    : await sql`select id, split_part(name, ' ', 1) as first from guests where referral_code = ${code}`;
  if (m[0]) {
    const [{ used }] = await sql`select count(*)::int as used from guests where referred_by = ${m[0].id} and coalesce(invited_via, 'link') = 'link'`;
    return used >= LINK_CAP ? { status: "full" } : { status: "ok", kind: "member", id: m[0].id, used, max: LINK_CAP, first: m[0].first };
  }
  const r = lock
    ? await sql`select id, max_uses, revoked_at from root_links where code = ${code} for update`
    : await sql`select id, max_uses, revoked_at from root_links where code = ${code}`;
  if (!r[0]) return { status: "unknown" };
  if (r[0].revoked_at) return { status: "full" };
  const [{ used }] = await sql`select count(*)::int as used from guests where root_link_id = ${r[0].id}`;
  return used >= r[0].max_uses ? { status: "full" } : { status: "ok", kind: "root", id: r[0].id, used, max: r[0].max_uses, first: null };
}
