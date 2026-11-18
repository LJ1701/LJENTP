-- The Assist, part 10: Stories ("How I got in"). People who got into sports share their real path, step by step,
-- so job seekers can work backwards from what actually worked. Plus a waitlist button that tests demand for
-- paid feedback (no payments are built).
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.
--
-- To approve a story: Table Editor -> stories -> change status from 'pending' to 'approved'.
-- Any edit by the author puts it back to 'pending', so changed stories are checked again.

create table if not exists public.stories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 60),
  role_title    text not null check (char_length(role_title) between 1 and 120),
  field         text not null default 'other' check (field in ('broadcasting', 'media', 'operations', 'marketing', 'sales', 'coaching', 'analytics', 'business', 'other')),
  country       text not null default '' check (country = '' or country ~ '^[A-Z]{2}$'),
  steps         jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 1 and 12 and octet_length(steps::text) <= 8000),
  helped        text not null default '' check (char_length(helped) <= 500),
  vouched       boolean,
  advice        text not null default '' check (char_length(advice) <= 1000),
  pay_range     text not null default '' check (pay_range in ('', 'under20', '20to30', '30to45', '45to60', 'over60')),
  link_proof    boolean not null default false,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists stories_status on public.stories (status, created_at desc);

alter table public.stories enable row level security;

-- Authors see and manage only their own story. Guests (anonymous accounts) can't post.
-- They can only ever save it as 'pending'; approving happens in Supabase by the owner.
drop policy if exists "Authors read their story" on public.stories;
create policy "Authors read their story" on public.stories for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "Authors add their story" on public.stories;
create policy "Authors add their story" on public.stories for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
drop policy if exists "Authors edit their story" on public.stories;
create policy "Authors edit their story" on public.stories for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "Authors delete their story" on public.stories;
create policy "Authors delete their story" on public.stories for delete to authenticated
  using (user_id = auth.uid());

-- Visitors read approved stories only, through these functions. Never returns the author's email or account id.
-- The proof link is included only if the author chose to link it AND their public link is switched on.
create or replace function public.approved_stories()
returns table (id uuid, display_name text, role_title text, field text, country text, steps jsonb, helped text,
               vouched boolean, advice text, pay_range text, proof_code text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.display_name, s.role_title, s.field, s.country, s.steps, s.helped, s.vouched, s.advice, s.pay_range,
         case when s.link_proof and p.is_public then p.public_code else null end, s.created_at
  from public.stories s
  left join public.sports_profiles p on p.user_id = s.user_id
  where s.status = 'approved'
  order by s.created_at desc
  limit 200;
$$;
revoke all on function public.approved_stories() from public;
grant execute on function public.approved_stories() to anon, authenticated;

-- Paid-feedback demand test: someone clicks "Ask for feedback" on a story and joins a waitlist.
-- Email is optional (only if they want to hear when it opens). Nobody can read this table except the owner in Supabase.
create table if not exists public.feedback_waitlist (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.stories (id) on delete cascade,
  user_id    uuid references auth.users (id) on delete set null,
  email      text not null default '' check (email = '' or (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  created_at timestamptz not null default now()
);
create unique index if not exists feedback_waitlist_once on public.feedback_waitlist (story_id, user_id) where user_id is not null;
alter table public.feedback_waitlist enable row level security;
drop policy if exists "Anyone can join the waitlist" on public.feedback_waitlist;
create policy "Anyone can join the waitlist" on public.feedback_waitlist for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
