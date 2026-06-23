create extension if not exists pgcrypto;

create table if not exists public.dentle_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor_id text,
  event_type text not null check (
    event_type in (
      'page_view',
      'board_select',
      'guess_submit',
      'board_solved',
      'board_failed',
      'subscribe_prompt_view',
      'subscribe_prompt_dismiss',
      'subscribe_submit'
    )
  ),
  board_id text,
  board_mode text,
  board_category text,
  attempt_number integer,
  is_correct boolean,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists dentle_events_created_at_idx on public.dentle_events (created_at desc);
create index if not exists dentle_events_event_type_idx on public.dentle_events (event_type);
create index if not exists dentle_events_board_mode_idx on public.dentle_events (board_mode);
create index if not exists dentle_events_guess_text_idx on public.dentle_events ((metadata->>'guess_text')) where event_type = 'guess_submit';

create table if not exists public.dentle_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  visitor_id text,
  source text not null default 'correct_popup',
  notify_daily boolean not null default true
);

create index if not exists dentle_subscribers_created_at_idx on public.dentle_subscribers (created_at desc);

create table if not exists public.dentle_daily_cases (
  id uuid primary key default gen_random_uuid(),
  publish_date date not null unique,
  source text not null default 'admin',
  status text not null default 'published' check (status in ('draft', 'published')),
  cases jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dentle_daily_cases_publish_date_idx on public.dentle_daily_cases (publish_date desc);

create table if not exists public.dentle_players (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null unique,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists dentle_players_last_seen_at_idx on public.dentle_players (last_seen_at desc);
create index if not exists dentle_players_ip_hash_idx on public.dentle_players (ip_hash);

create table if not exists public.dentle_player_results (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.dentle_players(id) on delete cascade,
  board_date date not null,
  board_id text not null,
  solved boolean not null default false,
  attempt_number integer check (attempt_number between 1 and 6),
  created_at timestamptz not null default now(),
  unique (player_id, board_date, board_id)
);

create index if not exists dentle_player_results_player_idx on public.dentle_player_results (player_id, board_date desc);

alter table public.dentle_events enable row level security;
alter table public.dentle_subscribers enable row level security;
alter table public.dentle_daily_cases enable row level security;
alter table public.dentle_players enable row level security;
alter table public.dentle_player_results enable row level security;

drop policy if exists "Allow public event inserts" on public.dentle_events;
create policy "Allow public event inserts"
  on public.dentle_events
  for insert
  to anon, authenticated
  with check (
    event_type in (
      'page_view',
      'board_select',
      'guess_submit',
      'board_solved',
      'board_failed',
      'subscribe_prompt_view',
      'subscribe_prompt_dismiss',
      'subscribe_submit'
    )
  );

drop policy if exists "Allow public subscriber inserts" on public.dentle_subscribers;
create policy "Allow public subscriber inserts"
  on public.dentle_subscribers
  for insert
  to anon, authenticated
  with check (
    email is not null
    and length(email) <= 320
  );

drop policy if exists "Allow public published daily case reads" on public.dentle_daily_cases;
create policy "Allow public published daily case reads"
  on public.dentle_daily_cases
  for select
  to anon, authenticated
  using (status = 'published');
