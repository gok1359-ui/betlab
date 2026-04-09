create extension if not exists "pgcrypto";

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  content text not null,
  author_nickname text default '익명',
  created_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid,
  content text not null,
  author_nickname text default '익명',
  created_at timestamptz not null default now()
);

create index if not exists idx_community_posts_created_at on public.community_posts(created_at desc);
create index if not exists idx_community_comments_post_id on public.community_comments(post_id);
