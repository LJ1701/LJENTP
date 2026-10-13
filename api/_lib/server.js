// Shared helpers for the API functions. Vercel doesn't deploy files under api/_lib as endpoints.
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const Stripe = require("stripe");

const PRO_STATUSES = ["active", "trialing"];

// Accounts (Supabase) are optional. They count as set up only when all three values are present
// and the anon key looks like a real Supabase public key; otherwise Pro runs on Stripe alone.
function accountsEnabled() {
  const anon = String(process.env.SUPABASE_ANON_KEY || "").trim();
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && /^(eyJ|sb_publishable_)/.test(anon));
}

let adminClient = null;
function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!accountsEnabled()) return null;
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
  return !!process.env.STRIPE_SECRET_KEY;
}

// ---- Pro passes (Stripe-only mode) ----
// After checkout the browser gets a signed pass naming its Stripe customer and subscription.
// The signature stops forged passes; the subscription is re-checked with Stripe, so a
// cancelled or unpaid subscription stops counting as Pro.

function passKey() {
  return process.env.PRO_PASS_SECRET || process.env.STRIPE_SECRET_KEY;
}

function signPass(customerId, subscriptionId) {
  const body = Buffer.from(JSON.stringify({ c: customerId, s: subscriptionId })).toString("base64url");
  const sig = crypto.createHmac("sha256", passKey()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function readPass(pass) {
  const [body, sig] = String(pass || "").split(".");
  if (!body || !sig || !passKey()) return null;
  const expected = crypto.createHmac("sha256", passKey()).update(body).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    return data.c && data.s ? { customerId: data.c, subscriptionId: data.s } : null;
  } catch {
    return null;
  }
}

const statusCache = new Map(); // subscriptionId -> { active, at }
async function subscriptionActive(subscriptionId) {
  const hit = statusCache.get(subscriptionId);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.active;
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const active = PRO_STATUSES.includes(sub.status);
  statusCache.set(subscriptionId, { active, at: Date.now() });
  return active;
}

function passFromRequest(req) {
  return readPass(req.headers["x-pro-pass"]);
}

// Pro by pass (Stripe-only) or by signed-in account (Supabase), whichever the request carries.
async function requestIsPro(req) {
  const pass = passFromRequest(req);
  if (pass && stripe()) {
    try {
      if (await subscriptionActive(pass.subscriptionId)) return true;
    } catch {
      // unknown subscription: not Pro
    }
  }
  const user = await userFromRequest(req);
  return !!user && (await isPro(user.id));
}

// The Pro price: STRIPE_PRICE_ID if set; otherwise an existing active $4.99/month USD price in the
// Stripe account; otherwise "LJSportMind Pro" is created once, tagged with a lookup key for reuse.
const PRO_LOOKUP_KEY = "ljsportmind_pro_monthly";
let cachedPriceId = null;

async function proPriceId() {
  if (process.env.STRIPE_PRICE_ID) return process.env.STRIPE_PRICE_ID;
  if (cachedPriceId) return cachedPriceId;
  const client = stripe();
  const tagged = await client.prices.list({ lookup_keys: [PRO_LOOKUP_KEY], active: true, limit: 1 });
  if (tagged.data.length) return (cachedPriceId = tagged.data[0].id);
  const recurring = await client.prices.list({ active: true, type: "recurring", currency: "usd", limit: 100 });
  const match = recurring.data.find((p) => p.unit_amount === 499 && p.recurring && p.recurring.interval === "month" && p.recurring.interval_count === 1);
  if (match) return (cachedPriceId = match.id);
  const created = await client.prices.create({
    currency: "usd",
    unit_amount: 499,
    recurring: { interval: "month" },
    lookup_key: PRO_LOOKUP_KEY,
    product_data: { name: "LJSportMind Pro" }
  });
  return (cachedPriceId = created.id);
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

module.exports = { PRO_STATUSES, accountsEnabled, supabaseAdmin, stripe, stripeEnabled, proPriceId, signPass, readPass, passFromRequest, subscriptionActive, requestIsPro, userFromRequest, subscriptionFor, isPro, siteUrl };
