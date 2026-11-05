import { adminClient } from "@/lib/supabase/admin";
import { getSubscription, periodEnd, stripeEnabled } from "@/lib/stripe";

// The AI allowance. Free accounts get FREE_ANSWERS AI answers a month (Goldie's AI replies, résumé bullets,
// PDF résumé reads). Job search, fit checks and Goldie's instant (no-AI) answers stay free and unlimited.
export const FREE_ANSWERS = 20;
export const month = () => new Date().toISOString().slice(0, 7); // e.g. "2026-11" (UTC)

export const OUT_OF_ANSWERS = `You've used your ${FREE_ANSWERS} free AI answers this month. Get 25 more for $5, go Pro for unlimited, or join your school's program with its code.`;

// Pro that has passed its end date: ask Stripe whether the subscription renewed, and move the date on if so.
async function refreshPro(db, row) {
  if (!row?.stripe_subscription || !stripeEnabled()) return row;
  if (row.pro_until && new Date(row.pro_until) > new Date()) return row;
  try {
    const sub = await getSubscription(row.stripe_subscription);
    const end = periodEnd(sub);
    if (["active", "trialing"].includes(sub.status) && end && end !== row.pro_until) {
      await db.from("billing").update({ pro_until: end, updated_at: new Date().toISOString() }).eq("user_id", row.user_id);
      return { ...row, pro_until: end };
    }
  } catch { /* Stripe unreachable: keep what we have */ }
  return row;
}

// Everything the pages need to show: what's left, and why. ready=false means billing isn't set up yet
// (no service key or the SQL hasn't been run), in which case AI isn't metered at all.
export async function billingStatus(userId) {
  const db = adminClient();
  if (!db) return { ready: false };
  const { data, error } = await db.from("billing").select("*, programs(name, active_until)").eq("user_id", userId).maybeSingle();
  if (error) return { ready: false };
  const row = await refreshPro(db, data);
  const now = new Date();
  const pro = !!(row?.pro_until && new Date(row.pro_until) > now);
  const program = row?.program_code && row.programs && new Date(row.programs.active_until) > now
    ? { code: row.program_code, name: row.programs.name, until: row.programs.active_until } : null;
  const used = row && row.month === month() ? row.used : 0;
  return {
    ready: true,
    unlimited: pro || !!program,
    pro, proUntil: row?.pro_until || null, subscription: row?.stripe_subscription || null,
    program,
    freeLeft: Math.max(0, FREE_ANSWERS - used),
    packLeft: row?.pack_credits || 0
  };
}

// Before an AI call: is there an answer left? (Cheap read; the real count happens in spendAnswer.)
export async function canUseAi(userId) {
  const s = await billingStatus(userId);
  return !s.ready || s.unlimited || s.freeLeft > 0 || s.packLeft > 0;
}

// After a successful AI answer: count it (atomically, in the database).
export async function spendAnswer(userId) {
  const db = adminClient();
  if (!db) return;
  await db.rpc("spend_ai_answer", { p_user: userId, p_month: month(), p_free: FREE_ANSWERS });
}
