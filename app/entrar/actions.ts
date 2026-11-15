"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/format";
import { INVITE_COOKIE } from "@/lib/network";
import { emailFromAccessToken, sendMagicLink } from "@/lib/supa-auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Always answers the same way, so nobody can test which emails are on the list. */
export async function requestLink(email: string): Promise<{ ok: boolean; error?: string }> {
  const e = String(email || "").trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(e)) return { ok: false, error: "Confere o e-mail?" };
  try {
    const r = await db()`select 1 from guests where email = ${e}`;
    if (r.length) await sendMagicLink(e, `${siteUrl()}/entrar/ok`);
  } catch (err) {
    console.error("magic link failed", err);
    const m = String(err);
    if (m.includes("429") || m.includes("rate")) return { ok: false, error: "Muitos pedidos agora. Tenta de novo daqui a pouco." };
    return { ok: false, error: "Não conseguimos mandar agora. Tenta de novo em instantes?" };
  }
  return { ok: true };
}

/** Magic link landed: verify with Supabase, find the member, open their page. */
export async function finishLogin(accessToken: string): Promise<{ to: string } | { error: string }> {
  const email = typeof accessToken === "string" && accessToken.length < 4000 ? await emailFromAccessToken(accessToken).catch(() => null) : null;
  if (!email) return { error: "Esse link expirou ou já foi usado. Peça outro." };
  const [g] = await db()`select guest_token, referral_code from guests where email = ${email}`;
  if (!g) return { error: "Não achamos sua inscrição com esse e-mail." };
  // Members can see the site again (main URL is invite-only).
  (await cookies()).set(INVITE_COOKIE, g.referral_code, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return { to: `/eu/${g.guest_token}` };
}
