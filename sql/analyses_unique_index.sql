create unique index if not exists idx_analyses_game_market_date_unique
on public.analyses(game_pk, market_type, game_date);
