-- LJSportMind MVP, part 6: a portfolio the user builds themselves. No sign-off from anyone:
-- they upload a file (PDF, image or short video), add a link, or name a reference who saw their work.
-- The public proof page labels it "added by" the user, never "verified".
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.

create table if not exists public.portfolio_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('file', 'link', 'reference')),
  title        text not null default '' check (char_length(title) <= 120),
  description  text not null default '' check (char_length(description) <= 200),
  achievement  text not null default '' check (char_length(achievement) <= 200), -- the line it shows, or ''
  url          text not null default '' check (char_length(url) <= 300 and (url = '' or url ~* '^https?://')),
  file_path    text not null default '' check (char_length(file_path) <= 300),
  file_name    text not null default '' check (char_length(file_name) <= 160),
  file_type    text not null default '' check (char_length(file_type) <= 80),
  file_size    int  not null default 0 check (file_size between 0 and 10485760),
  ref_name     text not null default '' check (char_length(ref_name) <= 100),
  ref_role     text not null default '' check (char_length(ref_role) <= 100),
  ref_org      text not null default '' check (char_length(ref_org) <= 100),
  ref_relation text not null default '' check (char_length(ref_relation) <= 100),
  ref_contact  text not null default '' check (char_length(ref_contact) <= 120),
  show_contact boolean not null default false,
  created_at   timestamptz not null default now(),
  -- A file must live in the owner's own folder.
  check (file_path = '' or file_path like (user_id::text || '/%'))
);
create index if not exists portfolio_items_user on public.portfolio_items (user_id);

alter table public.portfolio_items enable row level security;
drop policy if exists "Read own portfolio" on public.portfolio_items;
drop policy if exists "Add own portfolio" on public.portfolio_items;
drop policy if exists "Delete own portfolio" on public.portfolio_items;
create policy "Read own portfolio" on public.portfolio_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "Add own portfolio" on public.portfolio_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own portfolio" on public.portfolio_items for delete to authenticated using ((select auth.uid()) = user_id);

-- Public page: the portfolio for ONE profile, only while its owner has the link switched on.
-- A reference's contact details are returned only if the owner chose to show them.
create or replace function public.public_portfolio(code text)
returns table (
  id uuid, kind text, title text, description text, achievement text, url text, file_path text,
  file_name text, file_type text, ref_name text, ref_role text, ref_org text, ref_relation text, ref_contact text
)
language sql stable security definer set search_path = ''
as $$
  select i.id, i.kind, i.title, i.description, i.achievement, i.url, i.file_path, i.file_name, i.file_type,
         i.ref_name, i.ref_role, i.ref_org, i.ref_relation,
         case when i.show_contact then i.ref_contact else '' end
  from public.portfolio_items i
  join public.sports_profiles p on p.user_id = i.user_id
  where p.is_public and p.public_code = code
  order by i.created_at;
$$;
revoke all on function public.public_portfolio(text) from public;
grant execute on function public.public_portfolio(text) to anon, authenticated;

-- File storage: a private bucket, 10 MB per file, documents, images and short videos only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Each user uploads, reads and deletes only inside their own folder (<their user id>/...).
drop policy if exists "Portfolio: upload own files" on storage.objects;
drop policy if exists "Portfolio: read own files" on storage.objects;
drop policy if exists "Portfolio: delete own files" on storage.objects;
drop policy if exists "Portfolio: read files of public profiles" on storage.objects;
create policy "Portfolio: upload own files" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Portfolio: read own files" on storage.objects for select to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Portfolio: delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Anyone may open a file only while its owner's public link is switched on (the page makes a
-- short-lived link to it; the bucket itself stays private). Visitors can't read sports_profiles,
-- so this small helper answers just "is this folder's owner public?".
create or replace function public.portfolio_owner_is_public(folder text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.sports_profiles p where p.user_id::text = folder and p.is_public);
$$;
revoke all on function public.portfolio_owner_is_public(text) from public;
grant execute on function public.portfolio_owner_is_public(text) to anon, authenticated;

create policy "Portfolio: read files of public profiles" on storage.objects for select to anon, authenticated
  using (bucket_id = 'portfolio' and public.portfolio_owner_is_public((storage.foldername(name))[1]));
