create extension if not exists pgcrypto;

create table if not exists public.dentle_case_moderation (
  case_id text primary key,
  board_date date not null,
  review_cycle integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'needs_review', 'reviewed', 'dismissed')),
  report_count integer not null default 0 check (report_count >= 0),
  last_reported_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dentle_case_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reporter_key text not null,
  case_id text not null references public.dentle_case_moderation(case_id) on delete cascade,
  board_date date not null,
  review_cycle integer not null default 0,
  reason text not null check (
    reason in (
      'incorrect_diagnosis',
      'radiograph_mismatch',
      'inconsistent_clues',
      'answer_should_be_accepted',
      'wrong_image',
      'too_easy',
      'too_hard',
      'other'
    )
  ),
  details text check (details is null or char_length(details) <= 1000),
  case_snapshot jsonb not null default '{}'::jsonb,
  unique (reporter_key, case_id, board_date, review_cycle)
);

create index if not exists dentle_case_reports_case_idx
  on public.dentle_case_reports (case_id, board_date, review_cycle);

create index if not exists dentle_case_reports_created_at_idx
  on public.dentle_case_reports (created_at desc);

create index if not exists dentle_case_moderation_status_idx
  on public.dentle_case_moderation (status, last_reported_at desc);

alter table public.dentle_case_reports enable row level security;
alter table public.dentle_case_moderation enable row level security;

-- No public policies are created. Dentle's API uses the service-role key.
