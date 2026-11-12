import { db } from "@/lib/db";
import { TOKEN_RE } from "@/lib/guest";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) return new Response(null, { status: 404 });
  const r = await db()`select p.data from guest_photos p join guests g on g.id = p.guest_id where g.guest_token = ${token}`;
  if (!r.length) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(r[0].data), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" } });
}
