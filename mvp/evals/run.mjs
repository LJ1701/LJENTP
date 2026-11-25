// Runs every case in evals/cases.json through Goldie's real code (the same files the app uses), applies the
// checks, and saves evals/results/<today>.md. How to run: see CLAUDE.md > Evals.
//
// Which AI model answers: the lighter model by default, so a run doesn't use up the main model's free daily
// quota that real users need. To test the main model: EVAL_MODEL=gemini-3.5-flash.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

const LITE = "gemini-3.5-flash-lite";
process.env.GEMINI_MODEL = process.env.EVAL_MODEL || LITE; // read by lib/gemini.js when it loads
const GRADER_MODEL = process.env.GRADER_MODEL || LITE;
const PAUSE_MS = 5000; // gap between AI calls, to stay under the free tier's per-minute limit

// Every app AI call in this run is logged to a file (lib/ai-log.js), tagged with the case id, to price each case.
const here = new URL(".", import.meta.url);
const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
const only = process.argv[2]; // optional: run some cases, e.g. npm run evals -- 06-salary,08-fake-claim
// A run of only some cases saves to its own files, so it never overwrites the day's full report.
const name = `${today}${only ? "-partial" : ""}${process.env.EVAL_MODEL ? `-${process.env.EVAL_MODEL}` : ""}`;
mkdirSync(new URL("results/", here), { recursive: true });
const callLog = new URL(`results/${name}-calls.jsonl`, here);
writeFileSync(callLog, ""); // start this run's call log empty
process.env.AI_LOG_FILE = callLog.pathname;

const { coachReply } = await import("../lib/gemini.js");
const { quickIntent } = await import("../lib/intent.js");
const { cleanTurns, turnsProblem, buildCoachContext } = await import("../lib/coach-context.js");
const { resumeFileText } = await import("../lib/resume-file.js");
const { callCost } = await import("../lib/ai-prices.js");

const suite = JSON.parse(readFileSync(new URL("cases.json", here), "utf8"));
const cases = suite.cases.filter((c) => !only || only.split(",").includes(c.id));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const QUOTA = /limit|quota|429|exhaust/i;
const BUSY = /slow|503|overload|unavailable|abort|timeout/i; // Google busy or slow: try again, then skip

// Tries an AI step up to 3 times when Google is busy (503), waiting a little longer each time.
async function withRetry(fn, isBusy) {
  for (let i = 0; ; i++) {
    try {
      const out = await fn();
      if (i < 2 && isBusy(out)) { await sleep(10000 * (i + 1)); continue; }
      return out;
    } catch (err) {
      if (i < 2 && BUSY.test(String((err && (err.status || err.message)) || err))) { await sleep(10000 * (i + 1)); continue; }
      throw err;
    }
  }
}

if (!process.env.GEMINI_API_KEY) {
  console.error("No GEMINI_API_KEY. Run from mvp/ with --env-file=.env.local (see CLAUDE.md > Evals).");
  process.exit(1);
}

// ---------- 1. Run one case the way the app does ----------
function messageOf(input) {
  if (input.file) return `(file: ${input.file})`;
  if (input.fake_file) return `(file: ${input.fake_file.name}, ${input.fake_file.bytes} bytes)`;
  if (input.message_repeat) return input.message_repeat.text.repeat(input.message_repeat.times) + input.message_repeat.then;
  return input.message;
}

// File cases: the file goes through the same reader the upload and photo buttons use (lib/resume-file.js).
async function runFileCase(c) {
  let file;
  if (c.input.file) {
    const buf = readFileSync(new URL(c.input.file, here));
    const name = c.input.file.split("/").pop();
    file = new File([buf], name, { type: /\.png$/.test(name) ? "image/png" : /\.pdf$/.test(name) ? "application/pdf" : "image/jpeg" });
  } else {
    const f = c.input.fake_file;
    file = new File([new Uint8Array(f.bytes).fill(65)], f.name, { type: f.type });
  }
  const res = await withRetry(() => resumeFileText(file), (o) => o.error && BUSY.test(o.error));
  if (res.error && (QUOTA.test(res.error) || BUSY.test(res.error))) return { path: "file", aiError: res.error };
  return { path: "file", text: res.text || "", fileError: res.error || "", via: res.via || "", reply: res.error ? `(refused: ${res.error})` : (res.text || "") };
}

