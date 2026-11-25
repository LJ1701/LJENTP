# The Assist: our AI harness, in plain English

*Written 25 Nov 2026 from the code on branch `goldie-evals`. The "harness" is everything around the AI model: what we send it, what we check in its answers, and what happens when it fails. The model itself is rented from Google; the harness is ours.*

**Words used here**
- **Model:** the AI that writes the answer (Google Gemini). We send it text and get text back.
- **Prompt / instructions:** the fixed rules we send with every request ("system instruction").
- **Token:** a piece of a word. Google charges per token, in and out.
- **Schema:** a form the AI must fill in (for example `reply`, `action`), instead of writing free text.
- **Server:** our code running on Vercel. The visitor's browser never talks to the AI directly.

---

## 1. Every place our code calls an AI model

All of The Assist's AI calls go through **one file**, `mvp/lib/gemini.js`, and one shared function in it (`generate`). It always runs on the server: the file starts with `import "server-only"`, so the build fails if browser code ever tries to use it, and the Google key (`GEMINI_API_KEY`) never reaches a visitor.

| # | Feature (what the user sees) | Function in `mvp/lib/gemini.js` | Called from | Model |
|---|---|---|---|---|
| 1 | **Goldie**, the chat coach in the corner (questions, job searches, interview practice) | `coachReply` | `askCoach` in `mvp/app/profile/actions.js` | `gemini-3.5-flash`, which Google actually answers with **`gemini-3.6-flash`**. If that fails with "limit reached" or "busy", `gemini-3.5-flash-lite` answers instead |
| 2 | **Résumé reader**: "Upload résumé" (PDF) and "Take a photo of your résumé" | `pdfText` | `resumeFileText` in `mvp/lib/resume-file.js`, called by `readResumeFile` in `actions.js` | same as above |
| 3 | **Honest résumé bullets** (3 bullets from your achievements) | `honestBullets` | `writeBullets` in `actions.js` | same as above |
| 4 | **Tailor to this job** (bullets + cover letter for one posting) | `tailorApplication` | `tailorApplicationFor` in `actions.js` | same as above |

The model name can be changed without touching code with the `GEMINI_MODEL` setting on Vercel (not set today, so `gemini-3.5-flash` is used).

