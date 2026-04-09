-- BetLab 1차 오픈용 최소 스키마
-- Supabase SQL Editor에서 실행

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nickname text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  game_pk bigint not null,
  game_date date not null,
  home_team text not null,
  away_team text not null,
  market_type text not null default 'moneyline' check (market_type in ('moneyline', 'spread', 'total')),
  recommendation text not null,
  bb_value numeric(10, 4) not null default 0,
  reason text,
  expected_home_runs numeric(10, 2) default 0,
  expected_away_runs numeric(10, 2) default 0,
  expected_margin numeric(10, 2) default 0,
  expected_total numeric(10, 2) default 0,
  bb_breakdown_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analyses_game_date on public.analyses(game_date desc);
create index if not exists idx_analyses_game_pk on public.analyses(game_pk);
create index if not exists idx_analyses_bb_value on public.analyses(bb_value desc);

create table if not exists public.user_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  game_pk bigint not null,
  market_type text not null check (market_type in ('moneyline', 'spread', 'total')),
  pick_side text not null,
  saved_bb numeric(10, 4) default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.verification_results (
  id uuid primary key default gen_random_uuid(),
  game_pk bigint not null,
  market_type text not null check (market_type in ('moneyline', 'spread', 'total')),
  result text not null check (result in ('win', 'loss', 'push')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  memo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 초기 관리자 계정 예시
insert into public.users (email, nickname, role, status)
values ('admin@betlab.app', 'admin', 'admin', 'active')
on conflict (email) do nothing;

-- 초기 분석 데이터 예시
insert into public.analyses (
  game_pk, game_date, home_team, away_team, market_type, recommendation, bb_value, reason,
  expected_home_runs, expected_away_runs, expected_margin, expected_total, bb_breakdown_json
) values
(
  1001, '2026-04-03', 'Dodgers', 'Padres', 'moneyline', '머니라인 홈 강추천', 0.2800, '선발 우위 + 불펜 우위',
  5.1, 3.8, 1.3, 8.9,
  '{"pitcher":0.18,"form":0.05,"batting":0.09,"bullpen":0.11,"lineup":0.03,"park":0.02}'::jsonb
),
(
  1002, '2026-04-03', 'Yankees', 'Blue Jays', 'total', '언오버 오버 중추천', 0.1800, '타격 흐름 + 구장 영향',
  4.9, 4.7, 0.2, 9.6,
  '{"pitcher":0.04,"form":0.08,"batting":0.12,"bullpen":0.03,"lineup":0.02,"park":0.05}'::jsonb
)
on conflict do nothing;
