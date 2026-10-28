-- LJSportMind MVP: guest mode and the "Several sports" choice.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.

-- 1. The Passport form offers "Several sports", but the original check only allowed single sports,
--    so saving that choice failed. Replace the check with the full list from lib/careers.js.
alter table public.sports_profiles drop constraint if exists sports_profiles_sport_check;
alter table public.sports_profiles add constraint sports_profiles_sport_check
  check (sport in ('', 'American football', 'Basketball', 'Baseball', 'Soccer', 'Hockey', 'Volleyball', 'Several sports', 'Other'));

-- 2. Guest mode needs no table changes: a guest is a real Supabase user (signed in anonymously) with its own
--    user ID, so the existing "own row only" policies already protect guest Passports.
--    Switch guests on in: Authentication -> Sign In / Providers -> "Allow anonymous sign-ins".