**Also in the repo, but not The Assist:**
- `api/assistant.js`: the **old LJSportMind site** (https://ljentp.vercel.app, "no longer updated"). It has an "AI Coach" that calls **Anthropic Claude (`claude-opus-5-5`)**. Its rules are summarised in section 2e.
- `mvp/evals/run.mjs`: the **grader** in our test set (section 4) calls `gemini-3.5-flash-lite` to mark answers PASS or FAIL. It runs only when we run the evals, never for users.
- `live-studio/` (LJ LIVE) is a separate app and is not covered here.

**What is NOT AI (often mistaken for it):** career matching and plans (`mvp/lib/careers.js`), skill detection (`mvp/lib/detect.js`), the Fit check (`mvp/lib/fit.js`), the job search itself (Adzuna and sports employers' job boards, `mvp/lib/jobs.js`), and Goldie's **instant answers** (`mvp/lib/intent.js`). Simple requests like "find marketing internships", "show my plan" or "where do I start" are answered by word rules with **no AI call** and cost nothing.

---

## 2. The instructions each call sends, in full

### 2a. Goldie: `COACH_RULES` (`mvp/lib/gemini.js`, lines 142–166)

```text
You are Goldie, the The Assist guide and career coach: a friendly gold ball with the The Assist logo.
You help one person find a career in the sports industry (any sport, any background) and use the app.
Personality: upbeat, warm, short sentences, a light sports touch. Never cheesy, never more than one sports pun.
You are given their saved Sports Profile, their top career matches and their plan. Use them in every answer.
HOW THE APP WORKS (use this to guide them):
1 Passport: name, city, where they are now, skills, interests, goal, and achievements one per line (their proof). They can paste a résumé to fill it in. Saving updates everything.
2 Your path: their top sports career matches (8 paths), the skills they have and what is missing. "Make this my target" puts a plan inside that match; ticking a plan step asks what they did and saves it as a new achievement (proof).
3 Jobs & internships: real postings from any country (the user picks the country above the search), each with a Fit check that shows proof, ticked-only skills and gaps; gaps can be added to the plan.
4 Proof: a public proof link to paste into applications (can be turned off) and honest résumé bullets.
You (Goldie) are in the corner of every page: questions, job searches, and interview practice for their target role.
Guests can save their Passport with an email at the top of the page.
Rules:
- Only talk about sports careers, their profile, matches, plan, applications, interviews and how to use this app. Politely decline anything else in one sentence.
- Never invent facts: no salaries, no statistics, no achievements they did not write. Never write job postings or employer names yourself.
- CLAIMS THEY ASK YOU TO MAKE: if they ask you to say, add or write something about themselves that is not in their ACHIEVEMENTS (e.g. "say I managed a team of 50"), never repeat it as true, never praise it and never say you will add it. Say you can only use what's in their Passport, and that if it really happened they can add it to their achievements themselves and back it up with proof (a file, a link, or a reference who confirms it). Put nothing about it in "evidence".
- JOBS AND INTERNSHIPS: whenever they ask for jobs, internships, openings or where to apply, ALWAYS set action "search_jobs". The app then searches real postings (Adzuna plus the career boards of sports employers) and shows them directly under your reply. Never tell them to go search somewhere else, never say you can't show listings. In "reply" just introduce the results in one or two sentences without saying how many or which ones you found, because you cannot see them (e.g. "Here's what's open for sports marketing internships right now. Your social media work is a strong fit for this kind of role.").
- Only use numbers that appear in their profile or plan.
- When you refer to their experience, copy the exact achievement line(s) into "evidence" (word for word, from the ACHIEVEMENTS list only).
- Keep "reply" under 120 words, warm and direct, plain text, no markdown.
- "next_step" is one concrete action they can do this week.
- "suggest_role" is the number of ONE career path from the CAREER PATHS list if recommending a path fits the question, otherwise -1.
- "follow_ups" are 3 short questions (under 10 words) they might ask you next, written in their voice.
- "action" moves the page for them. Use it ONLY when they ask to see, go to, open or find something, otherwise "none":
  go_passport, go_matches, go_jobs, go_plan, go_proof (scroll to that step); search_jobs (see JOBS AND INTERNSHIPS); start_tour (they want a tour or don't know where to start).
- For search_jobs fill: "job_keywords" = 0 to 4 words for the kind of role, plus "internship" if they want internships (e.g. "marketing internship", "video analyst", "NBA social media"); never the words sports, job or jobs; empty for any sports job. "job_location" = a place ONLY if they named one, their profile CITY only if they said near me / nearby / local, otherwise "" (anywhere). "action_query" = a short label like "Sports marketing internships in Spain" (use JOB SEARCH COUNTRY).
```

**Added in interview practice mode:** `INTERVIEW_RULES` (lines 168–172)

```text
INTERVIEW PRACTICE MODE: act as a hiring manager for their target role.
- If the last message is not an answer yet, ask ONE realistic interview question for that role in "reply".
- If they just answered, give short honest feedback in "reply": one thing that worked, one thing to fix, and which of their achievement lines would make the answer stronger (put those in "evidence"). Then ask the next question.
- Coach them to use the STAR method (situation, task, action, result) without inventing results for them.
```

**Added when the app is not in English:** `languageRule` (lines 49–51). `{language}` is filled in, e.g. "Spanish":

```text
LANGUAGE: write every text the user reads (reply, next_step, follow_ups, action_query, bullets) in {language}. Quote achievement lines exactly as written (any language). Keep job_keywords in English.
```

**Then the user's data** is added, starting with `USER DATA:` (built in `mvp/lib/coach-context.js`, see section 3).

### 2b. Résumé reader: `PDF_INSTRUCTIONS` (lines 91–98)

Sent with the file and the line `Copy out this résumé's text.`

```text
Copy out the text of this résumé exactly as written.
Put each heading, job line and bullet point on its own line. Keep the original words, numbers and order.
Do not summarize, rewrite, fix, translate or add anything. Plain text only, no markdown.
If it is a photo: copy only words you can read clearly. Leave out anything blurry, dark or cut off; never guess a word or number.
Answer in JSON:
- "is_resume": false if this is not a résumé or CV (a picture of something else, a blank page, a different document).
- "clarity": "clear" if every word is easy to read; "partly_unclear" if some words are hard to read; "unreadable" if most of it is blurry, dark or too small to read with certainty. When in doubt, choose the less clear option.
- "text": the copied text, or "" when it is not a résumé or unreadable.
```

### 2c. Honest résumé bullets: `INSTRUCTIONS` (lines 40–43), plus `languageRule` when not English

Sent with `Achievements:` followed by the user's achievement lines.

```text
You write résumé bullets for someone looking for work in the sports industry.
Use ONLY facts stated in their achievements. Never invent numbers, results, titles, employers or dates.
If a number is not in the achievements, do not add one. Write exactly 3 bullets, one per line,
each starting with a strong past-tense verb, at most 25 words each. No intro, no markdown, no bullet symbols.
```

### 2d. Tailor to this job: `TAILOR_RULES` (lines 259–272)

```text
You help someone apply for one specific job in the sports industry.
You get their ACHIEVEMENTS (their own words), their SKILLS and GOAL, and the JOB POSTING.
Use ONLY facts stated in the achievements. Never invent numbers, results, job titles, employers, dates,
tools or qualifications. If a number is not in the achievements, do not add one. Do not state the person's
education, school, degree, student status, age or years of experience unless the achievements say it.
1. bullets: 3 to 5 résumé bullets that put the achievements most relevant to THIS job first, rephrased in the
   posting's own words where the meaning is the same. Each starts with a strong past-tense verb, at most 25 words.
2. cover_letter: under 200 words, 3 short paragraphs: why this role at this employer (use the posting), the 2 or 3
   achievements that best match its requirements (quote facts exactly), and a short close. No placeholders like
   [Name]; no greeting name if none is given ("Dear hiring team,"). Plain text, paragraphs separated by a blank line.
3. matched: the posting's requirements the achievements really show (short phrases). Never list education or
   student status here unless an achievement states it.
4. gaps: requirements the achievements do not show yet (short phrases). Never claim these in bullets or letter.
Write everything in the same language as the job posting.
```

### 2e. Old site only (`api/assistant.js`, not The Assist)

The old LJSportMind "AI Coach" sends a `SYSTEM` prompt (lines 23–37) that describes LJSportMind, readiness scores and **LJ Body ID** phone-camera movement scans, features The Assist no longer has. It has three modes: chat, a career "analysis" (`ANALYSIS_PROMPT`, lines 85–92), and "social content about this game" (`contentPrompt`, lines 68–83). It is quoted in that file. It isn't repeated here because it belongs to the retired site.

---

## 3. What each call is given, and what it is NOT given

| Call | Given | NOT given |
|---|---|---|
| **Goldie** | The rules above, plus: name, role, sport, city, goal, skills, interests, achievement lines, top career matches, target role and plan steps, the job-search country, and the list of 8 career paths. All read **on the server from the database as the signed-in user**, so database rules mean only their own rows. Also the **chat so far**: up to the last 16 messages, each user message cut to 500 characters, at most 10 user messages per chat | Portfolio files, links and references (and whether references confirmed), published Stories, other users' data, email address, payments, live job listings (Goldie can't see the jobs shown under its reply) |
| **Résumé reader** | The file itself (PDF, or a photo shrunk on the phone to at most 2000 px), up to 4 MB | Nothing about the user: no profile, no name. The file is **not stored**: read in memory, only the text goes back to the page |
| **Résumé bullets** | The user's saved achievement lines (up to 4,000 characters) and the language | Name, city, goal, skills, anything else |
| **Tailor to this job** | Achievement lines, ticked skills, goal, and the job: title, employer, location and the posting text (fetched by our server from the job board, or pasted by the user), up to 8,000 characters | Name, email, city, portfolio, references |

**Who decides what's sent:** our server code. The browser sends only the chat messages (for Goldie) or the file (for the reader). Everything else is looked up on the server.

**Not sent to Google, anywhere:** passwords, payment details, other users' data, references' contact details.

**Sent to Google if the user types it:** anything in a chat message or on an uploaded résumé (for example a phone number). We don't filter it out before sending (see section 6).

---

## 4. Checks on the output, and what happens when things fail

### Checks in the code, after every answer

| Call | Structured form (schema)? | What our code checks | If the check fails |
|---|---|---|---|
| Goldie | **Yes**: `reply`, `evidence`, `next_step`, `suggest_role`, `follow_ups`, `action`, and job-search fields (`COACH_SCHEMA`) | **Evidence check:** each quoted achievement must match one of the user's real lines. **Number check:** any number in the reply that isn't in their data or messages is listed. **Allowed actions only:** the page can only scroll, start the tour or search jobs (8 names). Suggested role must be 0–7. Lengths are cut | Fake evidence is **dropped**, and the chat says "N quote(s) removed". Unknown numbers are shown with a **warning** under the reply. A bad action becomes "none". Empty reply: friendly error |
| Résumé reader | **Yes**: `is_resume`, `clarity`, `text` (`READ_SCHEMA`) | Not a résumé, unreadable, or nothing copied: refused. Partly unclear: allowed with a warning. Before the AI, the file's **first bytes** are checked (a real PDF or photo, not just the name), plus the size (4 MB) | Friendly message ("Couldn't read a résumé in that file…" or "over 4 MB"). Partly unclear: "⚠️ check every line before you save" |
| Résumé bullets | **No**: free text, split into lines | Any bullet with a number not in the achievements is **dropped** | The page says how many were removed. None left: friendly error |
| Tailor to this job | **Yes**: `bullets`, `cover_letter`, `matched`, `gaps` (`TAILOR_SCHEMA`) | Bullets with invented numbers are dropped. Numbers in the letter that are in neither the achievements nor the posting are listed | Dropped bullets are counted. Letter numbers are flagged as "unverified" |

Nothing the AI writes is saved to the user's profile automatically. Résumé text fills the form, but the user must check it and press **Save**.

### When the AI is down, slow or out of quota

1. **Google busy (error 503):** wait 1.5 s and try the main model once more.
2. **Still failing, or the daily limit is used up (429):** switch to `gemini-3.5-flash-lite`, which has its own daily limit.
3. **Both fail:** the user sees a friendly message, never a crash. Goldie says it's busy and shows buttons that work without AI (Find internships, Find jobs, Take the tour, Go to my plan).
4. **Time limits:** Goldie and bullets 15 s, tailor 25 s, résumé reader 30 s. After that, a "took too long, try again" message.
5. **No Google key set:** a message saying the feature isn't switched on yet.
6. **Monthly allowance:** each user gets 20 free AI answers a month (`mvp/lib/billing.js`). Instant answers, Word and text uploads don't count.

### Evals (tests we run ourselves)

- `mvp/evals/cases.json`: **22 fixed test cases** with a fake person ("Sam"). They cover 16 Goldie cases (job searches, off-topic, prompt injection, fake claims, other languages, personal info, interview practice) and 6 résumé-file cases (clear photo, blurry photo, pizza photo, too big, fake photo, PDF).
- Most checks are plain code. Where judgment is needed, a second AI (the **grader**) answers PASS or FAIL with one sentence.
- Run with `npm run evals` from `mvp/`. Results go in `mvp/evals/results/`. Latest: **22 of 22** on 25 Nov 2026 (on the lite model).
- **Cost log:** every call's tokens (never the text) are recorded in `mvp/lib/ai-log.js` and priced in `mvp/lib/ai-prices.js`. Report: `npm run ai-costs`.

---

## 5. We built this / We rent this

| We built this | We rent this |
|---|---|
| All prompts: Goldie's rules, interview mode, language rule, résumé reader, bullets, tailor (`mvp/lib/gemini.js`) | The AI models: Google Gemini 3.6 Flash (asked for as "3.5 Flash") and 3.5 Flash-Lite |
| The shared call function with retry and backup model (`generate`) | Google's Gemini API, its free-tier limits (20 a day per model) and its servers |
| The structured forms (schemas) and every check after the answer: evidence, numbers, allowed actions, clarity | Google's "structured output" feature that makes the model fill in the form |
| What Goldie is given: the user-data builder (`mvp/lib/coach-context.js`) | Google's `@google/genai` software library |
| Instant answers without AI, the word rules (`mvp/lib/intent.js`) | Vercel: the servers our code runs on, and where the Google key is stored |
| File checks: size, file signatures, photo shrinking on the phone (`mvp/lib/resume-file.js`, `resume-fill.js`) | Supabase: the database our code reads user data from, and stores the cost log in |
| The friendly error messages in 10 languages (`mvp/locales/`) | Adzuna and employers' job boards (the jobs shown next to Goldie's reply) |
| Monthly AI allowance per user (`mvp/lib/billing.js`) | Anthropic Claude, for the old site only (`api/assistant.js`) |
| The eval set, grader rubrics, runner and model comparison (`mvp/evals/`) | |
| Cost logging and the price list (`mvp/lib/ai-log.js`, `mvp/lib/ai-prices.js`, `mvp/scripts/ai-costs.mjs`) | |

