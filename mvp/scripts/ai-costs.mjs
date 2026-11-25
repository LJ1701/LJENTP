// Prints AI usage and estimated cost from the cost log (lib/ai-log.js). How to run: see CLAUDE.md > AI costs.
//   npm run ai-costs                      the live app's ai_calls table (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
//   npm run ai-costs -- --file <log>      a local log, e.g. one written by the evals
//   add --days 7 to look at the last 7 days only
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { PRICES, PRICES_CHECKED, priceFor, callCost } from "../lib/ai-prices.js";

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : ""; };
const file = arg("--file");
const days = Number(arg("--days")) || 0;

async function loadRows() {
  if (file) return readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local, so the live log can't be read from here.\nUse --file <log>, or see CLAUDE.md > AI costs.");
    process.exit(1);
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from("ai_calls").select("*").order("id").range(from, from + 999);
    if (days) q = q.gte("created_at", new Date(Date.now() - days * 864e5).toISOString());
    const { data, error } = await q;
    if (error) { console.error("Couldn't read ai_calls:", error.message, "(has mvp/supabase/014_ai_calls.sql been run?)"); process.exit(1); }
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

let rows = await loadRows();
if (days && file) rows = rows.filter((r) => Date.parse(r.created_at) >= Date.now() - days * 864e5);
if (!rows.length) { console.log("No AI calls logged yet."); process.exit(0); }

const usd = (n) => (n === null ? "no price" : n < 0.01 ? `$${n.toFixed(5)}` : `$${n.toFixed(2)}`);
const avg = (list, k) => Math.round(list.reduce((s, r) => s + (r[k] || 0), 0) / list.length);

function summary(label, list) {
  const costs = list.map((r) => callCost(r, String(r.created_at || "").slice(0, 10) || undefined));
  const priced = costs.filter((c) => c !== null);
  const per = priced.length ? priced.reduce((a, b) => a + b, 0) / priced.length : null;
  return { label, calls: list.length, in: avg(list, "input_tokens"), out: avg(list, "output_tokens"), think: avg(list, "thinking_tokens"), cached: avg(list, "cached_tokens"), per, per1000: per === null ? null : per * 1000, total: priced.reduce((a, b) => a + b, 0) };
}

const groups = {};
for (const r of rows) (groups[`${r.feature} · ${r.model_version}`] ||= []).push(r);
const lines = [summary("ALL CALLS", rows), ...Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([k, v]) => summary(k, v))];

const span = rows.map((r) => String(r.created_at || "").slice(0, 10)).filter(Boolean).sort();
console.log(`\nAI calls ${span.length ? `from ${span[0]} to ${span[span.length - 1]} ` : ""}(${file || "live ai_calls table"})\n`);
console.table(lines.map((l) => ({ "Feature · model": l.label, Calls: l.calls, "Avg in": l.in, "Avg out": l.out, "Avg thinking": l.think, "Avg cached": l.cached, "Cost / call": usd(l.per), "Cost / 1,000 calls": usd(l.per1000), "Total": usd(l.total) })));

console.log(`\nPrices used (US$ per 1M tokens, paid Standard tier, read from Google's pricing page on ${PRICES_CHECKED}):`);
for (const [model, list] of Object.entries(PRICES)) for (const p of list) {
  console.log(`  ${model}${p.until ? ` (until ${p.until})` : p.from ? ` (from ${p.from})` : ""}: input $${p.input} · output incl. thinking $${p.output} · cached input $${p.cached}${p.note ? ` (${p.note})` : ""}`);
}
console.log("  On Google's free tier these calls cost $0 (with daily limits). The estimates are the paid-tier cost.");
const unknown = [...new Set(rows.filter((r) => !priceFor(r.model_version)).map((r) => r.model_version))];
if (unknown.length) console.log(`  ⚠️ No price for: ${unknown.join(", ")}. Add it to mvp/lib/ai-prices.js.`);
