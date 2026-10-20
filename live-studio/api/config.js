// Tells the page whether the AI key works, so AI buttons only appear when they can answer.
// Checked with a free models call and remembered for 10 minutes per server instance.
let aiCheck = { at: 0, ok: false };

async function aiWorks() {
  if (!process.env.ANTHROPIC_API_KEY) return false;
  if (Date.now() - aiCheck.at < 10 * 60 * 1000) return aiCheck.ok;
  let ok = false;
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    await new Anthropic().models.list({ limit: 1 });
    ok = true;
  } catch {
    ok = false;
  }
  aiCheck = { at: Date.now(), ok };
  return ok;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60");
  return res.status(200).json({ aiEnabled: await aiWorks() });
};
