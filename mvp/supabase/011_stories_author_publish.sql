-- The Assist, part 11: authors publish their own stories (no owner approval needed).
-- An author can save a story as a draft ('pending', only they see it) or publish it ('approved', everyone sees it).
-- The owner can still hide a story by setting status to 'rejected' in Supabase; the author can't undo that.
-- Run once in Supabase: SQL Editor -> New query -> paste all of this -> Run. Safe to run again.

drop policy if exists "Authors add their story" on public.stories;
create policy "Authors add their story" on public.stories for insert to authenticated
  with check (user_id = auth.uid() and status in ('pending', 'approved') and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "Authors edit their story" on public.stories;
create policy "Authors edit their story" on public.stories for update to authenticated
  using (user_id = auth.uid() and status <> 'rejected')
  with check (user_id = auth.uid() and status in ('pending', 'approved'));
