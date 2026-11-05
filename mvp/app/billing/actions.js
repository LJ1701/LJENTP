"use server";
import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n-server";
import { createCheckout, cancelAtPeriodEnd, resumeSubscription, stripeEnabled } from "@/lib/stripe";

// Messages in the visitor's language.
const m = async (key, vars) => (await getT()).t(`billing.${key}`, vars);
const clean = (v, max) => String(v || "").trim().slice(0, max);
const back = (path, msg, key = "error") => redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(msg)}`);

async function signedIn(path) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/?next=${encodeURIComponent(path)}#start`);
  return user;
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Buy a 25-answer pack or Pro: sends the user to Stripe's own checkout page (card details never touch our server).
export async function buy(formData) {
  const kind = formData.get("kind") === "pro" ? "pro" : "pack";
  const user = await signedIn("/pricing");
  // A guest account lives only in this browser, so a purchase could be lost. Ask for an email first.
  if (user.is_anonymous) back("/pricing", await m("saveFirst"));
  const db = adminClient();
  if (!db || !stripeEnabled()) back("/pricing", await m("notOn"));
  const { data: row } = await db.from("billing").select("stripe_customer, pro_until").eq("user_id", user.id).maybeSingle();
  if (kind === "pro" && row?.pro_until && new Date(row.pro_until) > new Date()) back("/pricing", await m("alreadyPro"));
  let url;
  try {
    const session = await createCheckout({ kind, userId: user.id, email: user.email, customer: row?.stripe_customer, origin: await origin() });
    url = session.url;
  } catch {
    back("/pricing", await m("checkoutError"));
  }
  redirect(url);
}

// Cancel Pro at the end of the month already paid for (or undo that).
export async function setProRenewal(formData) {
  const user = await signedIn("/pricing");
  const db = adminClient();
  const { data: row } = db ? await db.from("billing").select("stripe_subscription").eq("user_id", user.id).maybeSingle() : { data: null };
  if (!row?.stripe_subscription) back("/pricing", await m("noSub"));
  try {
    if (formData.get("renew") === "1") await resumeSubscription(row.stripe_subscription);
    else await cancelAtPeriodEnd(row.stripe_subscription);
  } catch {
    back("/pricing", await m("stripeError"));
  }
  revalidatePath("/pricing");
  back("/pricing", await m(formData.get("renew") === "1" ? "renews" : "cancelled"), "ok");
}

// A student joins their school's program with its 6-character code: unlimited AI while the program is active.
export async function joinProgram(formData) {
  const from = formData.get("from") === "pricing" ? "/pricing" : "/profile";
  const user = await signedIn(from);
  const code = clean(formData.get("code"), 12).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const db = adminClient();
  if (!db) back(from, await m("programsOff"));
  const { data: program } = await db.from("programs").select("code, name, seats, active_until").eq("code", code).maybeSingle();
  if (!program) back(from, await m("codeNotFound"));
  if (new Date(program.active_until) < new Date()) back(from, await m("programEnded", { name: program.name }));
  const { count } = await db.from("billing").select("user_id", { count: "exact", head: true }).eq("program_code", code).neq("user_id", user.id);
  if ((count || 0) >= program.seats) back(from, await m("programFull", { name: program.name, n: program.seats }));
  const { error } = await db.from("billing").upsert({ user_id: user.id, program_code: code, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) back(from, await m("joinError"));
  revalidatePath(from);
  back(from, await m("joined", { name: program.name }), "ok");
}

export async function leaveProgram() {
  const user = await signedIn("/profile");
  const db = adminClient();
  if (db) await db.from("billing").update({ program_code: null, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  revalidatePath("/profile");
  back("/profile", await m("left"), "ok");
}

// A director starts a free 30-day pilot (30 seats). A paid licence later just extends active_until and seats.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I, so codes are easy to read out
export async function startPilot(formData) {
  const user = await signedIn("/program");
  if (user.is_anonymous) back("/program", await m("pilotGuest"));
  const name = clean(formData.get("name"), 100);
  if (name.length < 2) back("/program", await m("pilotName"));
  const db = adminClient();
  if (!db) back("/program", await m("programsOff"));
  const { data: existing } = await db.from("programs").select("code").eq("director", user.id).maybeSingle();
  if (existing) redirect("/program");
  const until = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  for (let tries = 0; tries < 5; tries++) {
    const code = Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
    const { error } = await db.from("programs").insert({ code, name, director: user.id, seats: 30, plan: "pilot", active_until: until });
    if (!error) { revalidatePath("/program"); redirect("/program?started=1"); }
    if (error.code !== "23505") break; // 23505 = code already taken: try another
  }
  back("/program", await m("pilotError"));
}

// "Request a pilot" from /pricing. Saved for the owner to follow up (schools are invoiced, not charged by card).
export async function requestPilot(formData) {
  const name = clean(formData.get("name"), 100);
  const email = clean(formData.get("email"), 200);
  const organization = clean(formData.get("organization"), 150);
  if (!name || !organization || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back("/pricing", await m("requestMissing"), "pilot_error");
  if (clean(formData.get("website"), 50)) redirect("/pricing?pilot=1#schools"); // hidden field: bots fill it in
  const students = parseInt(formData.get("students"), 10);
  const db = adminClient();
  if (!db) back("/pricing", await m("requestsOff"), "pilot_error");
  const { error } = await db.from("pilot_requests").insert({
    name, email, organization,
    role: clean(formData.get("role"), 100),
    students: Number.isFinite(students) && students > 0 && students < 1000000 ? students : null,
    message: clean(formData.get("message"), 1000)
  });
  if (error) back("/pricing", await m("requestError"), "pilot_error");
  redirect("/pricing?pilot=1#schools");
}
