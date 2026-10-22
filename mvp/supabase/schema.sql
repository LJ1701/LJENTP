-- LJSportMind MVP: Sports Profiles and saved plans.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run.
-- Safe to run again: it drops and recreates only its own policies.

-- One Sports Profile per account.
create table if not exists public.sports_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '' check (char_length(full_name) <= 100),
  location     text not null default '' check (char_length(location) <= 100),
  role         text not null default '' check (char_length(role) <= 40),
  sport        text not null default '' check (sport in ('', 'American football', 'Basketball', 'Baseball', 'Soccer', 'Hockey', 'Volleyball', 'Other')),
  skills       text[] not null default '{}',
  interests    text[] not null default '{}',
  goal         text not null default '' check (char_length(goal) <= 200),
  achievements text not null default '' check (char_length(achievements) <= 4000),
  updated_at   timestamptz not null default now()
);

-- One saved plan per account: the target career and its checklist.
create table if not exists public.plans (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role_idx   smallint not null check (role_idx between 0 and 7),
  steps      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row level security: each signed-in user can read and change only their own row.
alter table public.sports_profiles enable row level security;
alter table public.plans enable row level security;

drop policy if exists "Read own profile" on public.sports_profiles;
drop policy if exists "Create own profile" on public.sports_profiles;
drop policy if exists "Update own profile" on public.sports_profiles;
drop policy if exists "Delete own profile" on public.sports_profiles;
create policy "Read own profile" on public.sports_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own profile" on public.sports_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own profile" on public.sports_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own profile" on public.sports_profiles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Read own plan" on public.plans;
drop policy if exists "Create own plan" on public.plans;
drop policy if exists "Update own plan" on public.plans;
drop policy if exists "Delete own plan" on public.plans;
create policy "Read own plan" on public.plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own plan" on public.plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own plan" on public.plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own plan" on public.plans for delete to authenticated using ((select auth.uid()) = user_id);
