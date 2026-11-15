# Um Lugar à Mesa

Next.js 16 + Tailwind 4 + Motion + Postgres (Supabase) + Vercel.

## Pages
| Path | What |
|---|---|
| `/` | Without an invite: **"Só por convite"** page (`/so-convite`). With one: LP (port of v8). Photos load from `public/fotos/*.jpg` |
| `/c/{code}` | Personal invite link. Valid → remembers the code (cookie, 30 days) and opens the LP. Used up → `/esgotado` |
| `/inscricao` | Signup, one question per screen. Only with a valid invite (or `?par=` / `?indica=`), else → `/so-convite` |
| `/entrar` | Members' login, no password: email → Supabase Auth sends a magic link → `/entrar/ok` → their `/eu/{token}` page (also re-opens the site for them). Unknown emails get the same answer and no email |
| `/obrigado` | Confirmation + guest's own invite link `/c/{code}` (3 signups, then it expires) |
| `/convite/{token}` | Personal invite: date, RSVP, address (only after "sim"), contribution + Pix, wine (only if all invited said sim), calendar (.ics w/ day-before alarm), feedback link after the dinner |
| `/feedback/{public_id}` | Anonymous feedback. Stores table id only |
| `/por-que`, `/privacidade` | Draft copy, review before go-live |
| `/admin` | Private host area (see below) |

## Setup (once)
1. Supabase: new project (region São Paulo). SQL Editor → paste `db/schema.sql` → Run.
2. Supabase → Connect → **Transaction pooler** URI (port 6543). That is `DATABASE_URL`.
3. Cloudflare R2: create a private bucket + an API token (Object Read & Write).
4. Supabase → Authentication → URL Configuration: Site URL = your domain; Redirect URLs: add `https://<domain>/entrar/ok`. Built-in email sends only a few emails/hour: for more, set custom SMTP (Auth → SMTP).
5. Vercel: import the repo, add every var in `.env.example` (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (final domain), `NEXT_PUBLIC_PRIVACY_EMAIL`, `ADMIN_PASSWORD`, `R2_*`). `NEXT_PUBLIC_*` are baked in at build time: redeploy after changing them. Deploy.
   Functions run in Portland (`pdx1`, set in `vercel.json`) next to the Supabase DB (us-west-2). Move both together.

Already ran an older `schema.sql`? Run the whole file again: it is idempotent and adds the v2 pieces.

The site talks to Postgres server-side only. RLS is on with no policies, so the public Supabase API exposes nothing.

## Admin (`/admin`)
Login with `ADMIN_PASSWORD` (Vercel env, min. 8 chars; change it to log everyone out).

| Path | What |
|---|---|
| `/admin` | Month calendar. Tap a table = snapshot (who, RSVP, allergies, wine, warnings). "+ Nova mesa". |
| `/admin/mesa/{id}` | Montar mesa: ranked queue (right) → "Sentar" / "+ par". Each seat: "Enviar no WhatsApp" (marks sent + opens wa.me with the invite text), copy link, set RSVP, remove. A "não" opens a **Substituir** card with the next 5 in line. After the dinner: attended, private rating, re-invite?, note. Feedback link. |
| `/admin/rede` | Invite network: your root links (create, cap, revoke), people per level, deepest level, who brought most people, full tree with each person's link use (x/3). |
| `/admin/pessoas`, `/admin/pessoas/{id}` | Everyone, signup answers, private rating/notes, couple link, table history, change log. |

Rules enforced **in the database** (no app bug can break them): seat cap per table, one table per guest per day.
Invites are never deleted: `invitations.status` = `sentado → enviado → sim | nao`, or `removido`. Every invite change and host-side guest change is written to `event_log` by triggers.
Queue order (`admin_queue`): never invited (oldest signup first) → marked re-invite → others; "sexta difícil" sinks; 3+ invites or "não reconvidar" = out.
Couples: each person signs up (own allergies/consent). The thank-you page gives a `/inscricao?par=CODE` link; the partner's signup links both. Or link two people by hand in `/admin/pessoas/{id}`.

Invite-only: nobody signs up without a link. Start the network in `/admin/rede` → "Criar link" (a root link, e.g. "Amigos do Natal", valid for N people). Everyone who joins gets their own link for 3 people. A partner (`?par=`) or a nominee (`?indica=`) does not use up anyone's 3. The tree is `guests.referred_by` + `guests.root_link_id` (view `admin_network`).

Pilot guests: tick "Piloto" on the person or table to keep them out of year-1 metrics. Host report (`host_reports`) is still filled in the Supabase Table Editor.

## Dev
```
cp .env.example .env.local   # point DATABASE_URL at any Postgres with db/schema.sql loaded
npm i && npm run dev
```
