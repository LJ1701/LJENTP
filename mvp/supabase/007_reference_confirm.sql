-- LJSportMind MVP, part 7: a reference can confirm (or decline) with one click.
-- The user still needs no sign-off: confirming is optional. The user makes a private link for one reference
-- and sends it themselves (email, text, DM). The reference opens it, sees exactly what was claimed, and
-- clicks "Yes, that's right" (with an optional comment) or "That's not right". The public page shows
-- "Confirmed by <name>" only for confirmed references.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.

alter table public.portfolio_items add column if not exists confirm_token text unique;
alter table public.portfolio_items add column if not exists confirm_status text not null default ''
  check (confirm_status in ('', 'confirmed', 'declined'));
alter table public.portfolio_items add column if not exists confirmed_at timestamptz;
alter table public.portfolio_items add column if not exists confirm_note text not null default ''
  check (char_length(confirm_note) <= 300);

-- The owner asks for a link for one of their own references. Returns the same link if one already exists.
create or replace function public.reference_confirm_link(item uuid)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare tok text;
begin
  select i.confirm_token into tok from public.portfolio_items i
  where i.id = item and i.user_id = auth.uid() and i.kind = 'reference';
  if not found then return null; end if;
  if tok is null then
    tok := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    update public.portfolio_items set confirm_token = tok where id = item and user_id = auth.uid();
  end if;
  return tok;
end;
$$;
revoke all on function public.reference_confirm_link(uuid) from public;
grant execute on function public.reference_confirm_link(uuid) to authenticated;

-- What the reference sees when they open the link (no sign-in needed). Only works with the exact token.
create or replace function public.reference_request(token text)
returns table (
  owner_name text, ref_name text, ref_role text, ref_org text, ref_relation text,
  achievement text, description text, confirm_status text, confirmed_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select coalesce(nullif(p.full_name, ''), 'This person'), i.ref_name, i.ref_role, i.ref_org, i.ref_relation,
         i.achievement, i.description, i.confirm_status, i.confirmed_at
  from public.portfolio_items i
  left join public.sports_profiles p on p.user_id = i.user_id
  where i.kind = 'reference' and length(token) = 64 and i.confirm_token = token;
$$;
revoke all on function public.reference_request(text) from public;
grant execute on function public.reference_request(text) to anon, authenticated;

-- The reference answers. One answer only; the owner can't answer their own request while signed in.
create or replace function public.reference_answer(token text, answer text, note text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare it record;
begin
  if answer not in ('confirmed', 'declined') or length(token) <> 64 then return 'bad'; end if;
  select i.id, i.user_id, i.confirm_status into it from public.portfolio_items i
  where i.kind = 'reference' and i.confirm_token = token;
  if not found then return 'missing'; end if;
  if it.user_id = auth.uid() then return 'owner'; end if;
  if it.confirm_status <> '' then return 'done'; end if;
  update public.portfolio_items
     set confirm_status = answer, confirmed_at = now(), confirm_note = left(coalesce(trim(note), ''), 300)
   where id = it.id;
  return 'ok';
end;
$$;
revoke all on function public.reference_answer(text, text, text) from public;
grant execute on function public.reference_answer(text, text, text) to anon, authenticated;

-- The public page now also returns the confirmation (only "confirmed" ones; a decline stays private).
drop function if exists public.public_portfolio(text);
create function public.public_portfolio(code text)
returns table (
  id uuid, kind text, title text, description text, achievement text, url text, file_path text,
  file_name text, file_type text, ref_name text, ref_role text, ref_org text, ref_relation text, ref_contact text,
  confirm_status text, confirmed_at timestamptz, confirm_note text
)
language sql stable security definer set search_path = ''
as $$
  select i.id, i.kind, i.title, i.description, i.achievement, i.url, i.file_path, i.file_name, i.file_type,
         i.ref_name, i.ref_role, i.ref_org, i.ref_relation,
         case when i.show_contact then i.ref_contact else '' end,
         case when i.confirm_status = 'confirmed' then 'confirmed' else '' end,
         case when i.confirm_status = 'confirmed' then i.confirmed_at end,
         case when i.confirm_status = 'confirmed' then i.confirm_note else '' end
  from public.portfolio_items i
  join public.sports_profiles p on p.user_id = i.user_id
  where p.is_public and p.public_code = code
  order by i.created_at;
$$;
revoke all on function public.public_portfolio(text) from public;
grant execute on function public.public_portfolio(text) to anon, authenticated;
