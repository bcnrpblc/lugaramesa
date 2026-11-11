"use server";

import { db } from "@/lib/db";

const CONSENT_VERSION = "2026-11-v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_REFERRALS = 2;

const ONE = {
  age_range: ["18-24", "25-34", "35-44", "45-54", "55+"],
  life_stage: ["solteiro", "namorando", "casado", "casado-filhos", "outro"],
  wine: ["sim", "nao"],
  friday_ok: ["sim", "as-vezes", "dificil"],
  base_hosted: ["0", "1", "2-3", "4+"],
  base_been_hosted: ["0", "1", "2-3", "4+"],
  base_friends: ["0", "1-2", "3-5", "6+"],
  would_host: ["sim", "talvez", "nao"],
  cooks_for_groups: ["sim", "aprendendo", "nao"],
} as const;
const ALLERGIES = ["nenhuma", "lactose", "gluten", "frutos-do-mar", "castanhas", "ovo", "vegetariano", "vegano", "outra"];

function str(v: unknown, max = 300) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function emailStatus(email: string): Promise<"ok" | "invalid" | "exists"> {
  const e = str(email, 200).toLowerCase();
  if (!EMAIL_RE.test(e)) return "invalid";
  const r = await db()`select 1 from guests where email = ${e}`;
  return r.length ? "exists" : "ok";
}

export async function codeStatus(code: string): Promise<"ok" | "empty" | "unknown" | "full"> {
  const c = str(code, 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!c) return "empty";
  const r = await db()`select (select count(*) from guests x where x.referred_by = g.id)::int as used from guests g where g.referral_code = ${c}`;
  if (!r.length) return "unknown";
  return r[0].used >= MAX_REFERRALS ? "full" : "ok";
}

export type SignupResult = { ok: true; code: string; name: string } | { ok: false; error: string };

export async function submitSignup(input: Record<string, unknown>): Promise<SignupResult> {
  if (str(input.website)) return { ok: false, error: "Erro." }; // honeypot
  const email = str(input.email, 200).toLowerCase();
  const name = str(input.name, 80);
  const whatsapp = str(input.whatsapp, 30);
  if (!EMAIL_RE.test(email)) return { ok: false, error: "E-mail inválido." };
  if (!name) return { ok: false, error: "Faltou seu nome." };
  if (whatsapp.replace(/\D/g, "").length < 10) return { ok: false, error: "WhatsApp com DDD, por favor." };
  if (input.consent_privacy !== true) return { ok: false, error: "Precisamos do seu consentimento." };

  const pick = <K extends keyof typeof ONE>(k: K) => {
    const v = str(input[k], 40);
    return (ONE[k] as readonly string[]).includes(v) ? v : null;
  };
  const allergies = Array.isArray(input.allergies) ? input.allergies.filter((a): a is string => typeof a === "string" && ALLERGIES.includes(a)) : [];
  const hasHealth = allergies.some((a) => a !== "nenhuma") || !!str(input.allergy_notes);
  if (hasHealth && input.consent_health !== true) return { ok: false, error: "Precisamos do seu ok para usar as informações de alergia." };

  const code = str(input.ref, 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const sql = db();
  try {
    const row = await sql.begin(async (tx) => {
      let referredBy: string | null = null;
      if (code) {
        const r = await tx`select g.id, (select count(*) from guests x where x.referred_by = g.id)::int as used from guests g where g.referral_code = ${code} for update`;
        if (r.length && r[0].used < MAX_REFERRALS) referredBy = r[0].id;
      }
      const ins = await tx`
        insert into guests (email, name, whatsapp, age_range, life_stage, allergies, allergy_notes, never_eats, wine, friday_ok,
          base_hosted, base_been_hosted, base_friends, would_host, cooks_for_groups, home_dish, referred_by, consent_at, consent_version)
        values (${email}, ${name}, ${whatsapp}, ${pick("age_range")}, ${pick("life_stage")}, ${allergies}, ${str(input.allergy_notes) || null},
          ${str(input.never_eats) || null}, ${pick("wine")}, ${pick("friday_ok")}, ${pick("base_hosted")}, ${pick("base_been_hosted")},
          ${pick("base_friends")}, ${pick("would_host")}, ${pick("cooks_for_groups")}, ${str(input.home_dish) || null}, ${referredBy},
          now(), ${CONSENT_VERSION})
        on conflict (email) do nothing
        returning referral_code`;
      return ins[0];
    });
    if (!row) return { ok: false, error: "Esse e-mail já está na lista." };
    return { ok: true, code: row.referral_code, name: name.split(" ")[0] };
  } catch (e) {
    console.error("signup failed", e);
    return { ok: false, error: "Não conseguimos salvar agora. Tenta de novo em instantes?" };
  }
}
