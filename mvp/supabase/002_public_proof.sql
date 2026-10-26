-- LJSportMind MVP, part 2: an opt-in public proof link for a Sports Profile.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run.

-- Off by default. The code is random and only exists once the owner switches the link on.
alter table public.sports_profiles
  add column if not exists is_public boolean not null default false,
  add column if not exists public_code text unique check (public_code ~ '^[a-z0-9]{10}$');

-- Strangers get no table access at all. They can only ask for ONE profile by its exact code, and only
-- while it is switched on; they can never list profiles. The owner still edits their row through the
-- existing "own row" rules.
create or replace function public.public_profile(code text)
returns table (
  full_name text, role text, sport text, skills text[], interests text[], goal text,
  achievements text, role_idx smallint, steps jsonb, updated_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select p.full_name, p.role, p.sport, p.skills, p.interests, p.goal, p.achievements,
         pl.role_idx, pl.steps, p.updated_at
  from public.sports_profiles p
  left join public.plans pl on pl.user_id = p.user_id
  where p.is_public and p.public_code = code;
$$;

revoke all on function public.public_profile(text) from public;
grant execute on function public.public_profile(text) to anon, authenticated;
