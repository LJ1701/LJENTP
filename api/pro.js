const { stripe, stripeEnabled, signPass, passFromRequest, subscriptionActive } = require("./_lib/server");

// Pro status without accounts.
//   { sessionId }  -> after checkout: confirms the payment with Stripe and returns a signed Pro pass.
//   x-pro-pass     -> later visits: reports whether that pass's subscription is still active.
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const fail = (status, error) => res.status(status).json({ error });

  if (req.method !== "POST") return fail(405, "method_not_allowed");
  if (!stripeEnabled()) return fail(503, "not_configured");

  const body = req.body && typeof req.body === "object" ? req.body : {};
  try {
    const sessionId = String(body.sessionId || "");
    if (sessionId) {
      if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return fail(400, "bad_session");
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      if (session.mode !== "subscription" || session.status !== "complete" || !session.subscription) return res.status(200).json({ pro: false });
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
      const active = await subscriptionActive(subscriptionId);
      return res.status(200).json(active ? { pro: true, pass: signPass(customerId, subscriptionId) } : { pro: false });
    }

    const pass = passFromRequest(req);
    if (!pass) return res.status(200).json({ pro: false });
    return res.status(200).json({ pro: await subscriptionActive(pass.subscriptionId) });
  } catch (err) {
    console.error("pro.js stripe error:", err && err.type, err && err.code, err && err.statusCode);
    return fail(502, "stripe_error");
  }
};
