const Anthropic = require("@anthropic-ai/sdk");

const MODEL = "claude-opus-5-5";
const LANG_NAMES = { en: "English", es: "Spanish", zh: "Simplified Chinese", ar: "Arabic" };
const MAX_HISTORY = 8;
const MAX_TEXT = 2000;

// Best-effort per-instance cap; serverless instances don't share memory.
const HOURLY_LIMIT = 20;
const hits = new Map();

function overLimit(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > HOURLY_LIMIT;
}

const SYSTEM = `You are the AI Coach inside LJSportMind, a web app for independent sports people: players, former players, coaches, students, creators and fans.

Every request includes the user's saved Sports Profile and the app's career matches computed from it. The profile and the matching are the source of truth; you are the interface to them.

Rules:
- Ground every answer in the profile and matches provided. Name the specific profile facts you relied on (for example "your video editing skill" or "your goal of working in a front office").
- Judge progress against the user's own baseline, not general standards, and use their readiness gaps to pick next steps.
- Movement numbers come from a phone camera, not a clinician. Never diagnose an injury or clear someone to play; for pain, injury or recovery, tell them to see a physio or doctor.
- Matches are keyword-based guidance. Never present percentages or scores as validated measures of readiness or hiring chances.
- Never invent facts about the user, job openings, salaries, companies or statistics. If something you need is missing from the profile, say what to add to the Sports Profile.
- Be specific and practical: concrete next steps a person can take this week or month.
- Keep answers under 200 words unless the user asks for more.
- Write plain text with short paragraphs or simple "- " bullets. No markdown headings, bold or tables.
- Reply in the language the request names.`;

function clean(value, max = MAX_TEXT) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
}

function cleanList(value, maxItems = 20) {
  return (Array.isArray(value) ? value : []).slice(0, maxItems).map((v) => clean(v, 80)).filter(Boolean);
}

function profileBlock(profile, matches) {
  const p = profile && typeof profile === "object" ? profile : {};
  const lines = [
    `Role: ${clean(p.role, 60) || "not set"}`,
    `Career goal: ${clean(p.goal, 120) || "not set"}`,
    `Location: ${clean(p.location, 80) || "not set"}`,
    `Education: ${clean(p.education, 80) || "not set"}`,
    `Skills: ${cleanList(p.skills).join(", ") || "none listed"}`,
    `Interests: ${cleanList(p.interests).join(", ") || "none listed"}`,
    `Achievements:\n${clean(p.achievements, 1500) || "none listed"}`,
    `Readiness for their goal: ${clean(p.readiness, 400) || "unknown"}`,
    `Change since their own baseline: ${clean(p.sinceBaseline, 400) || "unknown"}`,
    `Movement checks (from their phone camera): ${clean(p.movement, 1200) || "none yet"}`,
    `Soccer mini-games in the app: ${clean(p.games, 600) || "none played yet"}`
  ];
  const m = (Array.isArray(matches) ? matches : []).slice(0, 4).map((x) =>
    `- ${clean(x && x.name, 80)} (covers ${cleanList(x && x.have).length} of ${cleanList(x && x.have).length + cleanList(x && x.gaps).length} typical skills): has ${cleanList(x && x.have).join(", ") || "none"}; gaps ${cleanList(x && x.gaps).join(", ") || "none"}`
  );
  return `<sports_profile>\n${lines.join("\n")}\n</sports_profile>\n<career_matches>\n${m.join("\n") || "No matches yet."}\n</career_matches>`;
}

function contentPrompt(game, credit) {
  const g = game && typeof game === "object" ? game : {};
  return `Write social content about this game for me, tuned to my profile and goal.

Game: ${clean(g.teamA, 60)} ${Number(g.scoreA) || 0} - ${Number(g.scoreB) || 0} ${clean(g.teamB, 60)} (${clean(g.sport, 40)})
Type of moment: ${clean(g.momentType, 60)}
Key moment: ${clean(g.keyMoment, 400)}
My take: ${clean(g.observation, 400) || "none"}

Return exactly these five parts, each starting with its label on its own line:
Hook:
Video idea:
Engagement question:
Caption: (end the caption with exactly this line: ${credit})
Voiceover script (five short timed beats, e.g. "0-3s: ..."):`;
}

const ANALYSIS_PROMPT = `Act as my sports career coach. Analyse my career fit, my skill gaps and my progress since my own baseline, using my Sports Passport and career matches. Focus on careers; don't mention games or movement checks unless they clearly matter for my goal.

Write plain text in exactly this shape, under 170 words:
A 2-sentence overall read of where I stand.
Strengths: then 2-3 short "- " bullets citing evidence from my profile.
Gaps: then 1-2 short "- " bullets.
This week: then 3 numbered, concrete steps I can do in the next 7 days.
Use counts like "4 of 6 skills", never percentages or scores. Only use facts from my data.`;

function buildMessages(body) {
  const lang = LANG_NAMES[body.lang] || LANG_NAMES.en;
  const context = `${profileBlock(body.profile, body.matches)}\n\nReply in ${lang}.`;

  if (body.mode === "analysis") {
    return [{ role: "user", content: `${context}\n\n${ANALYSIS_PROMPT}` }];
  }

  if (body.mode === "content") {
    const credit = clean(body.credit, 80) || "Made with LJSportMind by @ljsoccer01";
    return [{ role: "user", content: `${context}\n\n${contentPrompt(body.game, credit)}` }];
  }

  const question = clean(body.question);
  if (!question) return null;

  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-MAX_HISTORY)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && clean(m.content))
    .map((m) => ({ role: m.role, content: clean(m.content) }));
  while (history.length && history[0].role !== "user") history.shift();
  if (history.length && history[history.length - 1].role === "user") history.pop();

  // Profile goes with the newest question so it always reflects the latest save.
  return [...history, { role: "user", content: `${context}\n\nMy question: ${question}` }];
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const fail = (status, error) => res.status(status).json({ error });

  if (req.method !== "POST") return fail(405, "method_not_allowed");
  if (!process.env.ANTHROPIC_API_KEY) return fail(503, "not_configured");

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (overLimit(ip)) return fail(429, "rate_limited");

  // Off during early access; set REQUIRE_PRO_FOR_AI=true in Vercel to make AI a Pro feature.
  if (process.env.REQUIRE_PRO_FOR_AI === "true") {
    const { requestIsPro } = require("./_lib/server");
    if (!(await requestIsPro(req))) return fail(402, "pro_required");
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const messages = buildMessages(body);
  if (!messages) return fail(400, "empty_question");

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      messages
    });

    if (response.stop_reason === "refusal") return fail(422, "refused");

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!text) return fail(502, "empty_reply");

    return res.status(200).json({ text });
  } catch (err) {
    console.error("assistant error:", err && err.constructor && err.constructor.name, err && err.status);
    if (err instanceof Anthropic.RateLimitError) return fail(429, "rate_limited");
    if (err instanceof Anthropic.AuthenticationError) return fail(503, "not_configured");
    if (err instanceof Anthropic.APIError) return fail(502, "upstream_error");
    return fail(500, "server_error");
  }
};
