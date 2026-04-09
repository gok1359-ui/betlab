create extension if not exists "pgcrypto";

create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  settings_key text not null unique,
  settings_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings
add column if not exists settings_json jsonb not null default '{}'::jsonb;

alter table public.admin_settings
add column if not exists updated_at timestamptz not null default now();

insert into public.admin_settings (settings_key, settings_json)
values (
  'betlab_core',
  '{
    "homeAdvantage": 0.12,
    "pitcherWeight": 1.0,
    "formWeight": 0.8,
    "battingWeight": 0.9,
    "bullpenWeight": 0.85,
    "totalWeight": 1.0,
    "strongThreshold": 0.22,
    "mediumThreshold": 0.12
  }'::jsonb
)
on conflict (settings_key) do nothing;
