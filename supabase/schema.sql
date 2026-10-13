-- LJSportMind: one Sports Profile per account.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row-level security: each signed-in user can reach only their own row.
alter table public.profiles enable row level security;

create policy "Read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Create own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Delete own profile" on public.profiles
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Pro waitlist: anyone can add an email; nobody can read the list through the app.
-- View sign-ups in the Supabase dashboard (Table Editor -> pro_waitlist).
create table if not exists public.pro_waitlist (
  email text primary key check (char_length(email) <= 254 and email like '%_@_%'),
  lang text,
  created_at timestamptz not null default now()
);

alter table public.pro_waitlist enable row level security;

create policy "Join the waitlist" on public.pro_waitlist
  for insert to anon, authenticated with check (true);

-- Pro subscriptions, written only by the Stripe webhook (service role key).
-- Members can read their own row so the app can show their Pro status.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  status text not null,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Read own subscription" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
