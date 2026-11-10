// Unlimited access for people the owner chooses (at most 20, owner included). Nothing secret is in the
// page source; it all lives in Vercel environment variables:
//   LJ_OWNER_CODE      the owner's own code (shown as "Owner")
//   LJ_ACCESS_PEOPLE   everyone else's full names, separated by commas or new lines ("Sam Kim, Ana Lopez")
//   LJ_ACCESS_SUFFIX   the shared ending of every person's code (a Secret)
// A person's code is their initials followed by the shared ending, e.g. Sam Kim -> "SK" + ending.
// Letters are not case-sensitive. Anyone past the 20th person is ignored. The app re-checks the code
// each time it opens, so removing a name ends that person's access.
const crypto = require("crypto");

const MAX_PEOPLE = 20;
const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();
const initials = (name) => name.split(/\s+/).map((w) => (w.match(/\p{L}/u) || [""])[0]).join("").toUpperCase();

function people() {
  const list = [];
  if (process.env.LJ_OWNER_CODE) list.push({ name: "Owner", code: process.env.LJ_OWNER_CODE.trim() });
  const suffix = String(process.env.LJ_ACCESS_SUFFIX || "").trim();
  if (suffix) {
    String(process.env.LJ_ACCESS_PEOPLE || "")
      .split(/[,\n]/)
      .map((n) => n.trim().replace(/\s+/g, " ").slice(0, 40))
      .filter(Boolean)
      .forEach((name) => {
        const ini = initials(name);
        if (ini) list.push({ name: name.split(" ")[0], code: `${ini}${suffix}`.toUpperCase(), upper: true });
      });
  }
  return list.slice(0, MAX_PEOPLE);
}

// Guess-blocking: after 5 wrong codes from one address within 15 minutes, that address waits 15 minutes.
// Kept in memory, so it only covers one server instance at a time; the 800 ms pause on every wrong code
// still applies everywhere.
const fails = new Map();
const WINDOW = 15 * 60 * 1000;
const LIMIT = 5;

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
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
  const ip = clientIp(req);
  const now = Date.now();
  const rec = fails.get(ip);
  if (rec && now - rec.first > WINDOW) fails.delete(ip);
  else if (rec && rec.count >= LIMIT) {
    res.statusCode = 429;
    return res.end(JSON.stringify({ error: "too_many" }));
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const code = String((body && body.code) || "").trim();
  // Compare against every code (timing-safe) so the reply time doesn't hint at which one matched.
  let match = null;
  list.forEach((p) => {
    const given = p.upper ? code.toUpperCase() : code;
    if (crypto.timingSafeEqual(digest(given), digest(p.code)) && !match) match = p;
  });
  if (!match) {
    const r = fails.get(ip) || { first: now, count: 0 };
    r.count += 1;
    fails.set(ip, r);
    // A short pause on a wrong code makes guessing slow.
    await new Promise((r2) => setTimeout(r2, 800));
  }
  res.statusCode = match ? 200 : 401;
  return res.end(JSON.stringify(match ? { owner: true, name: match.name } : { owner: false }));
};
