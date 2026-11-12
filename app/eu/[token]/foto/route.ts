import { db } from "@/lib/db";
import { TOKEN_RE } from "@/lib/guest";
import { getObject, photoKey } from "@/lib/r2";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) return new Response(null, { status: 404 });
  const r = await db()`select p.guest_id from guest_photos p join guests g on g.id = p.guest_id where g.guest_token = ${token}`;
  const img = r.length ? await getObject(photoKey(r[0].guest_id)) : null;
  if (!img) return new Response(null, { status: 404 });
  return new Response(img as BodyInit, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" } });
}
