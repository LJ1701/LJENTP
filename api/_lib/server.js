// Shared helpers for the API functions. Vercel doesn't deploy files under api/_lib as endpoints.
const { createClient } = require("@supabase/supabase-js");
const Stripe = require("stripe");

const PRO_STATUSES = ["active", "trialing"];

let adminClient = null;
function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!adminClient) adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return adminClient;
}

let stripeClient = null;
function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

function stripeEnabled() {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID && supabaseAdmin());
}

// The signed-in Supabase user behind the request's bearer token, or null.
async function userFromRequest(req) {
  const admin = supabaseAdmin();
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!admin || !token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user;
}

async function subscriptionFor(userId) {
  const { data } = await supabaseAdmin()
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

async function isPro(userId) {
  const sub = await subscriptionFor(userId);
  return !!sub && PRO_STATUSES.includes(sub.status);
}

// Where Stripe sends people back to. SITE_URL wins so redirects can't be steered by the Host header.
function siteUrl(req) {
  return (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, "");
}

module.exports = { PRO_STATUSES, supabaseAdmin, stripe, stripeEnabled, userFromRequest, subscriptionFor, isPro, siteUrl };
