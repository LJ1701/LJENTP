"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCountry } from "@/lib/countries";
import { getT } from "@/lib/i18n-server";
import { FIELDS, PAY_RANGES, cleanSteps } from "@/lib/stories";

const clean = (v, max) => String(v || "").trim().slice(0, max);
const back = (msg) => redirect(`/stories/new?error=${encodeURIComponent(msg)}#form`);

// Save (or update) the signed-in person's own story. Always saved as 'pending': the owner approves it in
// Supabase before anyone else sees it, and any edit sends it back for approval.
export async function saveStory(formData) {
  const { t } = await getT();
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) back(t("stories.saveFirst"));

  const display_name = clean(formData.get("display_name"), 60);
  const role_title = clean(formData.get("role_title"), 120);
  const field = FIELDS.includes(formData.get("field")) ? formData.get("field") : "other";
  const country = clean(formData.get("country"), 2);
  const steps = cleanSteps(formData.getAll("step_kind"), formData.getAll("step_year"), formData.getAll("step_text"));
  const v = formData.get("vouched");
  const pay = formData.get("pay_range");
  if (!display_name || !role_title) back(t("stories.missing"));
  if (!steps.length) back(t("stories.needStep"));

  const row = {
    user_id: user.id, display_name, role_title, field,
    country: isCountry(country) && /^[A-Z]{2}$/.test(country) ? country : "",
    steps,
    helped: clean(formData.get("helped"), 500),
    vouched: v === "yes" ? true : v === "no" ? false : null,
    advice: clean(formData.get("advice"), 1000),
    pay_range: PAY_RANGES.includes(pay) ? pay : "",
    link_proof: formData.get("link_proof") === "on",
    status: "pending",
    updated_at: new Date().toISOString()
  };
  const { error } = await db.from("stories").upsert(row, { onConflict: "user_id" });
  if (error) back(t("stories.notOn"));
  redirect("/stories/new?saved=1#form");
}

export async function deleteStory() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (user) await db.from("stories").delete().eq("user_id", user.id);
  redirect("/stories/new?deleted=1#form");
}

// "Ask for feedback" demand test: joins a waitlist for paid feedback from this story's author.
// Nothing is charged and nothing is sent to the author.
export async function joinWaitlist(formData) {
  const id = clean(formData.get("story_id"), 40);
  if (!/^[0-9a-f-]{36}$/.test(id)) redirect("/stories");
  if (clean(formData.get("website"), 50)) redirect(`/stories/${id}?asked=1#ask`); // hidden field: bots fill it in
  const email = clean(formData.get("email"), 200);
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  await db.from("feedback_waitlist").insert({
    story_id: id,
    user_id: user ? user.id : null,
    email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : ""
  }); // a second click by the same person is ignored by the database
  redirect(`/stories/${id}?asked=1#ask`);
}
