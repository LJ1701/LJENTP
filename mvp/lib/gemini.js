import "server-only";
import { GoogleGenAI } from "@google/genai";

// Turns the user's achievements into three résumé bullets with Google Gemini. Runs only on the server
// (the "server-only" import makes the build fail if browser code ever imports this file), so
// GEMINI_API_KEY never reaches a visitor's browser.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
// Free tier allows only about 20 requests a day per model, counted separately for each model. When the main
// model's daily limit is used up, the lighter model (its own quota) answers instead of showing an error.
const LITE_MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 15000;

// Worth trying the other model: daily limit used up (429) or Google's servers briefly overloaded (503).
const tryOther = (err) => /429|503|quota|exhaust|rate|overload|unavailable/i.test(String((err && (err.status || err.message)) || ""));

async function generate(ai, request, models = [MODEL, LITE_MODEL]) {
  for (let i = 0; i < models.length; i++) {
    try {
      return await ai.models.generateContent({ ...request, model: models[i] });
    } catch (err) {
      if (i === models.length - 1 || !tryOther(err)) throw err;
    }
  }
}

const INSTRUCTIONS = `You write résumé bullets for someone looking for work in the sports industry.
Use ONLY facts stated in their achievements. Never invent numbers, results, titles, employers or dates.
If a number is not in the achievements, do not add one. Write exactly 3 bullets, one per line,
each starting with a strong past-tense verb, at most 25 words each. No intro, no markdown, no bullet symbols.`;

const FALLBACK = {
  noKey: "The AI writer isn't switched on yet (the Gemini key hasn't been added). Your profile and matches work without it.",
  limit: "The AI writer has hit its free daily limit. Try again later; your profile and matches still work.",
  slow: "The AI writer is taking too long right now. Try again in a minute.",
  error: "The AI writer isn't available right now. Try again later; your profile and matches still work.",
  empty: "Add a few achievements to your profile first, one per line, then try again."
};

// Numbers in a bullet must appear in the achievements; anything else was invented, so the bullet is dropped.
function inventsNumbers(bullet, achievements) {
  const source = achievements.replace(/,/g, "");
  return (bullet.replace(/,/g, "").match(/\d+(\.\d+)?/g) || []).some((n) => !source.includes(n));
}

export async function honestBullets(achievements) {
  const text = String(achievements || "").trim();
  if (!text) return { error: FALLBACK.empty };
  if (!process.env.GEMINI_API_KEY) return { error: FALLBACK.noKey };
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await generate(ai, {
      contents: `Achievements:\n${text.slice(0, 4000)}`,
      // Minimal thinking: tested at ~1.5 s with complete answers. Default thinking took 35 s, and its
      // thinking also used up a small output limit, cutting answers off mid-sentence.
      config: { systemInstruction: INSTRUCTIONS, temperature: 0.3, maxOutputTokens: 1500, thinkingConfig: { thinkingLevel: "minimal" }, abortSignal: AbortSignal.timeout(TIMEOUT_MS) }
    });
    const lines = String(res.text || "")
      .split("\n")
      .map((l) => l.replace(/^[\s\-•*\d.)]+/, "").trim())
      .filter(Boolean);
    const kept = lines.filter((l) => !inventsNumbers(l, text)).slice(0, 3);
    if (!kept.length) return { error: FALLBACK.error };
    return { bullets: kept, dropped: lines.length - kept.length };
  } catch (err) {
    const msg = String((err && (err.status || err.message)) || "");
    if (/429|quota|exhaust|rate/i.test(msg)) return { error: FALLBACK.limit };
    if (/abort|timeout/i.test(msg) || (err && err.name === "AbortError")) return { error: FALLBACK.slow };
    console.error("Gemini call failed:", msg.slice(0, 200));
    return { error: FALLBACK.error };
  }
}

// ---------- Résumé PDF reader ----------
// Copies the text out of an uploaded résumé PDF (base64), so the Passport's résumé filler can read it.
// The model only transcribes; the filler then uses the same keyword rules as a pasted résumé.
const PDF_INSTRUCTIONS = `Copy out the text of this résumé exactly as written.
Put each heading, job line and bullet point on its own line. Keep the original words, numbers and order.
Do not summarize, rewrite, fix, translate or add anything. Plain text only, no markdown.
If the file is not a résumé or has no readable text, reply with exactly: NO_TEXT`;

