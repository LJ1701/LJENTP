const { accountsEnabled, stripeEnabled } = require("./_lib/server");

// Public client settings. The Supabase anon key is meant to be public;
// row-level security in supabase/schema.sql is what protects each profile.
module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60");
  const accounts = accountsEnabled();
  return res.status(200).json({
    accountsEnabled: accounts,
    supabaseUrl: accounts ? process.env.SUPABASE_URL : null,
    supabaseAnonKey: accounts ? process.env.SUPABASE_ANON_KEY.trim() : null,
    checkoutEnabled: stripeEnabled(),
    proRequiredForAi: process.env.REQUIRE_PRO_FOR_AI === "true",
    jobsEnabled: !!process.env.JSEARCH_API_KEY
  });
};
