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

const isLimit = (err) => /429|quota|exhaust|rate/i.test(String((err && (err.status || err.message)) || ""));

async function generate(ai, request, models = [MODEL, LITE_MODEL]) {
  for (let i = 0; i < models.length; i++) {
    try {
      return await ai.models.generateContent({ ...request, model: models[i] });
    } catch (err) {
      if (i === models.length - 1 || !isLimit(err)) throw err;
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

// ---------- Career Coach chat ----------
// Unlike a general chatbot, the coach is given the user's saved profile, matches and plan (read on the
// server, never from the browser), must quote evidence from their own achievements, and can suggest one
// of the app's career paths, which the page turns into a real "Make this my target role" button.
const COACH_RULES = `You are the LJSportMind Career Coach for one person looking for a career in the sports industry.
You are given their saved Sports Profile, their top career matches and their plan. Use them in every answer.
Rules:
- Only talk about sports careers, their profile, matches, plan, applications and interviews. Politely decline anything else in one sentence.
- Never invent facts: no salaries, no specific job openings, no statistics, no names of employers, no achievements they did not write. If you do not know, say so and tell them to use the "Find openings" links.
- Only use numbers that appear in their profile or plan.
- When you refer to their experience, copy the exact achievement line(s) into "evidence" (word for word, from the ACHIEVEMENTS list only).
- Keep "reply" under 120 words, warm and direct, plain text, no markdown.
- "next_step" is one concrete action they can do this week.
- "suggest_role" is the number of ONE career path from the CAREER PATHS list if recommending a path fits the question, otherwise -1.
- "follow_ups" are 3 short questions (under 10 words) they might ask you next, written in their voice.`;

const INTERVIEW_RULES = `
INTERVIEW PRACTICE MODE: act as a hiring manager for their target role.
- If the last message is not an answer yet, ask ONE realistic interview question for that role in "reply".
- If they just answered, give short honest feedback in "reply": one thing that worked, one thing to fix, and which of their achievement lines would make the answer stronger (put those in "evidence"). Then ask the next question.
- Coach them to use the STAR method (situation, task, action, result) without inventing results for them.`;

const COACH_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    next_step: { type: "string" },
    suggest_role: { type: "integer" },
    follow_ups: { type: "array", items: { type: "string" } }
  },
  required: ["reply", "evidence", "next_step", "suggest_role", "follow_ups"]
};

const COACH_FALLBACK = { ...FALLBACK, error: "The coach isn't available right now. Try again in a minute; your profile and matches still work." };

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
      followUps: (Array.isArray(out.follow_ups) ? out.follow_ups : []).map((f) => String(f).trim().slice(0, 80)).filter(Boolean).slice(0, 3)
    };
  } catch (err) {
    const msg = String((err && (err.status || err.message)) || "");
    if (/429|quota|exhaust|rate/i.test(msg)) return { error: COACH_FALLBACK.limit };
    if (/abort|timeout/i.test(msg) || (err && err.name === "AbortError")) return { error: COACH_FALLBACK.slow };
    console.error("Coach call failed:", msg.slice(0, 200));
    return { error: COACH_FALLBACK.error };
  }
}

// ---------- Job search: understanding the request ----------
// Gemini only turns what the user typed into search words and a place. The jobs themselves come from
// Adzuna (lib/jobs.js), so the AI cannot invent a posting or a link.
const JOB_QUERY_RULES = `Turn a request for sports-industry jobs into a job-board search for the United States.
Return "keywords": 0 to 4 words naming the kind of role (e.g. "video analyst", "ticket sales", "event coordinator").
Do NOT include the words "sports", "sport", "job" or "jobs" in keywords (a sports filter is added separately).
Keep league, team or employer names they mention (e.g. "NBA social media", "Dallas Cowboys marketing").
Leave keywords EMPTY if they just ask for sports jobs in general. Only use their top match when they ask for jobs that fit them, match them, or are "for me".
Return "location": a US city and state if they named one; "" if they said anywhere, nationwide or remote; otherwise their profile city.
Return "summary": one short sentence saying what you searched, e.g. "Video analyst jobs near Plano, TX".`;

const JOB_QUERY_SCHEMA = {
  type: "object",
  properties: { keywords: { type: "string" }, location: { type: "string" }, summary: { type: "string" } },
  required: ["keywords", "location", "summary"]
};

const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// Used when Gemini is off or fails: strip filler words and look for "in/near <place>".
function plainJobQuery(text, profileCity) {
  const m = text.match(/\b(?:in|near|around)\s+([a-z .,'-]{2,40})$/i);
  const location = m ? m[1].trim() : /\b(anywhere|nationwide|remote)\b/i.test(text) ? "" : profileCity || "";
  const keywords = (m ? text.slice(0, m.index) : text)
    .replace(/\b(sports?|jobs?|careers?|openings?|positions?|find|show|me|any|for|a|an|the|in|near|remote|anywhere|nationwide)\b/gi, " ")
    .replace(/\s+/g, " ").trim().slice(0, 40);
  return { keywords, location, summary: `${keywords || "Sports"} jobs${location ? ` near ${location}` : " across the US"}` };
}

const GENERAL = /^\s*(any\s+|all\s+)?(sports?\s+)?(jobs?|careers?|openings?|positions?)(\s+(near me|nearby|around me))?\s*$/i;

export async function jobQuery(text, profile) {
  const request = clip(text, 200);
  // "sports jobs" / "sports jobs near me" means every sports job near them; no AI call needed.
  if (GENERAL.test(request)) return { keywords: "", location: profile.city || "", summary: `Sports jobs ${profile.city ? `near ${profile.city}` : "across the US"}` };
  if (!process.env.GEMINI_API_KEY) return plainJobQuery(request, profile.city);
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const res = await generate(ai, {
      contents: `Request: ${request}\nProfile city: ${profile.city || "(none)"}\nTop matches: ${profile.matches || "(none)"}`,
      config: {
        systemInstruction: JOB_QUERY_RULES,
        temperature: 0,
        maxOutputTokens: 300,
        thinkingConfig: { thinkingLevel: "minimal" },
        responseMimeType: "application/json",
        responseJsonSchema: JOB_QUERY_SCHEMA,
        abortSignal: AbortSignal.timeout(8000)
      }
    }, [LITE_MODEL, MODEL]);
    const out = JSON.parse(String(res.text || "{}"));
    const keywords = clip(out.keywords, 40).replace(/\b(sports?|jobs?)\b/gi, "").replace(/\s+/g, " ").trim();
    return { keywords, location: clip(out.location, 60), summary: clip(out.summary, 120) || plainJobQuery(request, profile.city).summary };
  } catch {
    return plainJobQuery(request, profile.city);
  }
}
