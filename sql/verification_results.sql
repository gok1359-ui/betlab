create extension if not exists "pgcrypto";

create table if not exists public.verification_results (
  id uuid primary key default gen_random_uuid(),
  game_pk bigint not null,
  market_type text not null,
  result text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.verification_results
add column if not exists game_pk bigint;

alter table public.verification_results
add column if not exists market_type text;

alter table public.verification_results
add column if not exists result text not null default 'pending';

alter table public.verification_results
add column if not exists created_at timestamptz not null default now();

create unique index if not exists idx_verification_results_game_market_unique
on public.verification_results(game_pk, market_type);
