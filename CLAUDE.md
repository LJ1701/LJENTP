# LJSportMind

Sports career discovery with proof: a Sports Profile, career matches, a development plan, and LJ Coach Certification (graded levels with a credential ID). "Advice is everywhere. Proof isn't." Free for athletes; schools and clubs are the intended buyers.

## Apps in this repo

| Folder | What | Live URL | How it deploys |
|---|---|---|---|
| repo root | Current live LJSportMind (plain HTML/CSS/JS + `api/` functions) | https://ljentp.vercel.app | Vercel, from GitHub `main` |
| `mvp/` | Walking-skeleton MVP rebuild: sign in → profile → match → certification → verify link | https://ljsportmind-mvp.vercel.app | `vercel --prod` from `mvp/` |
| `live-studio/` | LJ LIVE, a separate app (live scores → posts) | https://lj-live.vercel.app | `vercel --prod` from `live-studio/` (not Git-connected) |

## Stack

- **Next.js 15** (App Router, JavaScript) for `mvp/`.
- **Vercel** hosting for all three apps.
- **Vercel Web Analytics** (`@vercel/analytics`), added in `mvp/app/layout.js`: counts page views (page, referrer, country, browser/device type) without cookies.

## Guardrails

- **Hook** `.claude/hooks/block-env-commit.js` (registered in `.claude/settings.json`) blocks any commit that includes `.env` / `.env.local`, and any forced `git add` of one. Tested 21 Oct 2026.
- **Skills:** `demo-check` (pre-demo checklist), `update-research` (after interviews), `interview-practice` (role-play).

## How to explain changes

- Plain English. I'm a beginner: no jargon without a one-line explanation.
- Step by step, click by click, when I have to do something (terminal, Supabase, Vercel, GitHub).
- Be direct and brutally honest: say plainly if something isn't needed, doesn't work, or isn't verified.
- After each change: what changed, which file, and exactly what I should test, with the live link.
- Plan first and wait for my approval before big changes.

## Working rules

- Stay inside this project folder.
- Never delete files or install tools without asking first.
- Keep `research/`, `strategy/`, `prd.md`, `build-log.md` and `pricing simulator/` private: out of git and deploys.
- Never put secret keys in code or chat; the owner adds them with `vercel env add`.
- Don't fabricate data: scores and match facts come from real sources.
