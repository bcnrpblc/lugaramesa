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
  base_friends      text,   -- baseline: friends met 1x/month outside work/church/college
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

-- =====================================================================
-- v2 (2026-11-12): admin, couples, replacements, audit log.
-- Idempotent: safe to run on a DB that already has v1.
-- =====================================================================

-- Couples: two guest rows (consent is per person), one party.
create table if not exists parties (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);
alter table guests add column if not exists party_id     uuid references parties(id) on delete set null;
alter table guests add column if not exists partner_code text unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
alter table guests add column if not exists life_answer  text;   -- optional: "uma primeira vez recente"
alter table guests add column if not exists foods        text[] not null default '{}';   -- favorite kinds of food (multi)
update guests set partner_code = upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)) where partner_code is null;
alter table guests alter column partner_code set not null;

-- Invitation lifecycle. Rows are never deleted; status is derived.
alter table invitations add column if not exists sent_at     timestamptz;
alter table invitations add column if not exists removed_at  timestamptz;   -- host took them off the table
alter table invitations add column if not exists replaces_id uuid references invitations(id) on delete set null;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='invitations' and column_name='status') then
    alter table invitations add column status text generated always as (
      case when removed_at is not null then 'removido'
           when rsvp = 'sim' then 'sim'
           when rsvp = 'nao' then 'nao'
           when sent_at is not null then 'enviado'
           else 'sentado' end) stored;
  end if;
end $$;

-- Guards that live in the DB, so no app bug can overbook a table.
create or replace function invitations_guard() returns trigger language plpgsql as $$
declare cap int; taken int; t_start timestamptz; clash int;
begin
  if new.removed_at is null and new.rsvp <> 'nao' then
    select seats, starts_at into cap, t_start from dinner_tables where id = new.table_id for update;
    select count(*) into taken from invitations
      where table_id = new.table_id and id <> new.id and removed_at is null and rsvp <> 'nao';
    if taken >= cap then
      raise exception 'MESA_CHEIA: % de % lugares ocupados', taken, cap using errcode = 'P0001';
    end if;
    select count(*) into clash from invitations i join dinner_tables t on t.id = i.table_id
      where i.guest_id = new.guest_id and i.id <> new.id and i.table_id <> new.table_id
        and i.removed_at is null and i.rsvp <> 'nao'
        and (t.starts_at at time zone 'America/Sao_Paulo')::date = (t_start at time zone 'America/Sao_Paulo')::date;
    if clash > 0 then
      raise exception 'MESMA_NOITE: convidado já está em outra mesa nesse dia' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists invitations_guard on invitations;
create trigger invitations_guard before insert or update of rsvp, removed_at, table_id on invitations
  for each row execute function invitations_guard();

-- Audit log: every invitation change + host-side guest changes. Written by triggers.
-- No health data is copied here; guest_id cascade keeps LGPD erasure working.
create table if not exists event_log (
  id            bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  kind          text not null,         -- invite.insert / invite.update / guest.update
  guest_id      uuid references guests(id) on delete cascade,
  table_id      uuid references dinner_tables(id) on delete cascade,
  invitation_id uuid references invitations(id) on delete cascade,
  changes       jsonb not null default '{}'
);
create index if not exists event_log_guest_idx on event_log(guest_id, at desc);
create index if not exists event_log_table_idx on event_log(table_id, at desc);
alter table event_log enable row level security;
alter table parties   enable row level security;

create or replace function log_invitation() returns trigger language plpgsql as $$
declare d jsonb := '{}'; k text;
begin
  if tg_op = 'INSERT' then
    d := jsonb_build_object('status', new.status, 'replaces_id', new.replaces_id);
  else
    foreach k in array array['rsvp','sent_at','removed_at','attended','host_rating','reinvite','donated_seat','table_id'] loop
      if to_jsonb(old) -> k is distinct from to_jsonb(new) -> k then
        d := d || jsonb_build_object(k, jsonb_build_array(to_jsonb(old) -> k, to_jsonb(new) -> k));
      end if;
    end loop;
    if d = '{}' then return new; end if;
  end if;
  insert into event_log(kind, guest_id, table_id, invitation_id, changes)
    values ('invite.' || lower(tg_op), new.guest_id, new.table_id, new.id, d);
  return new;
end $$;
drop trigger if exists log_invitation on invitations;
create trigger log_invitation after insert or update on invitations for each row execute function log_invitation();

create or replace function log_guest() returns trigger language plpgsql as $$
declare d jsonb := '{}'; k text;
begin
  foreach k in array array['party_id','host_rating','host_notes','is_pilot','email','whatsapp','name'] loop
    if to_jsonb(old) -> k is distinct from to_jsonb(new) -> k then
      d := d || jsonb_build_object(k, jsonb_build_array(to_jsonb(old) -> k, to_jsonb(new) -> k));
    end if;
  end loop;
  if d <> '{}' then
    insert into event_log(kind, guest_id, changes) values ('guest.update', new.id, d);
  end if;
  return new;
end $$;
drop trigger if exists log_guest on guests;
create trigger log_guest after update on guests for each row execute function log_guest();

create index if not exists guests_party_idx on guests(party_id);
create index if not exists invitations_guest_idx on invitations(guest_id);

