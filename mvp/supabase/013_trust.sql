-- The Assist, part 13: trust levels. Who people are, and how much each claim has been checked.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.
--
-- What it adds:
--   1. Reference confirmations now need the reference to sign in with their email (a one-time link), so a
--      confirmation can't be faked from a signed-out second browser. Work emails and personal emails are
--      labelled differently. One confirmer can confirm at most 20 claims a day, and can withdraw.
--   2. Link ownership: the owner pastes a short code into the page they link to (a video description, a bio),
--      and the app checks it. Only the server (service-role key) can mark a link verified.
--   3. Public trust badges: email confirmed, school email, LinkedIn connected.
--   4. Reports: anyone can report a profile, role or story. Only the owner of The Assist can read them.
--   5. Employer roles remember the domain of the poster's email.

-- 1. Who confirmed, from which kind of email ------------------------------------------------------------
alter table public.portfolio_items add column if not exists confirmer_id uuid references auth.users (id) on delete set null;
alter table public.portfolio_items add column if not exists confirmer_domain text not null default '' check (char_length(confirmer_domain) <= 120);
alter table public.portfolio_items add column if not exists confirmer_kind text not null default ''
  check (confirmer_kind in ('', 'work', 'personal'));

-- Free email providers: a confirmation from one of these is labelled "personal email".
create or replace function public.is_personal_email_domain(d text)
returns boolean
language sql immutable set search_path = ''
as $$
  select lower(coalesce(d, '')) = any (array[
    'gmail.com','googlemail.com','yahoo.com','yahoo.co.uk','ymail.com','hotmail.com','hotmail.co.uk','outlook.com',
    'live.com','msn.com','icloud.com','me.com','mac.com','aol.com','proton.me','protonmail.com','gmx.com','gmx.de',
    'gmx.net','mail.com','yandex.com','yandex.ru','qq.com','163.com','126.com','zoho.com','web.de','libero.it',
    'orange.fr','free.fr','wanadoo.fr','laposte.net','t-online.de','btinternet.com','sky.com','virginmedia.com',
    'comcast.net','att.net','verizon.net','sbcglobal.net','bellsouth.net','rediffmail.com','naver.com','yahoo.co.jp'
  ]) or lower(coalesce(d, '')) like 'yahoo.%' or lower(coalesce(d, '')) like 'hotmail.%' or lower(coalesce(d, '')) like 'outlook.%';
$$;

