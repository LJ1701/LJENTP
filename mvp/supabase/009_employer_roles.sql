-- The Assist, part 9: employers post a role by linking the posting they already have
-- (LinkedIn, Indeed, TeamWork Online or their own careers page). Candidates see it in the Jobs tab
-- and apply there, with their proof link. Nothing shows until the owner approves it (status = 'approved').
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.
--
-- To approve a role: Table Editor -> employer_roles -> change status from 'pending' to 'approved'.

create table if not exists public.employer_roles (
  id            uuid primary key default gen_random_uuid(),
  company       text not null check (char_length(company) between 1 and 120),
  contact_name  text not null check (char_length(contact_name) between 1 and 100),
  contact_email text not null check (char_length(contact_email) <= 200 and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role_title    text not null check (char_length(role_title) between 1 and 120),
  posting_url   text not null check (char_length(posting_url) <= 300 and posting_url ~* '^https?://'),
  source        text not null default 'other' check (source in ('linkedin', 'indeed', 'teamwork', 'other')),
  country       text not null default '' check (country = '' or country ~ '^[A-Z]{2}$'),
  wants_proof   boolean not null default true,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now()
);
create index if not exists employer_roles_status on public.employer_roles (status, created_at desc);

-- Private table: anyone may ADD a role, but only as 'pending'. No one can read, change or delete rows
-- through the app; approved roles are shown through the function below, which never returns contact details.
alter table public.employer_roles enable row level security;
drop policy if exists "Anyone can post a pending role" on public.employer_roles;
create policy "Anyone can post a pending role" on public.employer_roles for insert to anon, authenticated
  with check (status = 'pending');

create or replace function public.approved_roles()
returns table (id uuid, company text, role_title text, posting_url text, source text, country text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select r.id, r.company, r.role_title, r.posting_url, r.source, r.country, r.created_at
  from public.employer_roles r
  where r.status = 'approved'
  order by r.created_at desc
  limit 50;
$$;
revoke all on function public.approved_roles() from public;
grant execute on function public.approved_roles() to anon, authenticated;