-- Views hold no data; drop so column changes re-apply cleanly (create or replace can't reorder/rename columns).
drop view if exists admin_queue, admin_invites, admin_tables, admin_waitlist;

-- Ranked waitlist ("who's next"). tier: 0 never invited, 1 marked re-invite, 2 other, 9 out (3+ invites or reinvite=false).
create or replace view admin_queue with (security_invoker = true) as
with h as (
  select g.id,
         count(i.*) filter (where i.removed_at is null)                         as invites,
         count(i.*) filter (where i.attended)                                   as attended,
         max(t.starts_at) filter (where i.removed_at is null)                   as last_table_at,
         bool_or(i.reinvite) filter (where i.removed_at is null)                as any_reinvite_yes,
         bool_or(i.reinvite = false) filter (where i.removed_at is null)        as any_reinvite_no
  from guests g
  left join invitations i on i.guest_id = g.id
  left join dinner_tables t on t.id = i.table_id
  group by g.id
)
select g.id, g.name, g.whatsapp, g.created_at, g.age_range, g.life_stage, g.friday_ok, g.wine,
       g.allergies, g.never_eats, g.party_id, g.is_pilot, g.host_rating, g.life_answer, g.home_dish,
       (select p.name from guests p where p.party_id = g.party_id and p.id <> g.id limit 1) as partner_name,
       h.invites, h.attended, h.last_table_at,
       case when h.invites = 0 then 0
            when coalesce(h.any_reinvite_no, false) or h.invites >= 3 then 9
            when h.any_reinvite_yes then 1
            else 2 end as tier
from guests g join h on h.id = g.id;

-- =====================================================================
-- v3 (2026-11-12): guest page, photos, free Fridays, nominations.
-- =====================================================================

-- Personal guest page /eu/{guest_token} (no login).
alter table guests add column if not exists guest_token text unique default lower(substr(replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-',''),1,24));
update guests set guest_token = lower(substr(replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-',''),1,24)) where guest_token is null;
alter table guests alter column guest_token set not null;

-- Photo: optional, own consent. Bytes live in R2 (private bucket) at guests/{guest_id}.jpg; this row = consent + "has photo".
create table if not exists guest_photos (
  guest_id    uuid primary key references guests(id) on delete cascade,
  data        bytea,   -- unused since photos moved to R2
  mime        text not null default 'image/jpeg' check (mime = 'image/jpeg'),
  consent_at  timestamptz not null,
  updated_at  timestamptz not null default now()
);

-- Fridays (or any day) the guest says they are free.
create table if not exists availability (
  guest_id    uuid not null references guests(id) on delete cascade,
  day         date not null,
  created_at  timestamptz not null default now(),
  primary key (guest_id, day)
);
create index if not exists availability_day_idx on availability(day);

-- A confirmed guest suggests a friend for an open seat. Host approves or declines.
alter table dinner_tables add column if not exists allow_nominations boolean not null default false;
create table if not exists nominations (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  table_id           uuid not null references dinner_tables(id) on delete cascade,
  nominator_id       uuid not null references invitations(id) on delete cascade,
  nominee_id         uuid not null references guests(id) on delete cascade,
  status             text not null default 'pendente' check (status in ('pendente','aprovada','recusada')),
  decided_at         timestamptz,
  unique (table_id, nominee_id),
  unique (nominator_id)            -- one friend per guest per table
);
create index if not exists nominations_table_idx on nominations(table_id);

alter table guest_photos alter column data drop not null;
alter table guest_photos enable row level security;
alter table availability enable row level security;
alter table nominations  enable row level security;

create or replace function log_nomination() returns trigger language plpgsql as $$
begin
  insert into event_log(kind, guest_id, table_id, changes)
    values ('nomination.' || lower(tg_op), new.nominee_id, new.table_id,
            jsonb_build_object('status', new.status, 'nominator_invitation', new.nominator_id));
  return new;
end $$;
drop trigger if exists log_nomination on nominations;
create trigger log_nomination after insert or update of status on nominations for each row execute function log_nomination();

-- ---------- Admin views (use in Supabase > Table Editor / SQL) ----------

-- Who is invited where, with the link to send on WhatsApp.
create or replace view admin_invites with (security_invoker = true) as
select t.title, t.starts_at at time zone 'America/Sao_Paulo' as quando, t.public_id as table_public_id,
       g.name, g.whatsapp, i.status, i.rsvp, i.rsvp_at, i.sent_at, i.donated_seat,
       '/convite/' || i.token as invite_path,
       '/feedback/' || t.public_id as feedback_path,
       g.allergies, g.allergy_notes, g.never_eats, g.wine
from invitations i join guests g on g.id = i.guest_id join dinner_tables t on t.id = i.table_id
order by t.starts_at desc, g.name;

-- Per table: headcount, wine rule, menu constraints, feedback averages.
create or replace view admin_tables with (security_invoker = true) as
select t.id, t.public_id, t.title, t.starts_at at time zone 'America/Sao_Paulo' as quando, t.is_pilot,
       count(i.*) filter (where i.rsvp <> 'nao' and i.removed_at is null)                     as convidados_ativos,
       count(i.*) filter (where i.rsvp = 'sim')                      as confirmados,
       bool_and(g.wine = 'sim') filter (where i.rsvp <> 'nao' and i.removed_at is null)       as vinho_liberado,
       string_agg(distinct nullif(array_to_string(g.allergies, ', '), ''), ' | ') filter (where i.rsvp <> 'nao' and i.removed_at is null) as alergias,
       string_agg(distinct g.never_eats, ' | ') filter (where i.rsvp <> 'nao' and i.removed_at is null) as nao_come,
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
       (select count(*) from invitations i where i.guest_id = g.id and i.removed_at is null) as convites
from guests g left join guests r on r.id = g.referred_by
order by g.created_at desc;


revoke all on all tables in schema public from anon, authenticated;
