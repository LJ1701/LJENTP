-- LJSportMind MVP, part 6: proof the user attaches to an achievement. No sign-off from anyone:
-- the user adds a link, a reference, a number or where it happened, and the public page labels it
-- "added by" the user, never "verified".
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.

create table if not exists public.proof_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  achievement  text not null check (char_length(achievement) between 1 and 200),
  kind         text not null check (kind in ('link', 'reference', 'number', 'where')),
  -- link: url + optional title. reference: name, role, org, relation, optional contact.
  -- number: the stat. where: team, club, school, event or company.
  url          text not null default '' check (char_length(url) <= 300 and (url = '' or url ~* '^https?://')),
  title        text not null default '' check (char_length(title) <= 120),
  ref_name     text not null default '' check (char_length(ref_name) <= 100),
  ref_role     text not null default '' check (char_length(ref_role) <= 100),
  ref_org      text not null default '' check (char_length(ref_org) <= 100),
  ref_relation text not null default '' check (char_length(ref_relation) <= 100),
  ref_contact  text not null default '' check (char_length(ref_contact) <= 120),
  show_contact boolean not null default false,
  stat         text not null default '' check (char_length(stat) <= 120),
  place        text not null default '' check (char_length(place) <= 120),
  created_at   timestamptz not null default now()
);

create index if not exists proof_items_user on public.proof_items (user_id);

-- Each signed-in user can read, add and remove only their own proof.
alter table public.proof_items enable row level security;
drop policy if exists "Read own proof" on public.proof_items;
drop policy if exists "Add own proof" on public.proof_items;
drop policy if exists "Delete own proof" on public.proof_items;
create policy "Read own proof" on public.proof_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "Add own proof" on public.proof_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own proof" on public.proof_items for delete to authenticated using ((select auth.uid()) = user_id);

-- Public page: the proof for ONE profile, only while its owner has the link switched on.
-- A reference's contact details are returned only if the owner chose to show them.
create or replace function public.public_proof_items(code text)
returns table (
  achievement text, kind text, url text, title text, ref_name text, ref_role text, ref_org text,
  ref_relation text, ref_contact text, stat text, place text
)
language sql stable security definer set search_path = ''
as $$
  select i.achievement, i.kind, i.url, i.title, i.ref_name, i.ref_role, i.ref_org, i.ref_relation,
         case when i.show_contact then i.ref_contact else '' end, i.stat, i.place
  from public.proof_items i
  join public.sports_profiles p on p.user_id = i.user_id
  where p.is_public and p.public_code = code
  order by i.created_at;
$$;

revoke all on function public.public_proof_items(text) from public;
grant execute on function public.public_proof_items(text) to anon, authenticated;
