import { randomInt } from "node:crypto";
import { adminClient } from "@/lib/supabase/admin";

// Invite friends: a personal 8-character code per user (made the first time it's needed), kept in billing.
// Returns null when invites aren't set up yet (no service key, or supabase/005_referrals.sql not run).
const CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
export const REF_RE = /^[a-z0-9]{8}$/;
export const REF_COOKIE = "ref";
export const INVITE_BONUS = 5;

export async function getInvite(userId) {
  const db = adminClient();
  if (!db) return null;
  const { data, error } = await db.from("billing").select("ref_code, referrals").eq("user_id", userId).maybeSingle();
  if (error) return null;
  if (data?.ref_code) return { code: data.ref_code, count: data.referrals || 0 };
  for (let tries = 0; tries < 5; tries++) {
    const code = Array.from({ length: 8 }, () => CHARS[randomInt(CHARS.length)]).join("");
    const { error: e } = await db.from("billing").upsert({ user_id: userId, ref_code: code }, { onConflict: "user_id" });
    if (!e) return { code, count: data?.referrals || 0 };
    if (e.code !== "23505") return null; // 23505 = code taken: try another
  }
  return null;
}

// Called when an invited person saves a Passport with an achievement. Both get INVITE_BONUS answers, once.
export async function applyReferral(userId, code) {
  const db = adminClient();
  if (!db || !REF_RE.test(String(code))) return false;
  const { data } = await db.rpc("apply_referral", { p_user: userId, p_code: code });
  return !!data;
}
