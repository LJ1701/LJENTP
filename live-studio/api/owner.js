// Unlimited access for people the owner chooses (at most 15). Codes live only in Vercel environment
// variables, never in the page source:
//   LJ_OWNER_CODE    the owner's own code (shown as "Owner")
//   LJ_ACCESS_CODES  everyone else, as name:code pairs separated by commas or new lines,
//                    e.g. "Sam:first-code, Ana:second-code"
// The owner counts toward the 15; anyone past the 15th is ignored. A match unlocks unlimited daily
// posts on that device, and the app re-checks the code each time it opens, so removing someone from
// the list ends their access everywhere.
const crypto = require("crypto");

const MAX_PEOPLE = 15;
const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();

function people() {
  const list = [];
  if (process.env.LJ_OWNER_CODE) list.push({ name: "Owner", code: process.env.LJ_OWNER_CODE.trim() });
  String(process.env.LJ_ACCESS_CODES || "")
    .split(/[,\n]/)
    .map((pair) => pair.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const i = pair.indexOf(":");
      if (i < 1) return;
      const name = pair.slice(0, i).trim().slice(0, 30);
      const code = pair.slice(i + 1).trim();
      if (name && code.length >= 6) list.push({ name, code });
    });
  return list.slice(0, MAX_PEOPLE);
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Use POST." }));
  }
  const list = people();
  if (!list.length) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: "not_set" }));
  }
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const code = String((body && body.code) || "");
  // Compare against every code (timing-safe) so the reply time doesn't hint at which one matched.
  let match = null;
  list.forEach((p) => {
    if (crypto.timingSafeEqual(digest(code), digest(p.code)) && !match) match = p;
  });
  // A short pause on a wrong code makes guessing slow.
  if (!match) await new Promise((r) => setTimeout(r, 800));
  res.statusCode = match ? 200 : 401;
  return res.end(JSON.stringify(match ? { owner: true, name: match.name } : { owner: false }));
};
