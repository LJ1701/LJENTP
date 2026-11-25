"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const KINDS = ["profile", "role", "story"];
const REASONS = ["fake", "scam", "not_theirs", "other"];

// Anyone (signed in or not) can report a proof page, an employer's role or a story. Reports are private:
// the database lets visitors add one, never read them. The owner reviews them in Table Editor -> reports.
export async function reportContent(formData) {
  const kind = String(formData.get("kind") || "");
  const target = String(formData.get("target") || "").slice(0, 80);
  const reason = String(formData.get("reason") || "");
  const details = String(formData.get("details") || "").trim().slice(0, 500);
  let back = String(formData.get("back") || "/");
  if (!back.startsWith("/") || back.startsWith("//")) back = "/";
  if (String(formData.get("website") || "")) redirect(`${back}${back.includes("?") ? "&" : "?"}reported=1`); // bots fill the hidden field
  if (!KINDS.includes(kind) || !target || !REASONS.includes(reason)) redirect(back);
  const db = await createClient();
  await db.from("reports").insert({ target_kind: kind, target, reason, details });
  redirect(`${back}${back.includes("?") ? "&" : "?"}reported=1`);
}
