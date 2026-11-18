"use server";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { sourceOf } from "@/lib/employer-roles";
import { isCountry } from "@/lib/countries";
import { getT } from "@/lib/i18n-server";

const clean = (v, max) => String(v || "").trim().slice(0, max);
const back = (msg) => redirect(`/employers?error=${encodeURIComponent(msg)}#post`);

// An employer posts a role by linking the posting they already have. Saved as "pending": it only shows
// to candidates after the owner approves it in Supabase (status = 'approved').
export async function postRole(formData) {
  const { t } = await getT();
  if (clean(formData.get("website"), 50)) redirect("/employers?posted=1#post"); // hidden field: bots fill it in
  const company = clean(formData.get("company"), 120);
  const contact_name = clean(formData.get("contact_name"), 100);
  const contact_email = clean(formData.get("contact_email"), 200);
  const role_title = clean(formData.get("role_title"), 120);
  let posting_url = clean(formData.get("posting_url"), 300);
  if (posting_url && !/^https?:\/\//i.test(posting_url)) posting_url = `https://${posting_url}`;
  try { if (!new URL(posting_url).hostname.includes(".")) posting_url = ""; } catch { posting_url = ""; }
  if (!company || !contact_name || !role_title) back(t("employers.missing"));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact_email)) back(t("employers.badEmail"));
  if (!posting_url) back(t("employers.badLink"));
  const country = clean(formData.get("country"), 2);
  const db = adminClient();
  if (!db) back(t("employers.notOn"));
  const { error } = await db.from("employer_roles").insert({
    company, contact_name, contact_email, role_title, posting_url,
    source: sourceOf(posting_url),
    country: isCountry(country) && /^[A-Z]{2}$/.test(country) ? country : "",
    wants_proof: formData.get("wants_proof") === "on"
  });
  if (error) back(t("employers.notOn"));
  redirect("/employers?posted=1#post");
}
