const { stripe, stripeEnabled, userFromRequest, subscriptionFor, siteUrl } = require("./_lib/server");

// Opens Stripe's billing portal so a Pro member can update payment details or cancel.
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const fail = (status, error) => res.status(status).json({ error });

  if (req.method !== "POST") return fail(405, "method_not_allowed");
  if (!stripeEnabled()) return fail(503, "not_configured");

  const user = await userFromRequest(req);
  if (!user) return fail(401, "sign_in_required");

  try {
    const sub = await subscriptionFor(user.id);
    if (!sub || !sub.stripe_customer_id) return fail(404, "no_subscription");
    const session = await stripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl(req)}/?pro=manage`
    });
    return res.status(200).json({ url: session.url });
  } catch {
    return fail(502, "stripe_error");
  }
};
