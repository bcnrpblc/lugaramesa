# Um Lugar à Mesa

Next.js 15 + Tailwind 4 + Motion + Postgres (Supabase) + Vercel.

## Pages
| Path | What |
|---|---|
| `/` | LP (port of v8). Photos load from `public/fotos/*.jpg` when added (mesa-cheia, maos-prato, brinde, galeria-1..5) |
| `/inscricao` | Signup, one question per screen. `?ref=CODE` prefills referral |
| `/obrigado` | Confirmation + guest's referral link (max 2 uses) |
| `/convite/{token}` | Personal invite: date, RSVP, address (only after "sim"), contribution + Pix, wine (only if all invited said sim), calendar (.ics w/ day-before alarm), feedback link after the dinner |
| `/feedback/{public_id}` | Anonymous feedback. Stores table id only |
| `/por-que`, `/privacidade` | Draft copy, review before go-live |
| `/admin` | Private host area (see below) |

## Setup (once)
1. Supabase: new project (region São Paulo). SQL Editor → paste `db/schema.sql` → Run.
2. Supabase → Connect → **Transaction pooler** URI (port 6543). That is `DATABASE_URL`.
3. Vercel: import the repo, add env vars `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` (final domain), `NEXT_PUBLIC_PRIVACY_EMAIL`, `ADMIN_PASSWORD`. Deploy.

Already ran an older `schema.sql`? Run the whole file again: it is idempotent and adds the v2 pieces.

The site talks to Postgres server-side only. RLS is on with no policies, so the public Supabase API exposes nothing.

## Admin (`/admin`)
Login with `ADMIN_PASSWORD` (Vercel env, min. 8 chars; change it to log everyone out).

| Path | What |
|---|---|
| `/admin` | Month calendar. Tap a table = snapshot (who, RSVP, allergies, wine, warnings). "+ Nova mesa". |
| `/admin/mesa/{id}` | Montar mesa: ranked queue (right) → "Sentar" / "+ par". Each seat: "Enviar no WhatsApp" (marks sent + opens wa.me with the invite text), copy link, set RSVP, remove. A "não" opens a **Substituir** card with the next 5 in line. After the dinner: attended, private rating, re-invite?, note. Feedback link. |
| `/admin/pessoas`, `/admin/pessoas/{id}` | Everyone, signup answers, private rating/notes, couple link, table history, change log. |

Rules enforced **in the database** (no app bug can break them): seat cap per table, one table per guest per day.
Invites are never deleted: `invitations.status` = `sentado → enviado → sim | nao`, or `removido`. Every invite change and host-side guest change is written to `event_log` by triggers.
Queue order (`admin_queue`): never invited (oldest signup first) → marked re-invite → others; "sexta difícil" sinks; 3+ invites or "não reconvidar" = out.
Couples: each person signs up (own allergies/consent). The thank-you page gives a `/inscricao?par=CODE` link; the partner's signup links both. Or link two people by hand in `/admin/pessoas/{id}`.

Pilot guests: tick "Piloto" on the person or table to keep them out of year-1 metrics. Host report (`host_reports`) is still filled in the Supabase Table Editor.

## Dev
```
cp .env.example .env.local   # point DATABASE_URL at any Postgres with db/schema.sql loaded
npm i && npm run dev
```
