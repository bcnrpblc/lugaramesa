import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken, safeEqual } from "@/lib/admin-token";

const INVITE_COOKIE = "lugar_convite"; // = lib/network INVITE_COOKIE (that file is server-only)

export async function middleware(req: NextRequest) {
  // Invite-only: the main URL shows "Só por convite" unless the visitor came through a /c/{code} link.
  // The code itself is re-checked (cap, revoked) on /inscricao and on submit.
  if (req.nextUrl.pathname === "/") {
    if (req.cookies.get(INVITE_COOKIE)?.value) return NextResponse.next();
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

export const config = { matcher: ["/", "/admin", "/admin/:path*"] };
