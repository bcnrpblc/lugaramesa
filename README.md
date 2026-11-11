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

## Setup (once)
1. Supabase: new project (region São Paulo). SQL Editor → paste `db/schema.sql` → Run.
2. Supabase → Connect → **Transaction pooler** URI (port 6543). That is `DATABASE_URL`.
3. Vercel: import the repo, add env vars `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` (final domain), `NEXT_PUBLIC_PRIVACY_EMAIL`. Deploy.

The site talks to Postgres server-side only. RLS is on with no policies, so the public Supabase API exposes nothing.

## Running a table (Supabase Table Editor)
1. `dinner_tables` → Insert row: `title`, `starts_at` (e.g. `2026-12-24 20:00-03`), `address`, `suggested_amount`, `pix_key`, `wine_note`, `is_pilot`.
2. `invitations` → Insert one row per guest (pick `guest_id` + `table_id`). Token is automatic.
3. View `admin_invites` → copy `invite_path`, send `https://SITE/convite/<token>` on WhatsApp.
4. View `admin_tables` → confirmed count, `vinho_liberado`, allergies, feedback averages.
5. After the dinner: send `https://SITE/feedback/<table_public_id>` (also appears on each invite page after the dinner ends). Fill `host_reports` and private fields on `invitations` / `guests`.

Pilot guests: set `guests.is_pilot = true` to keep them out of year-1 metrics.

## Dev
```
cp .env.example .env.local   # point DATABASE_URL at any Postgres with db/schema.sql loaded
npm i && npm run dev
```
