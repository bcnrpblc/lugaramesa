import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken, safeEqual } from "@/lib/admin-token";
import { getObject, photoKey } from "@/lib/r2";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const want = await adminToken();
  const got = (await cookies()).get(ADMIN_COOKIE)?.value || "";
  if (!want || !safeEqual(got, want)) return new Response(null, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const img = await getObject(photoKey(id));
  if (!img) return new Response(null, { status: 404 });
  return new Response(img as BodyInit, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=300" } });
}
