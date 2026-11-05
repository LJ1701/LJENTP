-- LJSportMind MVP, part 4: AI allowance, answer packs, Pro, school programs and pilot requests.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.
--
-- Only the server (with the secret service-role key) can change these tables. Signed-in users can read
-- their own billing row and nothing else, so nobody can give themselves free answers from the browser.

-- School / club programs. A director starts one and shares its join code with students.
create table if not exists public.programs (
  code         text primary key check (code ~ '^[A-Z0-9]{6}$'),
  name         text not null check (char_length(name) between 2 and 100),
  director     uuid not null unique references auth.users (id) on delete cascade,
  seats        int not null default 30 check (seats > 0),
  plan         text not null default 'pilot' check (plan in ('pilot', 'licence')),
  active_until timestamptz not null,
  created_at   timestamptz not null default now()
);

-- One row per user: free answers used this month, bought answers left, Pro and program membership.
create table if not exists public.billing (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  month               text not null default '',          -- the month "used" counts for, e.g. 2026-11
  used                int not null default 0,            -- free AI answers used that month
  pack_credits        int not null default 0,            -- bought answers left (they don't expire)
  pro_until           timestamptz,                       -- Pro is on until this time
  stripe_customer     text,
  stripe_subscription text,
  program_code        text references public.programs (code) on delete set null,
  updated_at          timestamptz not null default now()
);

-- Every Stripe checkout that was turned into answers or Pro, so one payment can never count twice.
create table if not exists public.payments (
  session_id text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('pack', 'pro')),
  created_at timestamptz not null default now()
);

-- "Request a pilot" form on /pricing.
create table if not exists public.pilot_requests (
  id           bigint generated always as identity primary key,
  name         text not null check (char_length(name) <= 100),
  email        text not null check (char_length(email) <= 200),
  organization text not null check (char_length(organization) <= 150),
  role         text not null default '' check (char_length(role) <= 100),
  students     int,
  message      text not null default '' check (char_length(message) <= 1000),
  created_at   timestamptz not null default now()
);

alter table public.programs enable row level security;
alter table public.billing enable row level security;
alter table public.payments enable row level security;
alter table public.pilot_requests enable row level security;

drop policy if exists "Read own billing" on public.billing;
create policy "Read own billing" on public.billing for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Director reads own program" on public.programs;
create policy "Director reads own program" on public.programs for select to authenticated using ((select auth.uid()) = director);
-- No insert/update/delete policies: only the server's service-role key can write.

-- Counts one AI answer. Free answers first (the counter restarts each month), then bought answers.
-- Pro and active program members are never charged. Returns false when nothing is left.
create or replace function public.spend_ai_answer(p_user uuid, p_month text, p_free int)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare b public.billing%rowtype;
begin
  insert into public.billing (user_id, month) values (p_user, p_month) on conflict (user_id) do nothing;
  select * into b from public.billing where user_id = p_user for update;
  if b.month <> p_month then
    update public.billing set month = p_month, used = 0 where user_id = p_user;
    b.used := 0;
  end if;
  if b.pro_until is not null and b.pro_until > now() then return true; end if;
  if b.program_code is not null and exists (
    select 1 from public.programs pr where pr.code = b.program_code and pr.active_until > now()
  ) then return true; end if;
  if b.used < p_free then
    update public.billing set used = used + 1, updated_at = now() where user_id = p_user;
    return true;
  end if;
  if b.pack_credits > 0 then
    update public.billing set pack_credits = pack_credits - 1, updated_at = now() where user_id = p_user;
    return true;
  end if;
  return false;
end;
$$;

-- Applies one paid Stripe checkout exactly once: 25 answers for a pack, or Pro until the given time.
create or replace function public.apply_payment(
  p_session text, p_user uuid, p_kind text, p_pro_until timestamptz, p_customer text, p_subscription text
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.payments (session_id, user_id, kind) values (p_session, p_user, p_kind) on conflict do nothing;
  if not found then return false; end if;   -- already applied
  insert into public.billing (user_id) values (p_user) on conflict (user_id) do nothing;
  if p_kind = 'pack' then
    update public.billing set pack_credits = pack_credits + 25, stripe_customer = coalesce(p_customer, stripe_customer), updated_at = now() where user_id = p_user;
  else
    update public.billing set pro_until = p_pro_until, stripe_customer = coalesce(p_customer, stripe_customer),
      stripe_subscription = p_subscription, updated_at = now() where user_id = p_user;
  end if;
  return true;
end;
$$;

revoke all on function public.spend_ai_answer(uuid, text, int) from public, anon, authenticated;
revoke all on function public.apply_payment(text, uuid, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.spend_ai_answer(uuid, text, int) to service_role;
grant execute on function public.apply_payment(text, uuid, text, timestamptz, text, text) to service_role;
