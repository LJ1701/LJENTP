# The Assist (formerly LJSportMind)

*Renamed 17 Nov 2026. Tagline: "Every career starts with an assist." Official web address since 18 Nov 2026: https://theassist.vercel.app. The old address (ljsportmind-mvp.vercel.app) still works, so links already shared keep working, and the Vercel project is still named ljsportmind-mvp.*

Proof for anyone breaking into sports: a Passport with a portfolio (files, links, references who confirm with one click) and one public link employers can trust, plus career matches and live jobs. "Show what you've done. See how others got in." Two paying sides (since 18 Nov 2026): users (Pro and paid feedback; proof itself stays free) and employers (including schools and clubs). Expanding into international jobs: candidates list countries where their right to work is already sorted (no legal or visa help). Full spec: `prd.md`.

## Apps in this repo

| Folder | What | Live URL | How it deploys |
|---|---|---|---|
| repo root | Old LJSportMind site (no longer updated) (plain HTML/CSS/JS + `api/` functions) | https://ljentp.vercel.app | Vercel, from GitHub `main` |
| `mvp/` | The Assist, the current app: Passport, portfolio, confirmed references, public proof link, jobs | https://theassist.vercel.app (old: ljsportmind-mvp.vercel.app, still works) | Vercel, from GitHub `main` (project `ljsportmind-mvp`, root directory `mvp/`, own `mvp/.vercelignore`) |
| `live-studio/` | LJ LIVE, a separate app (live scores → posts) | https://lj-live.vercel.app | `vercel --prod` from `live-studio/` (not Git-connected) |

## Stack

- **Next.js 15** (App Router, JavaScript) for `mvp/`.
- **Vercel** hosting for all three apps.
- **Vercel Web Analytics** (`@vercel/analytics`), added in `mvp/app/layout.js`: counts page views (page, referrer, country, browser/device type) without cookies.

## Guardrails

- **Hook** `.claude/hooks/block-env-commit.js` (registered in `.claude/settings.json`) blocks any commit that includes `.env` / `.env.local`, and any forced `git add` of one. Tested 21 Oct 2026.
- **Skills:** `demo-check` (pre-demo checklist), `update-research` (after interviews), `interview-practice` (role-play).

## Evals (testing Goldie, the AI coach)

A fixed set of test questions for Goldie, each with pass/fail checks. Run it after any change to Goldie, its rules or `mvp/lib/gemini.js`.

- **Cases:** `mvp/evals/cases.json` (a fake test profile, "Sam"; never real people's data). Each case has an `id`, an `input` and `checks`: code checks (action, keywords, location, banned text, no invented numbers) and, where judgment is needed, a `grader` (a second AI call with a short rubric that answers PASS or FAIL plus one sentence).
- **Run all** (from `mvp/`, needs `GEMINI_API_KEY` in `mvp/.env.local`):

  ```bash
  npm run evals
  ```

- **Run some:** `npm run evals -- 08-fake-claim,13-spanish` (saved as `<date>-partial.md`, so it never overwrites the full report).
- **Results:** `mvp/evals/results/<date>.md`: a table (case, pass/fail, reason), the pass rate, and what Goldie said.
- **Quota:** runs on the lighter model (`gemini-3.5-flash-lite`) so the main model's free daily quota stays for real users. A full run (22 cases, incl. résumé files in `mvp/evals/files/`) is about 30 AI calls, ~4 minutes. Test the main model with `EVAL_MODEL=gemini-3.5-flash npm run evals`. "SKIPPED" means Google's limit or a busy server, not counted in the pass rate.
- **Add a case** whenever Goldie gets something wrong in a demo or user test: paste the user's exact message and write what a good answer is.

## AI costs

Every Gemini call is logged (`mvp/lib/ai-log.js`): time, feature (coach, resume_read, resume_bullets, tailor_application), model asked for, model that answered, and input/output/thinking/cached tokens. **Never the user's text.**

- **Live app:** rows go to the `ai_calls` table (run `mvp/supabase/014_ai_calls.sql` once). Only the server's service key can read or write it.
- **Report:** from `mvp/`, run `npm run ai-costs` (needs `SUPABASE_SERVICE_ROLE_KEY` in `mvp/.env.local`), or `npm run ai-costs -- --file evals/results/<date>-<model>-calls.jsonl` for an eval run. Add `--days 7` for the last week.
- **Prices:** `mvp/lib/ai-prices.js` (from Google's pricing page, dated). "gemini-3.5-flash" is answered by gemini-3.6-flash, so that price applies. Update the file when Google's prices change.
- **Compare models:** `EVAL_MODEL=gemini-3.5-flash-lite npm run evals`, then `EVAL_MODEL=gemini-3.5-flash npm run evals`, then `npm run evals-compare`. The free tier allows only ~20 main-model calls a day and the live app shares that key, so run the main-model side early in the day.

## How to explain changes

- Plain English. I'm a beginner: no jargon without a one-line explanation.
- Step by step, click by click, when I have to do something (terminal, Supabase, Vercel, GitHub).
- Be direct and brutally honest: say plainly if something isn't needed, doesn't work, or isn't verified.
- After each change: what changed, which file, and exactly what I should test, with the live link.
- Plan first and wait for my approval before big changes.

## Working rules

- Stay inside this project folder.
- Never delete files or install tools without asking first.
- Keep `research/`, `strategy/`, `interviews/`, `build-log.md`, `build-logs/` and `pricing simulator/` private: out of git and deploys.
- `prd.md` is in git (so graders can read it) but stays off the live site (`.vercelignore`). Keep it current when the product changes.
- Never put secret keys in code or chat; the owner adds them with `vercel env add`.
- Don't fabricate data: scores and match facts come from real sources.