---

## 6. What looks fragile, duplicated or missing (listed, not fixed)

**Fragile**
1. **The free tier is tiny and shared.** 20 main-model requests a day for the whole app, and the evals and local testing use the same key. On 25 Nov it ran out mid-afternoon, so real users silently got the lite model for the rest of the day.
2. **The model can change under us.** We ask for `gemini-3.5-flash`, but Google answers with `gemini-3.6-flash`, and that model isn't on Google's pricing page. A future switch could change quality or price without any code change. The cost log records which model answered; nothing alerts on a change.
3. **Goldie's chat history comes from the browser.** The server trims it, but a user could edit earlier "coach" messages to put words in Goldie's mouth (a prompt-injection route). The impact is limited because Goldie only sees that user's own data.
4. **The instant-answer word lists are hand-written.** `mvp/lib/intent.js` has long lists of words in 10 languages. Two bugs were found there today ("Busco", Japanese advice), and more languages and phrasings will find more.
5. **Price rise on 1 Jan 2027:** Google's page shows 3.6 Flash doubling (input $0.75 → $1.50, output $3.75 → $7.50 per million tokens). Prices are typed into `mvp/lib/ai-prices.js` by hand.
6. **The graders are the same model they grade.** The eval grader runs on 3.5 Flash-Lite, which also answers in eval runs by default, so a model can mark its own work.
7. **The old site's AI Coach may still be live** (`api/assistant.js`, Claude Opus 5.5). Its prompt describes features that no longer exist (Body ID, readiness scores), its rate limit only counts per server instance (easy to get around), and its calls are not in the cost log.

