const { stripe, stripeEnabled, accountsEnabled, userFromRequest, subscriptionFor, passFromRequest, siteUrl } = require("./_lib/server");

// Opens Stripe's billing portal so a Pro member can update payment details or cancel.
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const fail = (status, error) => res.status(status).json({ error });

  if (req.method !== "POST") return fail(405, "method_not_allowed");
  if (!stripeEnabled()) return fail(503, "not_configured");

  try {
    let customer = null;
    const pass = passFromRequest(req);
    if (pass) {
      customer = pass.customerId;
    } else if (accountsEnabled()) {
      const user = await userFromRequest(req);
      if (!user) return fail(401, "sign_in_required");
      const sub = await subscriptionFor(user.id);
      customer = sub && sub.stripe_customer_id;
    }
    if (!customer) return fail(404, "no_subscription");
    const session = await stripe().billingPortal.sessions.create({ customer, return_url: `${siteUrl(req)}/?pro=manage` });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("portal.js stripe error:", err && err.type, err && err.code, err && err.statusCode);
    return fail(502, "stripe_error");
  }
};
