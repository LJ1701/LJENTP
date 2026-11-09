// Owner access: checks a code against the LJ_OWNER_CODE environment variable, which only the owner sets
// in Vercel. A match unlocks unlimited daily posts on that device. The code is never in the page source.
const crypto = require("crypto");

const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Use POST." }));
  }
  const secret = process.env.LJ_OWNER_CODE;
  if (!secret) {
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
  const code = (body && body.code) || "";
  const ok = crypto.timingSafeEqual(digest(code), digest(secret));
  // A short pause on a wrong code makes guessing slow.
  if (!ok) await new Promise((r) => setTimeout(r, 800));
  res.statusCode = ok ? 200 : 401;
  return res.end(JSON.stringify({ owner: ok }));
};
