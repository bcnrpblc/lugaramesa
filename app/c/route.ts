import { NextResponse, type NextRequest } from "next/server";
import { cleanCode } from "@/lib/network";

/** Code typed on the gate page → /c/{code}. */
export function GET(req: NextRequest) {
  const code = cleanCode(req.nextUrl.searchParams.get("codigo") ?? "");
  return NextResponse.redirect(new URL(code ? `/c/${code}` : "/so-convite", req.url), 303);
}
