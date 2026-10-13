const { stripe, supabaseAdmin } = require("./_lib/server");

// Stripe signs the exact bytes it sent, so the body must be read raw, never parsed.
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Newer Stripe API versions keep the billing period on the subscription item.
function periodEnd(sub) {
  const seconds = sub.current_period_end || (sub.items && sub.items.data[0] && sub.items.data[0].current_period_end);
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function saveSubscription(userId, sub) {
  if (!userId) return;
  const { error } = await supabaseAdmin().from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: periodEnd(sub),
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

const handler = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const client = stripe();
  if (!client || !process.env.STRIPE_WEBHOOK_SECRET || !supabaseAdmin()) return res.status(503).end();

  let event;
  try {
    event = client.webhooks.constructEvent(await readRawBody(req), req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).end();
  }

  try {
    const obj = event.data.object;
    if (event.type === "checkout.session.completed" && obj.mode === "subscription") {
      const sub = await client.subscriptions.retrieve(obj.subscription);
      await saveSubscription(obj.client_reference_id || sub.metadata.user_id, sub);
    } else if (event.type.startsWith("customer.subscription.")) {
      await saveSubscription(obj.metadata && obj.metadata.user_id, obj);
    }
  } catch {
    return res.status(500).end(); // Stripe retries failed deliveries.
  }
  return res.status(200).json({ received: true });
};

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
