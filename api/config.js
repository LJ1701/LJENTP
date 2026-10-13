const { stripeEnabled } = require("./_lib/server");

// Public client settings. The Supabase anon key is meant to be public;
// row-level security in supabase/schema.sql is what protects each profile.
module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ error: "not_configured" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=300");
  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    checkoutEnabled: stripeEnabled(),
    proRequiredForAi: process.env.REQUIRE_PRO_FOR_AI === "true"
  });
};
