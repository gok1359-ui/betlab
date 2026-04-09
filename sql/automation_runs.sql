create extension if not exists "pgcrypto";

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null default 'cron',
  analyzed_count integer not null default 0,
  saved_analyses_count integer not null default 0,
  verification_saved_count integer not null default 0,
  settlement_settled_count integer not null default 0,
  settlement_affected_users integer not null default 0,
  status text not null default 'success',
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_automation_runs_created_at
on public.automation_runs(created_at desc);
