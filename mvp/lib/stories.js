import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

// Stories ("How I got in"): real paths into sports, shared by the people who took them.
// Only stories the owner approved are returned; never the author's email or account id.
// Empty until supabase/010_stories.sql has been run.
export const FIELDS = ["broadcasting", "media", "operations", "marketing", "sales", "coaching", "analytics", "business", "other"];
export const STEP_KINDS = ["school", "unpaid", "internship", "referral", "applied", "paid", "other"];
export const PAY_RANGES = ["under20", "20to30", "30to45", "45to60", "over60"];
export const MAX_STEPS = 12;
// A "paths into this field" summary appears only once a field has at least this many stories,
// so one person's path is never presented as a pattern.
export const MIN_FOR_SUMMARY = 3;

export const approvedStories = cache(async () => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("approved_stories");
  return error || !Array.isArray(data) ? [] : data;
});

// For one field: how many stories include each kind of step, and how many say someone vouched for them.
// Counts only; returns null below MIN_FOR_SUMMARY stories.
export function pathSummary(stories) {
  if (stories.length < MIN_FOR_SUMMARY) return null;
  const kinds = Object.fromEntries(STEP_KINDS.map((k) => [k, 0]));
  for (const s of stories) {
    const seen = new Set((Array.isArray(s.steps) ? s.steps : []).map((st) => st && st.kind).filter((k) => k in kinds));
    seen.forEach((k) => { kinds[k] += 1; });
  }
  const rows = STEP_KINDS.filter((k) => kinds[k] > 0).map((k) => [k, kinds[k]]).sort((a, b) => b[1] - a[1]);
  const vouched = stories.filter((s) => s.vouched === true).length;
  return { total: stories.length, rows, vouched };
}

// Steps sent from the form: kind, year (optional) and one line each. Anything else is dropped.
export function cleanSteps(kinds, years, texts) {
  const now = new Date().getFullYear();
  const out = [];
  for (let i = 0; i < texts.length && out.length < MAX_STEPS; i++) {
    const text = String(texts[i] || "").trim().slice(0, 200);
    if (!text) continue;
    const kind = STEP_KINDS.includes(kinds[i]) ? kinds[i] : "other";
    const y = parseInt(years[i], 10);
    out.push({ kind, year: y >= 1950 && y <= now + 1 ? y : null, text });
  }
  return out;
}
