-- The Assist, part 12: stories shared with The Assist after an interview, with no account behind them.
-- user_id can be empty. Those stories can't be edited from the app (no author account), only in Supabase.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again. (Run 18 Nov 2026.)
alter table public.stories alter column user_id drop not null;

-- First story added this way (18 Nov 2026): person-3, a play-by-play radio broadcaster, from his interview,
-- in his words, published with his OK. To add another: insert a row with user_id null and status 'approved'.