async function runCase(c) {
  if (c.input.file || c.input.fake_file) return runFileCase(c);
  const text = messageOf(c.input);
  const mode = c.input.mode === "interview" ? "interview" : "ask";
  const lang = c.input.lang || "en";
  const turns = cleanTurns([{ role: "user", text }]);
  const out = { path: "", sentChars: turns.length ? turns[turns.length - 1].text.length : 0, reply: "" };

  // Same order as askCoach in app/profile/actions.js: input checks, then instant rules, then the AI.
  const problem = turnsProblem(turns);
  if (problem) return { ...out, path: "blocked", blocked: problem };

  if (mode !== "interview") {
    const quick = quickIntent(turns[turns.length - 1].text, suite.profile.location);
    if (quick) {
      return { ...out, path: "rules", action: quick.action, keywords: quick.query?.keywords || "", location: quick.query?.location || "", suggestRole: -1, evidence: [], unverified: [] };
    }
  }

  const plan = mode === "interview" ? suite.interview_plan : suite.plan;
  const { contextText, achievements } = buildCoachContext({ profile: suite.profile, plan, place: "" });
  const res = await withRetry(() => coachReply({ profileText: "USER DATA:\n" + contextText, achievements, contextText }, turns, mode, lang), (o) => o.error && BUSY.test(o.error));
  if (res.error) return { ...out, path: "ai", aiError: res.error };
  return { ...out, path: "ai", reply: res.reply, nextStep: res.nextStep, action: res.action, keywords: res.jobKeywords, location: res.jobLocation, suggestRole: res.suggestRole, evidence: res.evidence, unverified: res.unverified };
}

// ---------- 2. The grader: a second AI call that answers only PASS or FAIL ----------
const grader = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function grade(rubric, userMessage, r) {
  const res = await grader.models.generateContent({
    model: GRADER_MODEL,
    contents: `RUBRIC: ${rubric}\n\nUSER MESSAGE: ${userMessage.slice(0, 600)}\n\nCOACH REPLY: ${r.reply}\nCOACH NEXT STEP: ${r.nextStep || ""}`,
    config: {
      systemInstruction: "You grade one reply from a sports-career coach app against the rubric. Judge only what the rubric asks. Answer PASS or FAIL and one short sentence saying why.",
      temperature: 0,
      thinkingConfig: { thinkingLevel: "minimal" },
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: { verdict: { type: "string", enum: ["PASS", "FAIL"] }, reason: { type: "string" } },
        required: ["verdict", "reason"]
      },
      abortSignal: AbortSignal.timeout(20000)
    }
  });
  const out = JSON.parse(String(res.text || "{}"));
  if (out.verdict !== "PASS" && out.verdict !== "FAIL") throw new Error("grader gave no verdict");
  return { pass: out.verdict === "PASS", reason: String(out.reason || "").trim() };
}

