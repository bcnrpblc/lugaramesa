import { getInvite } from "@/lib/invite";
import { siteUrl } from "@/lib/format";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvite(token);
  if (!inv) return new Response("Convite não encontrado", { status: 404 });
  const start = new Date(inv.starts_at);
  const end = new Date(start.getTime() + inv.duration_min * 60000);
  const showAddr = inv.rsvp === "sim" && inv.address;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Um Lugar a Mesa//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${inv.token}@umlugaramesa`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Um Lugar à Mesa · ${inv.title}`)}`,
    showAddr ? `LOCATION:${esc(inv.address!)}` : "",
    `DESCRIPTION:${esc(`Seu convite: ${siteUrl()}/convite/${inv.token}`)}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Amanhã tem mesa", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="um-lugar-a-mesa.ics"`, "Cache-Control": "no-store" },
  });
}
