-- LJSportMind MVP, part 6: application tracker. One row per job a user tracks: where it stands
-- (saved, applied, interview, offer, not selected), when they applied, when to follow up, and notes.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.

create table if not exists public.applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  job_key    text not null check (char_length(job_key) between 1 and 120),
  title      text not null check (char_length(title) between 1 and 200),
  company    text not null default '' check (char_length(company) <= 120),
  location   text not null default '' check (char_length(location) <= 120),
  url        text not null default '' check (char_length(url) <= 1000),
  source     text not null default '' check (char_length(source) <= 80),
  status     text not null default 'saved' check (status in ('saved', 'applied', 'interview', 'offer', 'rejected')),
  applied_on date,
  follow_up  date,
  notes      text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_key)
);

-- Row level security: each signed-in user (guests too) can read and change only their own tracked jobs.
alter table public.applications enable row level security;
drop policy if exists "Read own applications" on public.applications;
drop policy if exists "Create own applications" on public.applications;
drop policy if exists "Update own applications" on public.applications;
drop policy if exists "Delete own applications" on public.applications;
create policy "Read own applications" on public.applications for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own applications" on public.applications for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own applications" on public.applications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own applications" on public.applications for delete to authenticated using ((select auth.uid()) = user_id);
