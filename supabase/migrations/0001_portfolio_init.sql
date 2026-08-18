-- ---------------------------------------------------------------------------
-- DORMANT. The site does not read from these tables.
--
-- The portfolio ships as a static build whose content comes from
-- content/source.mjs. This schema, and the server/ that reads it, exist only as
-- an optional way to edit the CV without redeploying. Nothing is pointed at it.
--
-- If you decide you will never want that, this file and server/ can be deleted
-- and the eight tables dropped, and nothing about the site changes:
--
--   drop table if exists
--     public.portfolio_profile, public.portfolio_experience,
--     public.portfolio_education, public.portfolio_awards,
--     public.portfolio_skills, public.portfolio_projects,
--     public.portfolio_ambigrams, public.portfolio_case_studies;
--   drop function if exists public.portfolio_touch_updated_at();
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Portfolio content tables.
--
-- These live alongside the ghurnilipi commerce tables in the same project, so
-- everything here is prefixed portfolio_. PostgREST only exposes schemas that
-- are on the project's exposed-schema list, and `public` is the one that is
-- there by default — a separate `portfolio` schema would need a dashboard
-- change before the API could read it, which is a worse trade than a prefix.
--
-- Security posture: this is a public CV. Every row is world-readable and
-- nothing on the site writes. So each table gets RLS enabled with exactly one
-- policy — select, to anon and authenticated — and no insert/update/delete
-- policy at all. Writes therefore only happen through the service key, which
-- lives on Niaz's machine and is used by `npm run db:push`.
--
-- Text is stored as text, not varchar(n): Postgres treats them identically and
-- an arbitrary length cap on a CV summary is a migration waiting to happen.
-- ---------------------------------------------------------------------------

-- ── profile ────────────────────────────────────────────────────────────────
-- Single row, id = 'primary'. A check constraint enforces that rather than
-- leaving it to convention.

create table if not exists public.portfolio_profile (
  id           text primary key,
  name         text        not null,
  role         text        not null,
  employer     text        not null,
  location     text        not null,
  positioning  text        not null,
  email        text        not null,
  links        jsonb       not null default '{}'::jsonb,
  about        jsonb       not null default '[]'::jsonb,
  updated_at   timestamptz not null default now(),
  constraint portfolio_profile_single_row check (id = 'primary')
);

-- ── experience ─────────────────────────────────────────────────────────────

create table if not exists public.portfolio_experience (
  id         text primary key,
  -- Authored order, not date order. The most recently *started* role is not
  -- always the one a hiring panel should read first: the salaried job leads and
  -- the independent practice follows it, which is how the CV is arranged and is
  -- an editorial decision, not something to re-derive from start dates.
  sort_order integer not null,
  title      text not null,
  org        text not null,
  org_url    text,
  location   text not null,
  period     text not null,          -- as displayed, e.g. "September 2025 — present"
  starts_on  date not null,          -- as sorted; day is always 01
  ends_on    date,                   -- null = current
  summary    text not null,
  note       text,                   -- e.g. why a role is described generically
  tags       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint portfolio_experience_dates check (ends_on is null or ends_on >= starts_on)
);

create index if not exists portfolio_experience_order_idx
  on public.portfolio_experience (sort_order);

-- ── education / awards / skills ────────────────────────────────────────────

-- Every list on this site has an authored order, and none of it is derivable:
-- education runs most-recent-first, awards run by significance, and the skill
-- groups lead with Product because that is what the site is arguing. Postgres
-- returns rows in no particular order without an ORDER BY, so the order is
-- stored rather than hoped for.
create table if not exists public.portfolio_education (
  id            text primary key,
  sort_order    integer not null,
  qualification text not null,
  org           text not null,
  finished      text not null,
  result        text not null,
  updated_at    timestamptz not null default now()
);