// ---------- 3. The checks ----------
// Each returns { pass, reason } or { skip, reason } (skip = doesn't apply on this path, not counted).
const norm = (s) => String(s || "").toLowerCase();
const words = (s) => norm(s).split(/[^\p{L}]+/u).filter(Boolean);
async function check(k, r, userMessage) {
  const ok = (pass, reason) => ({ pass, reason });
  const needsAnswer = r.path === "blocked" ? { pass: false, reason: `blocked before reaching Goldie (${r.blocked})` } : null;
  switch (k.type) {
    case "blocked_with": return ok(r.blocked === k.value, r.blocked ? `blocked: ${r.blocked}` : `not blocked (went to ${r.path})`);
    case "sent_chars_max": return ok(r.sentChars <= k.value, `${r.sentChars} characters sent (max ${k.value})`);
    case "replied": return needsAnswer || ok(r.path === "rules" || !!r.reply, r.path === "rules" ? "answered by app rules" : r.reply ? "got a reply" : "empty reply");
    case "action_is": return needsAnswer || ok(r.action === k.value, `action was "${r.action}" (wanted "${k.value}")`);
    case "keywords_include": return needsAnswer || ok(words(r.keywords).includes(norm(k.value)), `keywords "${r.keywords}" ${words(r.keywords).includes(norm(k.value)) ? "include" : "miss"} "${k.value}"`);
    case "keywords_exclude": return needsAnswer || ok(!words(r.keywords).some((w) => w.startsWith(norm(k.value))), `keywords "${r.keywords}"`);
    case "location_is": return needsAnswer || ok(norm(r.location) === norm(k.value), `location "${r.location}" (wanted "${k.value}")`);
    case "role_suggested": return needsAnswer || ok(Number.isInteger(r.suggestRole) && r.suggestRole >= 0 && r.suggestRole <= 7, `suggested role ${r.suggestRole}`);
    case "role_not_suggested": return needsAnswer || ok(r.suggestRole === -1, `suggested role ${r.suggestRole}`);
    case "evidence_from_profile": {
      if (needsAnswer) return needsAnswer;
      const lines = suite.profile.achievements.split("\n").map(norm);
      const good = (r.evidence || []).filter((e) => lines.includes(norm(e)));
      return ok(good.length > 0 && good.length === r.evidence.length, `${good.length} of ${(r.evidence || []).length} evidence lines are the user's own`);
    }
    case "no_new_numbers": return needsAnswer || ok(!(r.unverified || []).length, (r.unverified || []).length ? `numbers not in the profile: ${r.unverified.join(", ")}` : "no invented numbers");
    case "reply_excludes": return needsAnswer || ok(!r.reply.includes(k.value), r.reply.includes(k.value) ? `reply contains "${k.value}"` : `reply doesn't contain "${k.value}"`);
    case "reply_matches": if (r.path === "rules") return ok(false, `answered by app rules (instant ${r.action}), so there was no written reply`);
      return needsAnswer || ok(new RegExp(k.value, "u").test(r.reply), `${k.label || k.value}: ${new RegExp(k.value, "u").test(r.reply) ? "yes" : "no"}`);
    case "grader": {
      if (needsAnswer) return needsAnswer;
      if (r.path === "rules") return { skip: true, reason: "grader skipped: answered by app rules, no AI text to judge" };
      await sleep(PAUSE_MS);
      const g = await withRetry(() => grade(k.rubric, userMessage, r), () => false);
      return ok(g.pass, `grader: ${g.reason}`);
    }
    case "file_read": return ok(!r.fileError && !!r.text, r.fileError ? `refused: ${r.fileError}` : `read ${r.text.length} characters`);
    case "file_text_includes": return ok(r.text.includes(k.value), `text ${r.text.includes(k.value) ? "includes" : "is missing"} "${k.value}"`);
    case "file_error_is": return ok(r.fileError === k.value, r.fileError ? `refused: ${r.fileError}` : `not refused (read ${r.text.length} characters)`);
    case "file_numbers_from_source":
    case "file_unreadable_or_faithful": {
      if (k.type === "file_unreadable_or_faithful" && r.fileError === "unreadable") return ok(true, "said it couldn't read it (no guessing)");
      if (r.fileError) return ok(false, `refused: ${r.fileError}`);
      // Every number it copied must really be on the résumé; otherwise it guessed.
      const source = suite.resume_source.replace(/,/g, "");
      const invented = [...new Set((r.text.replace(/,/g, "").match(/\d+/g) || []))].filter((n) => !source.includes(n));
      return ok(!invented.length, invented.length ? `numbers not on the résumé (guessed): ${invented.join(", ")}` : `copied ${r.text.length} characters, no guessed numbers`);
    }
    default: return ok(false, `unknown check type "${k.type}"`);
  }
}

