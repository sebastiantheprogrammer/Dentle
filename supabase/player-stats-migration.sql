create extension if not exists pgcrypto;

create table if not exists public.dentle_players (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null unique,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists dentle_players_last_seen_at_idx
  on public.dentle_players (last_seen_at desc);

create index if not exists dentle_players_ip_hash_idx
  on public.dentle_players (ip_hash);

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

create index if not exists dentle_player_results_player_idx
  on public.dentle_player_results (player_id, board_date desc);

alter table public.dentle_players enable row level security;
alter table public.dentle_player_results enable row level security;

-- No public policies are intentionally created.
-- Dentle's server API accesses these tables with the service-role key.
