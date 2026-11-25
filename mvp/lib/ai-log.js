import { appendFileSync } from "node:fs";
import { adminClient } from "./supabase/admin";

// Records the size and cost drivers of every Gemini call: when, which feature, which model, and token counts.
// NEVER the user's text: only numbers and names. Field names are Gemini's response.usageMetadata, checked on a
// real response on 25 Nov 2026: promptTokenCount, candidatesTokenCount, thoughtsTokenCount (only when the model
// thought), cachedContentTokenCount (only when cache was used), totalTokenCount; response.modelVersion says
// which model actually answered (e.g. "gemini-3.5-flash" is answered by "gemini-3.6-flash").
//
// Where it goes:
// - AI_LOG_FILE set (the evals): one JSON line per call in that file.
// - Live app: the ai_calls table (mvp/supabase/014_ai_calls.sql), written with the server-only service key.
// - Neither available: one line in the server log (Vercel > Logs), so nothing is lost.
// Logging never breaks or noticeably slows an answer: errors are ignored and the database write gives up after 1.5 s.
export async function recordAiCall(feature, model, res) {
  try {
    const u = (res && res.usageMetadata) || {};
    const row = {
      feature,
      model,
      model_version: String((res && res.modelVersion) || model).slice(0, 80),
      input_tokens: u.promptTokenCount || 0,
      output_tokens: u.candidatesTokenCount || 0,
      thinking_tokens: u.thoughtsTokenCount || 0,
      cached_tokens: u.cachedContentTokenCount || 0,
      total_tokens: u.totalTokenCount || 0
    };
    if (process.env.AI_LOG_FILE) {
      appendFileSync(process.env.AI_LOG_FILE, JSON.stringify({ created_at: new Date().toISOString(), tag: globalThis.__aiLogTag || "", ...row }) + "\n");
      return;
    }
    const db = adminClient();
    if (!db) return console.log("ai_call", JSON.stringify(row));
    await Promise.race([db.from("ai_calls").insert(row), new Promise((r) => setTimeout(r, 1500))]);
  } catch {
    // never let logging break an answer
  }
}
