import { CAREER_PATHS, topMatches, label } from "./careers";
import { effectiveProfile } from "./detect";

// What Goldie is given before each AI call. Kept in its own file (no Next.js or database code) so the
// app (app/profile/actions.js) and the eval script (evals/run.mjs) build exactly the same input.

export const MAX_TURNS = 10; // user messages per conversation
export const MAX_CHARS = 500; // characters per user message

// Cleans the chat history sent by the browser: only user/coach messages with text, each cut to size, last 16.
export function cleanTurns(history) {
  return (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === "user" || m.role === "coach") && typeof m.text === "string")
    .map((m) => ({ role: m.role, text: m.text.slice(0, m.role === "user" ? MAX_CHARS : 2000) }))
    .slice(-16);
}

// Returns a problem code ("typeFirst", "limit") when the chat can't be sent to the AI, otherwise null.
export function turnsProblem(turns) {
  if (!turns.length || turns[turns.length - 1].role !== "user" || !turns[turns.length - 1].text.trim()) return "typeFirst";
  if (turns.filter((m) => m.role === "user").length > MAX_TURNS) return "limit";
  return null;
}

// The user's own saved data as text for the AI, plus their achievement lines (the only allowed evidence).
// profile and plan are this user's rows (or null); place is the job search country name ("" = any).
export function buildCoachContext({ profile, plan, place }) {
  const p = profile || {};
  const eff = effectiveProfile(profile);
  const achievements = String(p.achievements || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const matches = profile ? topMatches(eff) : [];
  const target = plan ? CAREER_PATHS[plan.role_idx] : null;
  const contextText = [
    profile ? "" : "NO PASSPORT SAVED YET: help them fill in step 1 first.",
    `NAME: ${p.full_name || "(not given)"}`,
    `ROLE: ${p.role || "(not given)"} | SPORT: ${p.sport || "(not given)"} | CITY: ${p.location || "(not given)"}`,
    `GOAL: ${p.goal || "(not given)"}`,
    `SKILLS: ${eff.skills.map(label).join(", ") || "(none)"}`,
    `INTERESTS: ${eff.interests.map(label).join(", ") || "(none)"}`,
    `ACHIEVEMENTS (quote these exactly as evidence):\n${achievements.map((l) => `- ${l}`).join("\n") || "(none yet)"}`,
    `TOP MATCHES: ${matches.map((m) => `${m.name} (${m.strength}; has ${m.matched.map(label).join(", ")}; missing ${m.gaps.map(label).join(", ") || "nothing"})`).join(" | ") || "(none yet)"}`,
    `TARGET ROLE: ${target ? target.name : "(not chosen)"}`,
    `PLAN: ${plan ? plan.steps.map((s, i) => `${i + 1}. [${s.done ? "done" : "to do"}] ${s.text}`).join(" ") : "(no plan yet)"}`,
    `JOB SEARCH COUNTRY: ${place || "any country"}`,
    `CAREER PATHS (use the number for suggest_role): ${CAREER_PATHS.map((c, i) => `${i}=${c.name}`).join(", ")}`
  ].filter(Boolean).join("\n");
  return { contextText, achievements, target };
}
