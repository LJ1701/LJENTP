-- 014: cost log for every Gemini call (written by mvp/lib/ai-log.js). Run once in Supabase > SQL Editor.
-- One row per AI call: when, which feature, which model, and token counts. No user id and no text from users.
-- Row level security is on with NO policies, so only the server's service-role key can write or read it;
-- visitors and signed-in users can't see it. Read it in Supabase > Table Editor > ai_calls, or with
-- `npm run ai-costs` (see CLAUDE.md > AI costs).

create table if not exists public.ai_calls (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  feature         text not null check (char_length(feature) <= 40),   -- coach, resume_read, resume_bullets, tailor_application
  model           text not null check (char_length(model) <= 80),     -- the model the app asked for
  model_version   text not null check (char_length(model_version) <= 80), -- the model that actually answered
  input_tokens    int not null default 0 check (input_tokens >= 0),
  output_tokens   int not null default 0 check (output_tokens >= 0),
  thinking_tokens int not null default 0 check (thinking_tokens >= 0),
  cached_tokens   int not null default 0 check (cached_tokens >= 0),
  total_tokens    int not null default 0 check (total_tokens >= 0)
);

create index if not exists ai_calls_created on public.ai_calls (created_at desc);

alter table public.ai_calls enable row level security;
-- Intentionally no policies: only the service-role key (server code) can use this table.
revoke all on public.ai_calls from anon, authenticated;
