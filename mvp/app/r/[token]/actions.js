"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The reference's answer. They must be signed in with an email first (a one-time link proves they own it);
// the database refuses guests, the owner, a second answer, and more than 20 confirmations a day.
export async function answerReference(formData) {
  const token = String(formData.get("token") || "");
  const answer = String(formData.get("answer") || "");
  const note = String(formData.get("note") || "").trim().slice(0, 300);
  if (!/^[0-9a-f]{64}$/.test(token)) redirect("/");
  const supabase = await createClient();
  const { data } = await supabase.rpc("reference_answer", { token, answer, note });
  redirect(`/r/${token}?result=${encodeURIComponent(data || "error")}`);
}

// The person who confirmed can take it back. The claim then shows as "not confirmed yet" again.
export async function withdrawReference(formData) {
  const token = String(formData.get("token") || "");
  if (!/^[0-9a-f]{64}$/.test(token)) redirect("/");
  const supabase = await createClient();
  const { data } = await supabase.rpc("reference_withdraw", { token });
  redirect(`/r/${token}?result=${data === "ok" ? "withdrawn" : "error"}`);
}
