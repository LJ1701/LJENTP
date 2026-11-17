"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The reference's answer. Runs as whoever opened the link (usually signed out). The database refuses a
// second answer, and refuses the owner answering their own request while signed in.
export async function answerReference(formData) {
  const token = String(formData.get("token") || "");
  const answer = String(formData.get("answer") || "");
  const note = String(formData.get("note") || "").trim().slice(0, 300);
  if (!/^[0-9a-f]{64}$/.test(token)) redirect("/");
  const supabase = await createClient();
  const { data } = await supabase.rpc("reference_answer", { token, answer, note });
  redirect(`/r/${token}?result=${encodeURIComponent(data || "error")}`);
}