-- The reference answers. Now they must be signed in with a Google (or, later, Microsoft) WORK account: not a
-- guest, not a typed-in email, not Gmail/Outlook. That proves they really are someone at that organisation. One answer per link; never the owner; at most 20 confirmations a day.
create or replace function public.reference_answer(token text, answer text, note text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  it record;
  me uuid := auth.uid();
  my_email text;
  owner_email text;
  dom text;
begin
  if answer not in ('confirmed', 'declined') or length(token) <> 64 then return 'bad'; end if;
  if me is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then return 'email'; end if;
  select u.email into my_email from auth.users u where u.id = me and u.email_confirmed_at is not null;
  if my_email is null then return 'email'; end if;
  -- Identity comes from Google or Microsoft (they have already checked the address), not a typed-in email.
  if not exists (select 1 from auth.identities a where a.user_id = me and a.provider in ('google', 'azure')) then return 'email'; end if;
  select i.id, i.user_id, i.confirm_status into it from public.portfolio_items i
  where i.kind = 'reference' and i.confirm_token = token;
  if not found then return 'missing'; end if;
  if it.user_id = me then return 'owner'; end if;
  select u.email into owner_email from auth.users u where u.id = it.user_id;
  if owner_email is not null and lower(owner_email) = lower(my_email) then return 'owner'; end if;
  if it.confirm_status <> '' then return 'done'; end if;
  if answer = 'confirmed' and (
    select count(*) from public.portfolio_items x
    where x.confirmer_id = me and x.confirm_status = 'confirmed' and x.confirmed_at > now() - interval '1 day'
  ) >= 20 then return 'limit'; end if;
  dom := lower(split_part(my_email, '@', 2));
  -- Only work accounts can confirm (a friend's Gmail proves nothing about the claim).
  if public.is_personal_email_domain(dom) then return 'personal'; end if;
  update public.portfolio_items
     set confirm_status = answer, confirmed_at = now(), confirm_note = left(coalesce(trim(note), ''), 300),
         confirmer_id = me, confirmer_domain = left(dom, 120),
         confirmer_kind = case when public.is_personal_email_domain(dom) then 'personal' else 'work' end
   where id = it.id;
  return 'ok';
end;
$$;
revoke all on function public.reference_answer(text, text, text) from public;
grant execute on function public.reference_answer(text, text, text) to authenticated;

-- The confirmer can withdraw their own answer; the claim goes back to "not confirmed yet".
create or replace function public.reference_withdraw(token text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
begin
  if auth.uid() is null or length(token) <> 64 then return 'bad'; end if;
  update public.portfolio_items
     set confirm_status = '', confirmed_at = null, confirm_note = '', confirmer_id = null, confirmer_domain = '', confirmer_kind = ''
   where kind = 'reference' and confirm_token = token and confirmer_id = auth.uid();
  if not found then return 'missing'; end if;
  return 'ok';
end;
$$;
revoke all on function public.reference_withdraw(text) from public;
grant execute on function public.reference_withdraw(text) to authenticated;

-- What the reference page shows, now including whether the person looking at it is the one who answered.
drop function if exists public.reference_request(text);
create function public.reference_request(token text)
returns table (
  owner_name text, ref_name text, ref_role text, ref_org text, ref_relation text,
  achievement text, description text, confirm_status text, confirmed_at timestamptz, answered_by_me boolean
)
language sql stable security definer set search_path = ''
as $$
  select coalesce(nullif(p.full_name, ''), 'This person'), i.ref_name, i.ref_role, i.ref_org, i.ref_relation,
         i.achievement, i.description, i.confirm_status, i.confirmed_at,
         (i.confirmer_id is not null and i.confirmer_id = auth.uid())
  from public.portfolio_items i
  left join public.sports_profiles p on p.user_id = i.user_id
  where i.kind = 'reference' and length(token) = 64 and i.confirm_token = token;
$$;
revoke all on function public.reference_request(text) from public;
grant execute on function public.reference_request(text) to anon, authenticated;

-- 2. Link ownership ---------------------------------------------------------------------------------------
alter table public.portfolio_items add column if not exists link_code text not null default '' check (char_length(link_code) <= 40);
alter table public.portfolio_items add column if not exists link_verified_at timestamptz;

-- The owner asks for a code for one of their own links. Returns the same code if one exists.
create or replace function public.portfolio_link_code(item uuid)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare c text;
begin
  select i.link_code into c from public.portfolio_items i where i.id = item and i.user_id = auth.uid() and i.kind = 'link';
  if not found then return null; end if;
  if c = '' then
    c := 'assist-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    update public.portfolio_items set link_code = c where id = item and user_id = auth.uid();
  end if;
  return c;
end;
$$;
revoke all on function public.portfolio_link_code(uuid) from public;
grant execute on function public.portfolio_link_code(uuid) to authenticated;
-- link_verified_at has no policy that lets users write it: only the server's service-role key sets it,
-- after it has fetched the page and found the code.

-- The public page returns the trust details (never the confirmer's full email, only its domain).
drop function if exists public.public_portfolio(text);
create function public.public_portfolio(code text)
returns table (
  id uuid, kind text, title text, description text, achievement text, url text, file_path text,
  file_name text, file_type text, ref_name text, ref_role text, ref_org text, ref_relation text, ref_contact text,
  confirm_status text, confirmed_at timestamptz, confirm_note text,
  confirmer_domain text, confirmer_kind text, link_verified boolean
)
language sql stable security definer set search_path = ''
as $$
  select i.id, i.kind, i.title, i.description, i.achievement, i.url, i.file_path, i.file_name, i.file_type,
         i.ref_name, i.ref_role, i.ref_org, i.ref_relation,
         case when i.show_contact then i.ref_contact else '' end,
         case when i.confirm_status = 'confirmed' then 'confirmed' else '' end,
         case when i.confirm_status = 'confirmed' then i.confirmed_at end,
         case when i.confirm_status = 'confirmed' then i.confirm_note else '' end,
         case when i.confirm_status = 'confirmed' and i.confirmer_kind = 'work' then i.confirmer_domain else '' end,
         case when i.confirm_status = 'confirmed' then i.confirmer_kind else '' end,
         i.link_verified_at is not null
  from public.portfolio_items i
  join public.sports_profiles p on p.user_id = i.user_id
  where p.is_public and p.public_code = code
  order by i.created_at;
$$;
revoke all on function public.public_portfolio(text) from public;
grant execute on function public.public_portfolio(text) to anon, authenticated;

-- 3. Public trust badges ----------------------------------------------------------------------------------
create or replace function public.public_trust(code text)
returns table (email_verified boolean, school_domain text, linkedin boolean)
language sql stable security definer set search_path = ''
as $$
  select
    (u.email is not null and u.email_confirmed_at is not null and not coalesce(u.is_anonymous, false)),
    case when u.email_confirmed_at is not null
          and lower(split_part(u.email, '@', 2)) ~ '(\.edu|\.edu\.[a-z]{2}|\.ac\.[a-z]{2})$'
         then lower(split_part(u.email, '@', 2)) else '' end,
    exists (select 1 from auth.identities x where x.user_id = u.id and x.provider in ('linkedin_oidc', 'linkedin'))
  from public.sports_profiles p
  join auth.users u on u.id = p.user_id
  where p.is_public and p.public_code = code;
$$;
revoke all on function public.public_trust(text) from public;
grant execute on function public.public_trust(text) to anon, authenticated;

-- 4. Reports ----------------------------------------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in ('profile', 'role', 'story')),
  target      text not null check (char_length(target) between 1 and 80),
  reason      text not null check (reason in ('fake', 'scam', 'not_theirs', 'other')),
  details     text not null default '' check (char_length(details) <= 500),
  reporter_id uuid default auth.uid(),
  status      text not null default 'open' check (status in ('open', 'reviewed')),
  created_at  timestamptz not null default now()
);
create index if not exists reports_open on public.reports (status, created_at desc);
alter table public.reports enable row level security;
drop policy if exists "Anyone can report" on public.reports;
create policy "Anyone can report" on public.reports for insert to anon, authenticated with check (status = 'open');
-- No read policy: reports are private. Review them in Table Editor -> reports.

-- 5. Employer roles: the domain of the poster's email --------------------------------------------------------
alter table public.employer_roles add column if not exists email_domain text not null default '' check (char_length(email_domain) <= 120);
drop function if exists public.approved_roles();
create function public.approved_roles()
returns table (id uuid, company text, role_title text, posting_url text, source text, country text, created_at timestamptz, email_domain text)
language sql stable security definer set search_path = ''
as $$
  select r.id, r.company, r.role_title, r.posting_url, r.source, r.country, r.created_at, r.email_domain
  from public.employer_roles r
  where r.status = 'approved'
  order by r.created_at desc
  limit 50;
$$;
revoke all on function public.approved_roles() from public;
grant execute on function public.approved_roles() to anon, authenticated;