export async function pdfText(base64) {
  if (!process.env.GEMINI_API_KEY) return { error: "noKey" };
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await generate(ai, {
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: "application/pdf", data: base64 } }, { text: "Copy out this résumé's text." }] }],
      config: { systemInstruction: PDF_INSTRUCTIONS, temperature: 0, maxOutputTokens: 6000, thinkingConfig: { thinkingLevel: "minimal" }, abortSignal: AbortSignal.timeout(30000) }
    });
    const text = String(res.text || "").trim();
    if (!text || text === "NO_TEXT") return { error: "unreadable" };
    return { text };
  } catch (err) {
    const msg = String((err && (err.status || err.message)) || "");
    if (/429|quota|exhaust|rate/i.test(msg)) return { error: "limit" };
    if (/abort|timeout|503|overload|unavailable/i.test(msg) || (err && err.name === "AbortError")) return { error: "slow" };
    console.error("PDF read failed:", msg.slice(0, 200));
    return { error: "error" };
  }
}

// ---------- Career Coach chat ----------
// Unlike a general chatbot, the coach is given the user's saved profile, matches and plan (read on the
// server, never from the browser), must quote evidence from their own achievements, and can suggest one
// of the app's career paths, which the page turns into a real "Make this my target role" button.
const COACH_RULES = `You are Goldie, the LJSportMind guide and career coach: a friendly gold ball with the LJSportMind logo.
You help one person find a career in the sports industry (any sport, any background) and use the app.
Personality: upbeat, warm, short sentences, a light sports touch. Never cheesy, never more than one sports pun.
You are given their saved Sports Profile, their top career matches and their plan. Use them in every answer.
HOW THE APP WORKS (use this to guide them):
1 Passport: name, city, where they are now, skills, interests, goal, and achievements one per line (their proof). They can paste a résumé to fill it in. Saving updates everything.
2 Your path: their top sports career matches (8 paths), the skills they have and what is missing. "Make this my target" puts a plan inside that match; ticking a plan step asks what they did and saves it as a new achievement (proof).
3 Jobs & internships: real postings from anywhere, each with a Fit check that shows proof, ticked-only skills and gaps; gaps can be added to the plan.
4 Proof: a public proof link to paste into applications (can be turned off) and honest résumé bullets.
You (Goldie) are in the corner of every page: questions, job searches, and interview practice for their target role.
Guests can save their Passport with an email at the top of the page.
Rules:
- Only talk about sports careers, their profile, matches, plan, applications, interviews and how to use this app. Politely decline anything else in one sentence.
- Never invent facts: no salaries, no statistics, no achievements they did not write. Never write job postings or employer names yourself.
- JOBS AND INTERNSHIPS: whenever they ask for jobs, internships, openings or where to apply, ALWAYS set action "search_jobs". The app then searches real postings (Adzuna plus the career boards of sports employers) and shows them directly under your reply. Never tell them to go search somewhere else, never say you can't show listings. In "reply" just introduce the results in one or two sentences without saying how many or which ones you found, because you cannot see them (e.g. "Here's what's open for sports marketing internships right now. Your social media work is a strong fit for this kind of role.").
- Only use numbers that appear in their profile or plan.
- When you refer to their experience, copy the exact achievement line(s) into "evidence" (word for word, from the ACHIEVEMENTS list only).
- Keep "reply" under 120 words, warm and direct, plain text, no markdown.
- "next_step" is one concrete action they can do this week.
- "suggest_role" is the number of ONE career path from the CAREER PATHS list if recommending a path fits the question, otherwise -1.
- "follow_ups" are 3 short questions (under 10 words) they might ask you next, written in their voice.
- "action" moves the page for them. Use it ONLY when they ask to see, go to, open or find something, otherwise "none":
  go_passport, go_matches, go_jobs, go_plan, go_proof (scroll to that step); search_jobs (see JOBS AND INTERNSHIPS); start_tour (they want a tour or don't know where to start).
- For search_jobs fill: "job_keywords" = 0 to 4 words for the kind of role, plus "internship" if they want internships (e.g. "marketing internship", "video analyst", "NBA social media"); never the words sports, job or jobs; empty for any sports job. "job_location" = a place ONLY if they named one, their profile CITY only if they said near me / nearby / local, otherwise "" (anywhere). "action_query" = a short label like "Sports marketing internships, anywhere in the US".`;

const INTERVIEW_RULES = `
INTERVIEW PRACTICE MODE: act as a hiring manager for their target role.
- If the last message is not an answer yet, ask ONE realistic interview question for that role in "reply".
- If they just answered, give short honest feedback in "reply": one thing that worked, one thing to fix, and which of their achievement lines would make the answer stronger (put those in "evidence"). Then ask the next question.
- Coach them to use the STAR method (situation, task, action, result) without inventing results for them.`;

