const { accountsEnabled, stripeEnabled } = require("./_lib/server");

// AI buttons only show when the Anthropic key actually works. Checked with a free models call
// and remembered for 10 minutes per server instance.
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

// Public client settings. The Supabase anon key is meant to be public;
// row-level security in supabase/schema.sql is what protects each profile.
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60");
  const accounts = accountsEnabled();
  return res.status(200).json({
    accountsEnabled: accounts,
    supabaseUrl: accounts ? process.env.SUPABASE_URL : null,
    supabaseAnonKey: accounts ? process.env.SUPABASE_ANON_KEY.trim() : null,
    checkoutEnabled: stripeEnabled(),
    proRequiredForAi: process.env.REQUIRE_PRO_FOR_AI === "true",
    jobsEnabled: !!process.env.JSEARCH_API_KEY,
    aiEnabled: await aiWorks()
  });
};
