import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { INVITE_COOKIE, cleanCode, lookupCode } from "@/lib/network";

export const dynamic = "force-dynamic";

/** Personal invite link. Valid → remember the code (cookie) and show the site. Used 3x → "esgotado". */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const code = cleanCode((await params).code);
  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, req.url), 303);
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex");
    return res;
  };
  let status: "ok" | "full" | "unknown" = "unknown";
  try {
    status = (await lookupCode(db(), code)).status;
  } catch (e) {
    console.error("invite lookup failed", e);
    return go("/so-convite");
  }
  if (status === "full") return go("/esgotado");
  if (status === "unknown") return go("/so-convite?codigo=invalido");
  const res = go("/");
  res.cookies.set(INVITE_COOKIE, code, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
