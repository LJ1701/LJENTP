import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getCheckout, periodEnd } from "@/lib/stripe";
import { getT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("paid.metaTitle") };
}

// Stripe sends the buyer here after paying. We never trust the link itself: the checkout is looked up with
// Stripe, must belong to this user and be paid, and is applied once only (the database refuses repeats).
export default async function PaymentDone({ searchParams }) {
  const { session_id } = await searchParams;
  const { t } = await getT();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let message = t("paid.failed");
  let ok = false;
  try {
    const db = adminClient();
    const s = /^cs_[A-Za-z0-9_]+$/.test(String(session_id)) && db ? await getCheckout(session_id) : null;
    const kind = s?.metadata?.kind;
    if (s && s.client_reference_id === user.id && s.status === "complete" && (kind === "pack" || kind === "pro")) {
      const paid = kind === "pack" ? s.payment_status === "paid" : ["active", "trialing"].includes(s.subscription?.status);
      if (paid) {
        const customer = typeof s.customer === "string" ? s.customer : s.customer?.id || null;
        const { error } = await db.rpc("apply_payment", {
          p_session: s.id, p_user: user.id, p_kind: kind,
          p_pro_until: kind === "pro" ? periodEnd(s.subscription) : null,
          p_customer: customer, p_subscription: kind === "pro" ? s.subscription.id : null
        });
        if (!error) {
          ok = true;
          message = kind === "pack" ? t("paid.pack") : t("paid.pro");
        }
      }
    }
  } catch { /* falls through to the "couldn't confirm" message */ }

  return (
    <div className="card" style={{ textAlign: "center", marginTop: 24 }}>
      <h1>{ok ? <span className="gold-text">{t("paid.thanks")}</span> : t("paid.title")}</h1>
      <p className={ok ? "ok" : "error"}>{message}</p>
      <a className="cta" href="/profile">{t("paid.back")}</a>
      <p><small><a href="/pricing">{t("paid.seePlan")}</a></small></p>
    </div>
  );
}
