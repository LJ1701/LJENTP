import "server-only";
import { GoogleGenAI } from "@google/genai";

// Turns the user's achievements into three résumé bullets with Google Gemini. Runs only on the server
// (the "server-only" import makes the build fail if browser code ever imports this file), so
// GEMINI_API_KEY never reaches a visitor's browser.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const TIMEOUT_MS = 15000;

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
    const res = await ai.models.generateContent({
      model: MODEL,
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
