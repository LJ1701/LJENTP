// Compares two eval runs (the cheaper model vs the current model) case by case, and scores simple routing rules.
//   npm run evals-compare                        today's runs of gemini-3.5-flash-lite and gemini-3.5-flash
//   npm run evals-compare -- <cheap.json> <current.json>
// Nothing in the app changes: this only reads evals/results/*.json.
import { readFileSync, writeFileSync } from "node:fs";

const here = new URL(".", import.meta.url);
const today = new Date().toLocaleDateString("en-CA");
const [cheapPath, currentPath] = process.argv.slice(2).length === 2 ? process.argv.slice(2)
  : [`results/${today}-gemini-3.5-flash-lite.json`, `results/${today}-gemini-3.5-flash.json`];
const load = (p) => JSON.parse(readFileSync(new URL(p, here), "utf8"));
const cheap = load(cheapPath);
const current = load(currentPath);
const suite = JSON.parse(readFileSync(new URL("cases.json", here), "utf8"));

const byId = (run) => Object.fromEntries(run.rows.map((r) => [r.id, r]));
const C = byId(cheap);
const N = byId(current);
const usd = (n) => `$${n.toFixed(5)}`;
const mark = (r) => (!r ? "—" : r.result === "PASS" ? "✅" : r.result === "FAIL" ? "❌" : "⏭️");

// What each case is, so rules can use it: résumé file, interview practice, or a chat message (and its length).
const info = Object.fromEntries(suite.cases.map((c) => {
  const i = c.input;
  const text = i.message_repeat ? i.message_repeat.text.repeat(i.message_repeat.times) + i.message_repeat.then : i.message || "";
  return [c.id, { file: !!(i.file || i.fake_file), interview: i.mode === "interview", length: text.length, lang: i.lang || "en" }];
}));

// Candidate rules: each returns "cheap" or "current" for a case.
const RULES = [
  ["Always the cheaper model", () => "cheap"],
  ["Always the current model", () => "current"],
  ["Cheaper model for résumé files; current model for Goldie's chat", (x) => (x.file ? "cheap" : "current")],
  ["Current model for résumé files; cheaper model for Goldie's chat", (x) => (x.file ? "current" : "cheap")],
  ["Cheaper model unless it's interview practice or the message is over 300 characters", (x) => (x.interview || x.length > 300 ? "current" : "cheap")]
];

const ids = suite.cases.map((c) => c.id).filter((id) => C[id] && N[id]);
const lines = [
  `# Cheaper vs current model: ${today}`,
  "",
  `Cheaper: \`${cheap.model}\` (${cheapPath}) · Current: \`${current.model}\` (${currentPath}). Costs are paid-tier prices (mvp/lib/ai-prices.js); both are $0 on the free tier. "Answered by" shows the model Google actually used.`,
  "",
  "| Case | Cheaper | Current | Cost cheaper | Cost current | Answered by (current) |",
  "|---|---|---|---|---|---|",
  ...ids.map((id) => `| ${id} | ${mark(C[id])} | ${mark(N[id])} | ${C[id].calls ? usd(C[id].cost) : "$0 (no AI)"} | ${N[id].calls ? usd(N[id].cost) : "$0 (no AI)"} | ${N[id].models || "no AI"} |`),
  ""
];

const sum = (list) => list.reduce((a, b) => a + b, 0);
lines.push("## Routing rules", "", "| Rule | Pass rate | Cost of all cases | Avg cost per case |", "|---|---|---|---|");
for (const [name, pick] of RULES) {
  const chosen = ids.map((id) => (pick(info[id]) === "cheap" ? C[id] : N[id]));
  const counted = chosen.filter((r) => r.result !== "SKIPPED");
  const pass = counted.filter((r) => r.result === "PASS").length;
  const cost = sum(chosen.map((r) => r.cost || 0));
  lines.push(`| ${name} | ${pass} of ${counted.length} (${Math.round((pass / counted.length) * 100)}%)${counted.length < chosen.length ? `, ${chosen.length - counted.length} skipped` : ""} | ${usd(cost)} | ${usd(cost / chosen.length)} |`);
}
lines.push("", "Per 1,000 cases = the 'Avg cost per case' × 1,000. A case is one user action (one chat message or one résumé upload).", "");

const out = lines.join("\n");
writeFileSync(new URL(`results/${today}-compare.md`, here), out);
console.log(out);
