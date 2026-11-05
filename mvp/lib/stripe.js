// Stripe through its plain web API (no extra package). Runs on the server only: it uses STRIPE_SECRET_KEY,
// which the owner adds in Vercel. Price IDs aren't secret; they're the test-mode prices made on 4 Nov 2026.
export const PRICES = {
  pack: process.env.STRIPE_PRICE_PACK || "price_1UYDzGAYt2KEVvH17KpwB3Eq", // 25 AI answers, $5 one time
  pro: process.env.STRIPE_PRICE_PRO || "price_1UYE0vAYt2KEVvH1b1FmUP8G"    // LJSportMind Pro, $9 a month
};

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
export const testMode = () => String(process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");

// Stripe wants form-encoded bodies with nested keys like line_items[0][price].
function encode(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") encode(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripe(method, path, params) {
  const url = `https://api.stripe.com/v1/${path}${method === "GET" && params ? `?${encode(params)}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : encode(params || {}),
    cache: "no-store",
    signal: AbortSignal.timeout(15000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Stripe error ${res.status}`);
  return data;
}

// A Stripe-hosted checkout page for a pack (one payment) or Pro (monthly subscription).
export function createCheckout({ kind, userId, email, customer, origin }) {
  return stripe("POST", "checkout/sessions", {
    mode: kind === "pro" ? "subscription" : "payment",
    line_items: { 0: { price: PRICES[kind], quantity: 1 } },
    client_reference_id: userId,
    metadata: { kind, user_id: userId },
    ...(customer ? { customer } : { customer_email: email }),
    ...(kind === "pack" && !customer ? { customer_creation: "always" } : {}),
    success_url: `${origin}/billing/done?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=1`
  });
}

export const getCheckout = (id) => stripe("GET", `checkout/sessions/${encodeURIComponent(id)}`, { expand: { 0: "subscription" } });
export const getSubscription = (id) => stripe("GET", `subscriptions/${encodeURIComponent(id)}`);
export const cancelAtPeriodEnd = (id) => stripe("POST", `subscriptions/${encodeURIComponent(id)}`, { cancel_at_period_end: true });
export const resumeSubscription = (id) => stripe("POST", `subscriptions/${encodeURIComponent(id)}`, { cancel_at_period_end: false });

// When the paid month ends. Newer Stripe versions keep it on the subscription item, older ones on the subscription.
export function periodEnd(sub) {
  const t = sub?.current_period_end || sub?.items?.data?.[0]?.current_period_end;
  return t ? new Date(t * 1000).toISOString() : null;
}
