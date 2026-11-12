import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, adminToken, safeEqual } from "@/lib/admin-token";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const want = await adminToken();
  const got = (await cookies()).get(ADMIN_COOKIE)?.value || "";
  if (!want || !safeEqual(got, want)) return new Response(null, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const r = await db()`select data from guest_photos where guest_id = ${id}`;
  if (!r.length) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(r[0].data), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=300" } });
}
