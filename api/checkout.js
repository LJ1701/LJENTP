const { PRO_STATUSES, accountsEnabled, stripe, stripeEnabled, proPriceId, userFromRequest, subscriptionFor, passFromRequest, subscriptionActive, siteUrl } = require("./_lib/server");

// Starts a Stripe Checkout for the Pro plan. With accounts set up it's tied to the signed-in user;
// without them anyone can buy, and the browser receives a Pro pass after paying (see api/pro.js).
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const fail = (status, error) => res.status(status).json({ error });

  if (req.method !== "POST") return fail(405, "method_not_allowed");
  if (!stripeEnabled()) return fail(503, "not_configured");

  try {
    const pass = passFromRequest(req);
    if (pass && (await subscriptionActive(pass.subscriptionId).catch(() => false))) return fail(409, "already_pro");

    const base = siteUrl(req);
    const params = {
      mode: "subscription",
      line_items: [{ price: await proPriceId(), quantity: 1 }],
      success_url: `${base}/?pro=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?pro=cancel`,
      allow_promotion_codes: true
    };

    // Stripe Tax: switch on with STRIPE_AUTOMATIC_TAX=true only after Tax is set up in the
    // Stripe dashboard (origin address + registrations); before that, Checkout would refuse it.
    const automaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";
    if (automaticTax) {
      params.automatic_tax = { enabled: true };
      params.billing_address_collection = "required";
    }

    if (accountsEnabled()) {
      const user = await userFromRequest(req);
      if (!user) return fail(401, "sign_in_required");
      const existing = await subscriptionFor(user.id);
      if (existing && PRO_STATUSES.includes(existing.status)) return fail(409, "already_pro");
      Object.assign(params, {
        client_reference_id: user.id,
        ...(existing && existing.stripe_customer_id
          ? { customer: existing.stripe_customer_id, ...(automaticTax ? { customer_update: { address: "auto" } } : {}) }
          : { customer_email: user.email }),
        subscription_data: { metadata: { user_id: user.id } },
        metadata: { user_id: user.id }
      });
    }

    const session = await stripe().checkout.sessions.create(params);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("checkout.js stripe error:", err && err.type, err && err.code, err && err.statusCode);
    return fail(502, "stripe_error");
  }
};