// ---------- 4. Run everything and write the report ----------
const rows = [];
for (const [i, c] of cases.entries()) {
  if (i) await sleep(PAUSE_MS);
  process.stdout.write(`${c.id} ... `);
  globalThis.__aiLogTag = c.id; // tags the app's AI calls with this case (the grader's own calls aren't logged)
  const userMessage = messageOf(c.input);
  let r, row;
  try {
    r = await runCase(c);
    if (r.aiError) {
      row = QUOTA.test(r.aiError) ? { id: c.id, result: "SKIPPED", reason: `AI daily or per-minute limit reached (${r.aiError}); not counted` }
        : BUSY.test(r.aiError) ? { id: c.id, result: "SKIPPED", reason: "Google's AI was busy or slow after 3 tries; not counted" }
        : { id: c.id, result: "FAIL", reason: `Goldie returned an error: ${r.aiError}` };
    } else {
      const results = [];
      for (const k of c.checks) results.push(await check(k, r, userMessage));
      const counted = results.filter((x) => !x.skip);
      const failed = counted.filter((x) => !x.pass);
      row = { id: c.id, result: failed.length ? "FAIL" : "PASS", reason: failed.length ? failed.map((x) => x.reason).join("; ") : `${counted.length} of ${counted.length} checks passed${results.length > counted.length ? ` (${results.length - counted.length} skipped)` : ""}` };
    }
  } catch (err) {
    const msg = String((err && (err.status || err.message)) || err);
    row = QUOTA.test(msg) || BUSY.test(msg) ? { id: c.id, result: "SKIPPED", reason: `AI ${QUOTA.test(msg) ? "limit reached" : "busy (503)"} during grading; not counted` } : { id: c.id, result: "FAIL", reason: `script error: ${msg.slice(0, 150)}` };
  }
  row.path = r ? r.path : "";
  row.reply = r ? (r.reply || (r.path === "rules" ? `(instant answer by app rules: ${r.action}${r.keywords ? `, "${r.keywords}"` : ""}${r.location ? `, ${r.location}` : ""})` : r.blocked ? `(blocked: ${r.blocked})` : "")) : "";
  rows.push(row);
  console.log(row.result);
}

// Cost of each case: the app's AI calls for that case ($0 when answered by rules or refused before the AI).
const calls = readFileSync(callLog, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
for (const r of rows) {
  const mine = calls.filter((x) => x.tag === r.id);
  r.cost = mine.reduce((sum, x) => sum + (callCost(x, today) || 0), 0);
  r.calls = mine.length;
  r.models = [...new Set(mine.map((x) => x.model_version))].join(", ");
}
const usd = (n) => `$${n.toFixed(5)}`;

const counted = rows.filter((r) => r.result !== "SKIPPED");
const passed = counted.filter((r) => r.result === "PASS").length;
const rate = counted.length ? Math.round((passed / counted.length) * 100) : 0;
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

const md = [
  `# Goldie evals: ${today}`,
  "",
  `Model answering: \`${process.env.GEMINI_MODEL}\` · Grader: \`${GRADER_MODEL}\` · Cases: ${rows.length}${only ? ` (only ${only})` : ""}`,
  "",
  "| Case | Result | Reason | Cost (paid tier) |",
  "|---|---|---|---|",
  ...rows.map((r) => `| ${r.id} | ${r.result === "PASS" ? "✅ PASS" : r.result === "FAIL" ? "❌ FAIL" : "⏭️ SKIPPED"} | ${cell(r.reason)} | ${r.calls ? usd(r.cost) : "$0 (no AI)"} |`),
  "",
  `**Pass rate: ${passed} of ${counted.length} (${rate}%)**${rows.length > counted.length ? `. ${rows.length - counted.length} skipped (AI limit or busy), not counted.` : ""}`,
  "",
  `Cost of the app's AI calls in this run: ${usd(rows.reduce((s, r) => s + r.cost, 0))} at paid-tier prices (mvp/lib/ai-prices.js); $0 on the free tier. The grader's calls aren't included.`,
  "",
  "## What Goldie said",
  "",
  ...rows.map((r) => `- **${r.id}** (${r.path || "?"}): ${cell(r.reply).slice(0, 400) || "(nothing)"}`),
  ""
].join("\n");

writeFileSync(new URL(`results/${name}.md`, here), md);
// The same results as data, for npm run evals-compare.
writeFileSync(new URL(`results/${name}.json`, here), JSON.stringify({
  date: today, model: process.env.GEMINI_MODEL,
  rows: rows.map(({ id, result, reason, cost, calls, models, path }) => ({ id, result, reason, cost, calls, models, path }))
}, null, 2));
console.log(`\nPass rate: ${passed} of ${counted.length} (${rate}%). Saved evals/results/${name}.md`);
