"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SKILLS, INTERESTS, SPORTS, buildPlanSteps } from "@/lib/careers";

// Server actions: they run on the server as the signed-in user, so row level security applies.
async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return { supabase, user };
}

const clean = (v, max) => String(v || "").trim().slice(0, max);

export async function saveProfile(formData) {
  const { supabase, user } = await currentUser();
  const sport = clean(formData.get("sport"), 40);
  const { error } = await supabase.from("sports_profiles").upsert({
    user_id: user.id,
    full_name: clean(formData.get("full_name"), 100),
    location: clean(formData.get("location"), 100),
    role: clean(formData.get("role"), 40),
    sport: SPORTS.includes(sport) ? sport : "",
    skills: formData.getAll("skills").filter((s) => SKILLS[s]),
    interests: formData.getAll("interests").filter((s) => INTERESTS[s]),
    goal: clean(formData.get("goal"), 200),
    achievements: clean(formData.get("achievements"), 4000),
    updated_at: new Date().toISOString()
  });
  if (error) redirect(`/profile?error=${encodeURIComponent("Couldn't save your profile. Try again.")}`);
  revalidatePath("/profile");
  redirect("/profile?saved=1");
}

export async function setTarget(formData) {
  const { supabase, user } = await currentUser();
  const idx = Number(formData.get("role_idx"));
  if (!Number.isInteger(idx) || idx < 0 || idx > 7) return;
  const { data: profile } = await supabase.from("sports_profiles").select("skills").eq("user_id", user.id).maybeSingle();
  await supabase.from("plans").upsert({ user_id: user.id, role_idx: idx, steps: buildPlanSteps(idx, profile), updated_at: new Date().toISOString() });
  revalidatePath("/profile");
  redirect("/profile#plan");
}

export async function toggleStep(formData) {
  const { supabase, user } = await currentUser();
  const i = Number(formData.get("step"));
  const { data: plan } = await supabase.from("plans").select("steps").eq("user_id", user.id).maybeSingle();
  if (!plan || !plan.steps[i]) return;
  const steps = plan.steps.map((s, n) => (n === i ? { ...s, done: !s.done } : s));
  await supabase.from("plans").update({ steps, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  revalidatePath("/profile");
  redirect("/profile#plan");
}