// Things Goldie can do on the page. The browser only acts on these names, so the AI can't trigger anything else.
const ACTIONS = ["none", "go_passport", "go_matches", "go_jobs", "go_plan", "go_proof", "search_jobs", "start_tour"];

const COACH_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    next_step: { type: "string" },
    suggest_role: { type: "integer" },
    follow_ups: { type: "array", items: { type: "string" } },
    action: { type: "string", enum: ACTIONS },
    action_query: { type: "string" },
    job_keywords: { type: "string" },
    job_location: { type: "string" }
  },
  required: ["reply", "evidence", "next_step", "suggest_role", "follow_ups", "action"]
};

const COACH_FALLBACK = {
  ...FALLBACK,
  limit: "Goldie has used up today's free AI answers. Try again tomorrow; your Passport, matches and jobs still work.",
  slow: "Goldie's AI is busy right now. Try again in a few seconds.",
  error: "Goldie isn't available right now. Try again in a minute; your profile and matches still work."
};

// context: { profileText, achievements (array of lines), contextText (everything the coach may cite) }
export async function coachReply(context, history, mode) {
  if (!process.env.GEMINI_API_KEY) return { error: FALLBACK.noKey };
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await generate(ai, {
      contents: history.map((m) => ({ role: m.role === "coach" ? "model" : "user", parts: [{ text: m.text }] })),
      config: {
        systemInstruction: COACH_RULES + (mode === "interview" ? INTERVIEW_RULES : "") + "\n\n" + context.profileText,
        temperature: 0.5,
        maxOutputTokens: 2000,
        thinkingConfig: { thinkingLevel: "minimal" },
        responseMimeType: "application/json",
        responseJsonSchema: COACH_SCHEMA,
        abortSignal: AbortSignal.timeout(TIMEOUT_MS)
      }
    });
    const out = JSON.parse(String(res.text || "{}"));
    const reply = String(out.reply || "").trim();
    if (!reply) return { error: COACH_FALLBACK.error };

    // Proof check: evidence must be one of the user's own achievement lines (case and spacing ignored).
    const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
    const lines = new Map(context.achievements.map((l) => [norm(l), l]));
    const quoted = (Array.isArray(out.evidence) ? out.evidence : []).map(norm);
    const evidence = [...new Set(quoted.filter((q) => lines.has(q)).map((q) => lines.get(q)))].slice(0, 3);
    const droppedEvidence = quoted.filter((q) => !lines.has(q)).length;

    // Number guard: numbers in the answer that appear nowhere in the profile, plan or the user's messages.
    const source = (context.contextText + " " + history.filter((m) => m.role === "user").map((m) => m.text).join(" ")).replace(/,/g, "");
    const unverified = [...new Set(((reply + " " + (out.next_step || "")).replace(/,/g, "").match(/\d+(\.\d+)?/g) || []))].filter((n) => !source.includes(n));

    // No role button during interview practice: the target role is already chosen.
    const role = mode !== "interview" && Number.isInteger(out.suggest_role) && out.suggest_role >= 0 && out.suggest_role <= 7 ? out.suggest_role : -1;
    return {
      reply,
      evidence,
      droppedEvidence,
      unverified,
      nextStep: String(out.next_step || "").trim().slice(0, 300),
      suggestRole: role,
      followUps: (Array.isArray(out.follow_ups) ? out.follow_ups : []).map((f) => String(f).trim().slice(0, 80)).filter(Boolean).slice(0, 3),
      // No page actions in interview practice: the user is answering questions, not navigating.
      action: mode !== "interview" && ACTIONS.includes(out.action) ? out.action : "none",
      actionQuery: String(out.action_query || "").trim().slice(0, 200),
      jobKeywords: clip(out.job_keywords, 40).replace(/\b(sports?|jobs?)\b/gi, "").replace(/\s+/g, " ").trim(),
      jobLocation: clip(out.job_location, 60)
    };
  } catch (err) {
    const msg = String((err && (err.status || err.message)) || "");
    if (/429|quota|exhaust|rate/i.test(msg)) return { error: COACH_FALLBACK.limit };
    if (/abort|timeout|503|overload|unavailable/i.test(msg) || (err && err.name === "AbortError")) return { error: COACH_FALLBACK.slow };
    console.error("Coach call failed:", msg.slice(0, 200));
    return { error: COACH_FALLBACK.error };
  }
}

// Trims and shortens text from the AI before it is used.
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
