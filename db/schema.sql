-- Um Lugar à Mesa — schema
-- Run once in Supabase > SQL Editor (paste the whole file, Run).
-- Safe to re-run on an empty project. The site connects with DATABASE_URL (server only);
-- RLS is on with NO policies, so the public Supabase API (anon key) can read nothing.

create table if not exists groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Guest ID = guests.id
create table if not exists guests (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  email             text not null unique check (email = lower(email)),
  name              text not null,
  whatsapp          text not null,
  age_range         text,
  life_stage        text,
  allergies         text[] not null default '{}',
  allergy_notes     text,
  never_eats        text,
  wine              text check (wine in ('sim','nao')),          -- null = no answer = NO
  friday_ok         text,
  base_hosted       text,   -- baseline: hosted a meal, last 3 months
  base_been_hosted  text,   -- baseline: been hosted, last 3 months
  base_friends      text,   -- baseline: friends met 1x/month outside church/work
  would_host        text,
  cooks_for_groups  text,
  home_dish         text,
  referral_code     text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  referred_by       uuid references guests(id) on delete set null,
  consent_at        timestamptz not null,
  consent_version   text not null,
  is_pilot          boolean not null default false,  -- Christmas pilot: keep out of year-1 metrics
  -- PRIVATE (host only, never shown on the site)
  host_rating       smallint check (host_rating between 1 and 5),
  host_notes        text
);

-- Table ID = dinner_tables.id (feedback URL uses public_id)
create table if not exists dinner_tables (
  id                uuid primary key default gen_random_uuid(),
  public_id         text not null unique default lower(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  created_at        timestamptz not null default now(),
  group_id          uuid references groups(id) on delete set null,
  title             text not null default 'Jantar de sexta',
  meal_type         text not null default 'jantar',
  starts_at         timestamptz not null,
  duration_min      int not null default 210,
  address           text,              -- shown only after RSVP yes
  address_notes     text,              -- e.g. "interfone 42"
  suggested_amount  numeric(8,2),      -- {valor_sugerido}, shown only on the invite
  pix_key           text,              -- {chave_pix}
  wine_note         text,              -- what wine pairs with the meal; shown only if all invited guests said sim
  seats             int not null default 8,
  is_pilot          boolean not null default false,
  -- PRIVATE
  menu              text
);

-- Attendance / invite: guest ID + table ID. token = /convite/{token}
create table if not exists invitations (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique default lower(substr(replace(gen_random_uuid()::text,'-',''),1,16)),
  created_at    timestamptz not null default now(),
  guest_id      uuid not null references guests(id) on delete cascade,
  table_id      uuid not null references dinner_tables(id) on delete cascade,
  rsvp          text not null default 'pendente' check (rsvp in ('pendente','sim','nao')),
  rsvp_at       timestamptz,
  donated_seat  boolean not null default false,   -- someone else paid for this seat
  -- PRIVATE (host only)
  attended      boolean,
  host_rating   smallint check (host_rating between 1 and 5),
  host_note     text,
  reinvite      boolean,
  unique (guest_id, table_id)
);

-- Anonymous: table ID only, NEVER guest ID.
create table if not exists feedback (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  table_id         uuid not null references dinner_tables(id) on delete cascade,
  welcome          smallint not null check (welcome between 1 and 5),
  real_talk        text,   -- sim / nao
  again            text,   -- sim / talvez / nao
  reconnect_count  text,   -- 0 / 1 / 2-3 / 4+
  space            text,   -- nada / um pouco / muito
  food             smallint check (food between 1 and 5),
  would_host       text,   -- sim / talvez / nao
  one_word         text,
  change           text
);

-- PRIVATE host report, one per table
create table if not exists host_reports (
  table_id          uuid primary key references dinner_tables(id) on delete cascade,
  updated_at        timestamptz not null default now(),
  spent             numeric(8,2),
  received          numeric(8,2),
  donated_given     int,
  donated_used      int,
  hours_shopping    numeric(4,1),
  hours_prep        numeric(4,1),
  hours_cooking     numeric(4,1),
  hours_cleaning    numeric(4,1),
  chemistry         smallint check (chemistry between 1 and 5),
  connections       text,
  worked            text,
  didnt_work        text
);

create index if not exists invitations_table_idx on invitations(table_id);
create index if not exists feedback_table_idx on feedback(table_id);
create index if not exists guests_referred_idx on guests(referred_by);

-- Lock down the public API: no anon/authenticated access at all.
alter table groups        enable row level security;
alter table guests        enable row level security;
alter table dinner_tables enable row level security;
alter table invitations   enable row level security;
alter table feedback      enable row level security;
alter table host_reports  enable row level security;

-- ---------- Admin views (use in Supabase > Table Editor / SQL) ----------

-- Who is invited where, with the link to send on WhatsApp.
create or replace view admin_invites with (security_invoker = true) as
select t.title, t.starts_at at time zone 'America/Sao_Paulo' as quando, t.public_id as table_public_id,
       g.name, g.whatsapp, i.rsvp, i.rsvp_at, i.donated_seat,
       '/convite/' || i.token as invite_path,
       '/feedback/' || t.public_id as feedback_path,
       g.allergies, g.allergy_notes, g.never_eats, g.wine
from invitations i join guests g on g.id = i.guest_id join dinner_tables t on t.id = i.table_id
order by t.starts_at desc, g.name;

-- Per table: headcount, wine rule, menu constraints, feedback averages.
create or replace view admin_tables with (security_invoker = true) as
select t.id, t.public_id, t.title, t.starts_at at time zone 'America/Sao_Paulo' as quando, t.is_pilot,
       count(i.*) filter (where i.rsvp <> 'nao')                     as convidados_ativos,
       count(i.*) filter (where i.rsvp = 'sim')                      as confirmados,
       bool_and(g.wine = 'sim') filter (where i.rsvp <> 'nao')       as vinho_liberado,
       string_agg(distinct nullif(array_to_string(g.allergies, ', '), ''), ' | ') filter (where i.rsvp <> 'nao') as alergias,
       string_agg(distinct g.never_eats, ' | ') filter (where i.rsvp <> 'nao') as nao_come,
       (select count(*) from feedback f where f.table_id = t.id)    as respostas_feedback,
       (select round(avg(welcome),2) from feedback f where f.table_id = t.id) as bem_vindo_media,
       (select round(avg(food),2) from feedback f where f.table_id = t.id)    as comida_media
from dinner_tables t
left join invitations i on i.table_id = t.id
left join guests g on g.id = i.guest_id
group by t.id
order by t.starts_at desc;

-- Waitlist for building groups (no private host fields).
create or replace view admin_waitlist with (security_invoker = true) as
select g.created_at, g.name, g.whatsapp, g.email, g.age_range, g.life_stage, g.friday_ok, g.wine,
       g.allergies, g.allergy_notes, g.never_eats, g.would_host, g.cooks_for_groups, g.home_dish,
       r.name as indicado_por, g.is_pilot,
       (select count(*) from invitations i where i.guest_id = g.id) as convites
from guests g left join guests r on r.id = g.referred_by
order by g.created_at desc;

revoke all on all tables in schema public from anon, authenticated;
