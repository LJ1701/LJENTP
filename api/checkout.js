const { PRO_STATUSES, stripe, stripeEnabled, proPriceId, userFromRequest, subscriptionFor, siteUrl } = require("./_lib/server");

// Starts a Stripe Checkout for the Pro plan, tied to the signed-in account.
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const fail = (status, error) => res.status(status).json({ error });

  if (req.method !== "POST") return fail(405, "method_not_allowed");
  if (!stripeEnabled()) return fail(503, "not_configured");

  const user = await userFromRequest(req);
  if (!user) return fail(401, "sign_in_required");

  try {
    const existing = await subscriptionFor(user.id);
    if (existing && PRO_STATUSES.includes(existing.status)) return fail(409, "already_pro");

    const base = siteUrl(req);
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: await proPriceId(), quantity: 1 }],
      success_url: `${base}/?pro=success`,
      cancel_url: `${base}/?pro=cancel`,
      client_reference_id: user.id,
      ...(existing && existing.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email }),
      subscription_data: { metadata: { user_id: user.id } },
      metadata: { user_id: user.id },
      allow_promotion_codes: true
    });
    return res.status(200).json({ url: session.url });
  } catch {
    return fail(502, "stripe_error");
  }
};
