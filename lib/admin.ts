import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken, safeEqual } from "@/lib/admin-token";
import { siteUrl } from "@/lib/format";

/** Every admin server action and page calls this (middleware is the first gate, this is the second). */
export async function requireAdmin() {
  const want = await adminToken();
  const got = (await cookies()).get(ADMIN_COOKIE)?.value || "";
  if (!want || !safeEqual(got, want)) redirect("/admin/login");
}

const TZ = "America/Sao_Paulo";
export function dayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
export function shortDate(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

/** wa.me link to the guest with the invite text pre-filled. */
export function waInvite(phone: string, firstName: string, title: string, when: Date, token: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) digits = "55" + digits;
  const date = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(when);
  const text = `Oi, ${firstName}! Tem um lugar pra você à mesa: ${title}, ${date}. Seu convite (confirma por lá): ${siteUrl()}/convite/${token}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const STATUS_LABEL: Record<string, string> = {
  sentado: "Na mesa, convite não enviado",
  enviado: "Convite enviado",
  sim: "Confirmado",
  nao: "Não vem",
  removido: "Removido",
};
export const STATUS_COLOR: Record<string, string> = {
  sentado: "bg-field", enviado: "bg-cyan", sim: "bg-lime", nao: "bg-pink", removido: "bg-line",
};
