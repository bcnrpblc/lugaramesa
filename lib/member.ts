import "server-only";
import { cookies } from "next/headers";
import { INVITE_COOKIE, MEMBER_COOKIE, MEMBER_MAX_AGE } from "@/lib/network";

/** Keeps the member signed in on this phone (1 year) and lets them see the site. Server-side only. */
export async function rememberMember(guestToken: string, referralCode: string) {
  const jar = await cookies();
  const base = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: MEMBER_MAX_AGE };
  jar.set(MEMBER_COOKIE, guestToken, base);
  jar.set(INVITE_COOKIE, referralCode, base);
}