create table if not exists public.portfolio_awards (
  id         text primary key,
  sort_order integer not null,
  title      text not null,
  year       text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_skills (
  id         text primary key,
  sort_order integer not null,
  label      text  not null,
  items      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint portfolio_skills_items_is_array check (jsonb_typeof(items) = 'array')
);

-- ── projects ───────────────────────────────────────────────────────────────

create table if not exists public.portfolio_projects (
  id         text primary key,
  sort_order integer not null,
  title      text    not null,
  kicker     text,
  one_liner  text    not null,
  body       text    not null,
  stack      jsonb   not null default '[]'::jsonb,
  link       text,
  -- When there is no link yet, this records what is missing so the site can
  -- show an honest gap instead of a dead "Live Demo" button.
  link_note  jsonb,
  updated_at timestamptz not null default now(),
  constraint portfolio_projects_stack_is_array check (jsonb_typeof(stack) = 'array')
);

create index if not exists portfolio_projects_order_idx
  on public.portfolio_projects (sort_order);

create index if not exists portfolio_education_order_idx
  on public.portfolio_education (sort_order);

create index if not exists portfolio_awards_order_idx
  on public.portfolio_awards (sort_order);

create index if not exists portfolio_skills_order_idx
  on public.portfolio_skills (sort_order);

-- ── ambigrams ──────────────────────────────────────────────────────────────
-- `reads` is the list of readings the piece resolves to, in rotation order:
--   [{ "bn": "মায়ীশা", "en": "Mayeesha" }, { "bn": "আমান", "en": "Aaman" }]
-- A single-name piece has one entry and reads as itself both ways up.

create table if not exists public.portfolio_ambigrams (
  id         text primary key,
  sort_order integer not null,
  kind       text    not null,
  reads      jsonb   not null,
  note       text,
  year       integer,
  widths     jsonb   not null default '[480, 960, 1600]'::jsonb,
  featured   boolean not null default false,
  is_hero    boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint portfolio_ambigrams_kind check (kind in ('couple', 'single', 'word')),
  constraint portfolio_ambigrams_reads_nonempty
    check (jsonb_typeof(reads) = 'array' and jsonb_array_length(reads) between 1 and 2)
);

create index if not exists portfolio_ambigrams_order_idx
  on public.portfolio_ambigrams (sort_order);

-- Exactly one piece can be the hero. A partial unique index says so in one line.
create unique index if not exists portfolio_ambigrams_one_hero_idx
  on public.portfolio_ambigrams ((true)) where is_hero;

-- ── case studies ───────────────────────────────────────────────────────────

create table if not exists public.portfolio_case_studies (
  id          text primary key,
  slug        text not null unique,
  title       text not null,
  role        text not null,
  period      text not null,
  repo        text,
  summary     text not null,
  sections    jsonb not null default '[]'::jsonb,
  outcomes    jsonb not null default '[]'::jsonb,
  -- Empty until media rights are cleared; photos_note records what is wanted.
  photos      jsonb not null default '[]'::jsonb,
  photos_note jsonb,
  video       jsonb,
  updated_at  timestamptz not null default now()
);

-- ── row level security ─────────────────────────────────────────────────────
-- Public read, no public write. Written out per table rather than in a loop so
-- that `\d+` and the dashboard both show the intent plainly.

alter table public.portfolio_profile      enable row level security;
alter table public.portfolio_experience   enable row level security;
alter table public.portfolio_education    enable row level security;
alter table public.portfolio_awards       enable row level security;
alter table public.portfolio_skills       enable row level security;
alter table public.portfolio_projects     enable row level security;
alter table public.portfolio_ambigrams    enable row level security;
alter table public.portfolio_case_studies enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'portfolio_profile', 'portfolio_experience', 'portfolio_education',
    'portfolio_awards', 'portfolio_skills', 'portfolio_projects',
    'portfolio_ambigrams', 'portfolio_case_studies'
  ] loop
    -- select only. The absence of insert/update/delete policies is what keeps
    -- the anon key harmless; RLS denies anything a policy does not permit.
    execute format(
      'drop policy if exists %I on public.%I',
      t || '_public_read', t
    );
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );
  end loop;
end $$;

-- ── updated_at ─────────────────────────────────────────────────────────────

create or replace function public.portfolio_touch_updated_at()
returns trigger
language plpgsql
-- Empty search_path: this function is invoked by a trigger under whatever role
-- is writing, so it must not resolve unqualified names from the caller's path.
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'portfolio_profile', 'portfolio_experience', 'portfolio_education',
    'portfolio_awards', 'portfolio_skills', 'portfolio_projects',
    'portfolio_ambigrams', 'portfolio_case_studies'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.portfolio_touch_updated_at()',
      t || '_touch', t
    );
  end loop;
end $$;
