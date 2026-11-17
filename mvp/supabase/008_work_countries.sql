-- LJSportMind MVP, part 8: where a candidate can already work, and where they'd like to.
-- Self-stated by the candidate. LJSportMind does not check work rights or give visa or legal advice.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.

alter table public.sports_profiles add column if not exists work_countries text[] not null default '{}'
  check (cardinality(work_countries) <= 10);
alter table public.sports_profiles add column if not exists target_countries text[] not null default '{}'
  check (cardinality(target_countries) <= 10);

-- The public page also returns both lists (only while the owner has the link switched on, as before).
drop function if exists public.public_profile(text);
create function public.public_profile(code text)
returns table (
  full_name text, role text, sport text, skills text[], interests text[], goal text,
  achievements text, role_idx smallint, steps jsonb, updated_at timestamptz,
  work_countries text[], target_countries text[]
)
language sql stable security definer set search_path = ''
as $$
  select p.full_name, p.role, p.sport, p.skills, p.interests, p.goal, p.achievements,
         pl.role_idx, pl.steps, p.updated_at, p.work_countries, p.target_countries
  from public.sports_profiles p
  left join public.plans pl on pl.user_id = p.user_id
  where p.is_public and p.public_code = code;
$$;
revoke all on function public.public_profile(text) from public;
grant execute on function public.public_profile(text) to anon, authenticated;
