import "server-only";

/** Supabase Auth over REST (no SDK). Used only for the members' magic-link login. */
function cfg() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY não configuradas");
  return { url, key };
}

/** Sends the magic-link email. redirectTo must be in Supabase > Auth > URL Configuration > Redirect URLs. */
export async function sendMagicLink(email: string, redirectTo: string) {
  const { url, key } = cfg();
  const r = await fetch(`${url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, create_user: true }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`otp ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

/** Verifies an access token from the magic link and returns the confirmed email, or null. */
export async function emailFromAccessToken(token: string): Promise<string | null> {
  const { url, key } = cfg();
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!r.ok) return null;
  const u = (await r.json()) as { email?: string; email_confirmed_at?: string | null };
  return u.email && u.email_confirmed_at ? u.email.toLowerCase() : null;
}
