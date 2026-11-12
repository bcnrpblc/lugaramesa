import "server-only";
import { db } from "@/lib/db";

export const TOKEN_RE = /^[a-z0-9]{16,40}$/;

export async function guestByToken(token: string) {
  if (!TOKEN_RE.test(token)) return null;
  const r = await db()<{ id: string; first: string; has_photo: boolean }[]>`
    select g.id, split_part(g.name, ' ', 1) as first, exists(select 1 from guest_photos p where p.guest_id = g.id) as has_photo
    from guests g where g.guest_token = ${token}`;
  return r[0] || null;
}

/** Next n Fridays (São Paulo), as YYYY-MM-DD. */
export function nextFridays(n = 8) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const d = new Date(today + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + ((5 - d.getUTCDay() + 7) % 7));
  return Array.from({ length: n }, (_, i) => {
    const x = new Date(d); x.setUTCDate(d.getUTCDate() + 7 * i);
    return x.toISOString().slice(0, 10);
  });
}

/** Accepts only a JPEG data URL under ~300 KB. */
export function parseJpeg(dataUrl: string): Buffer | null {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m || m[1].length > 420_000) return null;
  const buf = Buffer.from(m[1], "base64");
  if (buf.length < 500 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return null;
  return buf;
}
