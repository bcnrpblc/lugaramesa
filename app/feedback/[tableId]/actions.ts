"use server";
import { db } from "@/lib/db";

const S = (v: unknown, ok: string[]) => (typeof v === "string" && ok.includes(v) ? v : null);
const N = (v: unknown) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null; };
const T = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Stores the TABLE id only. No guest id, no IP, no cookie. */
export async function submitFeedback(publicId: string, v: Record<string, unknown>) {
  if (!/^[a-z0-9]{6,40}$/.test(publicId)) return { ok: false, error: "Mesa não encontrada." };
  const welcome = N(v.welcome);
  if (!welcome) return { ok: false, error: "Faltou a primeira pergunta." };
  try {
    const r = await db()`
      insert into feedback (table_id, welcome, real_talk, again, reconnect_count, space, food, would_host, one_word, change)
      select t.id, ${welcome}, ${S(v.real_talk, ["sim", "nao"])}, ${S(v.again, ["sim", "talvez", "nao"])},
             ${S(v.reconnect_count, ["0", "1", "2-3", "4+"])}, ${S(v.space, ["nada", "um-pouco", "muito"])}, ${N(v.food)},
             ${S(v.would_host, ["sim", "talvez", "nao"])}, ${T(v.one_word, 40)}, ${T(v.change, 1000)}
      from dinner_tables t where t.public_id = ${publicId}
      returning 1`;
    return r.length ? { ok: true } : { ok: false, error: "Mesa não encontrada." };
  } catch (e) {
    console.error("feedback failed", e);
    return { ok: false, error: "Não conseguimos salvar agora. Tenta de novo?" };
  }
}
