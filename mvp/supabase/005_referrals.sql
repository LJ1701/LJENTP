-- LJSportMind MVP, part 5: invite friends. Each person gets a personal invite code; when someone new arrives
-- through it and saves a Passport with at least one achievement, both get 5 extra AI answers.
-- The inviter is rewarded for their first 10 friends only (50 answers), so fake guest accounts can't farm answers.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.

alter table public.billing add column if not exists ref_code text unique check (ref_code ~ '^[a-z0-9]{8}$');
alter table public.billing add column if not exists referred_by uuid references auth.users (id) on delete set null;
alter table public.billing add column if not exists referrals int not null default 0;

-- Links a new user to the friend who invited them and gives both their answers, once. Returns false when the
-- code is unknown, is the user's own, or the user was already invited by someone.
create or replace function public.apply_referral(p_user uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare inviter uuid;
begin
  select user_id into inviter from public.billing where ref_code = p_code;
  if inviter is null or inviter = p_user then return false; end if;
  insert into public.billing (user_id) values (p_user) on conflict (user_id) do nothing;
  update public.billing set referred_by = inviter, pack_credits = pack_credits + 5, updated_at = now()
    where user_id = p_user and referred_by is null;
  if not found then return false; end if;
  update public.billing set
    pack_credits = pack_credits + case when referrals < 10 then 5 else 0 end,
    referrals = referrals + 1, updated_at = now()
    where user_id = inviter;
  return true;
end;
$$;

revoke all on function public.apply_referral(uuid, text) from public, anon, authenticated;
grant execute on function public.apply_referral(uuid, text) to service_role;