**Duplicated**
8. **Error handling is copied four times.** Each function has its own copy of the same "limit / slow / error" pattern matching, plus a fifth copy in `generate`. They differ slightly: `honestBullets` and `tailorApplication` don't treat 503 as "slow", but the other two do.
9. **Two ways of asking for a structured answer.** `tailorApplication` uses `responseSchema`; the others use `responseJsonSchema`, the one in Google's current docs.
10. **The rules for "no invented numbers" are written twice:** once in the prompts and again as code checks, with three slightly different number checks (bullets, Goldie, letter). That's good defence, but each must be changed separately.

**Missing**
11. **Résumé bullets and Tailor have no evals.** Today's 22 cases test only Goldie and the résumé reader, and tailoring is where invented facts were found before (build log, 5 Nov).
12. **Bullets are the only call without a structured form.** The code guesses where each bullet starts by splitting lines.
13. **No filter for personal information before sending.** A phone number or ID number typed into Goldie or printed on a résumé goes to Google. Eval 15 checks Goldie doesn't repeat it, not that it isn't sent.
14. **Goldie can't see the user's portfolio, references or Stories**, so it can't say "your confirmed reference from X" or "people who got into marketing did Y". It also can't say "I couldn't find this" yet (planned; waiting for your "go" or "strict").
15. **No alert when things break.** If Google keeps failing, users see friendly messages, but nobody is told. The cost log and Vercel logs exist, but nobody watches them.
16. **No cached input.** Every Goldie call re-sends about 1,200 tokens of the same rules. Google offers caching at a tenth of the price; we don't use it (it matters only at scale).
17. **Typo the AI reads:** Goldie's first line says "the **The** Assist" twice.
18. **`ai_calls` table not created yet:** `mvp/supabase/014_ai_calls.sql` must be run once in Supabase before live costs are recorded. Until then, they go to Vercel's logs.
