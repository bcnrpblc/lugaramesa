import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken, safeEqual } from "@/lib/admin-token";

const INVITE_COOKIE = "lugar_convite"; // = lib/network (that file is server-only)
const MEMBER_COOKIE = "lugar_membro";
const MEMBER_MAX_AGE = 60 * 60 * 24 * 365;
const TOKEN_RE = /^[a-z0-9]{16,40}$/;

export async function middleware(req: NextRequest) {
  // Invite-only: the main URL shows "Só por convite" unless the visitor came through a /c/{code} link.
  // The code itself is re-checked (cap, revoked) on /inscricao and on submit.
  const path = req.nextUrl.pathname;
  // Opening your own /eu/{token} link remembers you on this phone (the token is the secret; /entrar re-checks it).
  const eu = /^\/eu\/([^/]+)$/.exec(path);
  if (eu) {
    const res = NextResponse.next();
    if (TOKEN_RE.test(eu[1]) && req.cookies.get(MEMBER_COOKIE)?.value !== eu[1])
      res.cookies.set(MEMBER_COOKIE, eu[1], { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MEMBER_MAX_AGE });
    return res;
  }
  if (path === "/") {
    if (req.cookies.get(INVITE_COOKIE)?.value || req.cookies.get(MEMBER_COOKIE)?.value) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/so-convite";
    return NextResponse.rewrite(url);
  }
  if (req.nextUrl.pathname.startsWith("/admin/login")) return NextResponse.next();
  const want = await adminToken();
  const got = req.cookies.get(ADMIN_COOKIE)?.value || "";
  if (!want || !safeEqual(got, want)) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}

export const config = { matcher: ["/", "/eu/:token", "/admin", "/admin/:path*"] };
