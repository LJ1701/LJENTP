"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SKILLS, INTERESTS, SPORTS, CAREER_PATHS, buildPlanSteps, topMatches, label } from "@/lib/careers";
import { effectiveProfile } from "@/lib/detect";
import { honestBullets, coachReply } from "@/lib/gemini";
import { searchJobs, searchLinks, jobsEnabled } from "@/lib/jobs";
import { fitCheck } from "@/lib/fit";
import { quickIntent, parseJobs } from "@/lib/intent";
import { resumeFileText } from "@/lib/resume-file";
import { canUseAi, spendAnswer, OUT_OF_ANSWERS } from "@/lib/billing";

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
  const { data: profile } = await supabase.from("sports_profiles").select("skills, interests, achievements").eq("user_id", user.id).maybeSingle();
  // Skills found in achievements count as "have", so the plan doesn't ask the user to build them again.
  await supabase.from("plans").upsert({ user_id: user.id, role_idx: idx, steps: buildPlanSteps(idx, effectiveProfile(profile)), updated_at: new Date().toISOString() });
  revalidatePath("/profile");
  redirect("/profile#path");
}

// Uploaded résumé file (PDF, Word or text) to plain text for the résumé filler. Nothing is saved here:
// the text goes back to the page, where the user checks the filled-in Passport before saving.
const RESUME_ERRORS = {
  empty: "That file looks empty. Try another one.",
  big: "That file is over 4 MB. Try a smaller PDF or a Word file.",
  type: "Use a PDF, Word (.docx) or text (.txt) file. Old .doc files: save as .docx first.",
  unreadable: "Couldn't read any text in that file. If it's a scanned image, paste the text instead.",
  noKey: "PDF reading isn't switched on yet. Upload a Word file or paste the text instead.",
  limit: "The AI has used up today's free PDF reads. Upload a Word file or paste the text instead.",
  slow: "Reading that PDF took too long. Try again, or paste the text instead.",
  error: "Couldn't read that PDF right now. Try again, or paste the text instead."
};

export async function readResumeFile(formData) {
  const { user } = await currentUser();
  const file = formData.get("file");
  // Word and text files are read without AI (free). A PDF read by the AI counts as one AI answer.
  if (/\.pdf$/i.test(String(file?.name || "")) && !(await canUseAi(user.id))) {
    return { error: "You've used this month's free AI answers, so PDFs can't be read right now. Upload a Word file or paste the text (both free), or see plans at /pricing.", upgrade: true };
  }
  const res = await resumeFileText(file);
  if (res.via === "ai") await spendAnswer(user.id);
  return res.error ? { error: RESUME_ERRORS[res.error] || RESUME_ERRORS.error } : res;
}

// AI résumé bullets from the user's SAVED achievements (read on the server, sent to Gemini on the server).
export async function writeBullets() {
  const { supabase, user } = await currentUser();
  const { data: profile } = await supabase.from("sports_profiles").select("achievements").eq("user_id", user.id).maybeSingle();
  if (!(await canUseAi(user.id))) return { error: OUT_OF_ANSWERS, upgrade: true };
  const res = await honestBullets(profile && profile.achievements);
  if (!res.error) await spendAnswer(user.id);
  return res;
}

// Career Coach: the profile, matches and plan are read here from the database (never sent by the browser),
// so the coach only ever knows this user's own saved data. Limits keep one visitor from using up the free quota.
const MAX_TURNS = 10;
const MAX_CHARS = 500;

export async function askCoach(history, mode) {
  const { supabase, user } = await currentUser();
  const turns = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === "user" || m.role === "coach") && typeof m.text === "string")
    .map((m) => ({ role: m.role, text: m.text.slice(0, m.role === "user" ? MAX_CHARS : 2000) }))
    .slice(-16);
  if (!turns.length || turns[turns.length - 1].role !== "user" || !turns[turns.length - 1].text.trim()) return { error: "Type a question first." };
  if (turns.filter((m) => m.role === "user").length > MAX_TURNS) return { error: `That's the ${MAX_TURNS}-message limit for this visit. Refresh the page to start a new chat.` };

  const [{ data: profile }, { data: plan }] = await Promise.all([
    supabase.from("sports_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("plans").select("*").eq("user_id", user.id).maybeSingle()
  ]);
  // No Passport yet (a new guest): Goldie can still answer and help them fill in step 1.
  const p = profile || {};
  const eff = effectiveProfile(profile);
  const achievements = String(p.achievements || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const matches = profile ? topMatches(eff) : [];
  const target = plan ? CAREER_PATHS[plan.role_idx] : null;
  if (mode === "interview" && !target) return { error: "Pick a target role under your matches first; interview practice uses it." };

  const contextText = [
    profile ? "" : "NO PASSPORT SAVED YET: help them fill in step 1 first.",
    `NAME: ${p.full_name || "(not given)"}`,
    `ROLE: ${p.role || "(not given)"} | SPORT: ${p.sport || "(not given)"} | CITY: ${p.location || "(not given)"}`,
    `GOAL: ${p.goal || "(not given)"}`,
    `SKILLS: ${eff.skills.map(label).join(", ") || "(none)"}`,
    `INTERESTS: ${eff.interests.map(label).join(", ") || "(none)"}`,
    `ACHIEVEMENTS (quote these exactly as evidence):\n${achievements.map((l) => `- ${l}`).join("\n") || "(none yet)"}`,
    `TOP MATCHES: ${matches.map((m) => `${m.name} (${m.strength}; has ${m.matched.map(label).join(", ")}; missing ${m.gaps.map(label).join(", ") || "nothing"})`).join(" | ") || "(none yet)"}`,
    `TARGET ROLE: ${target ? target.name : "(not chosen)"}`,
    `PLAN: ${plan ? plan.steps.map((s, i) => `${i + 1}. [${s.done ? "done" : "to do"}] ${s.text}`).join(" ") : "(no plan yet)"}`,
    `CAREER PATHS (use the number for suggest_role): ${CAREER_PATHS.map((c, i) => `${i}=${c.name}`).join(", ")}`
  ].filter(Boolean).join("\n");

  // Simple requests (find jobs or internships, go to a step, take the tour) are answered by rules, with no AI call.
  if (mode !== "interview") {
    const quick = quickIntent(turns[turns.length - 1].text, p.location);
    if (quick) return quickAnswer(quick, profile, plan);
  }

  // Real questions use the AI, which counts against the monthly allowance (instant answers above don't).
  if (!(await canUseAi(user.id))) return { error: OUT_OF_ANSWERS, upgrade: true };
  const res = await coachReply({ profileText: "USER DATA:\n" + contextText, achievements, contextText }, turns, mode === "interview" ? "interview" : "ask");
  // AI busy, slow or out of free answers: the chat offers the things that work without it.
  if (res.error) return { ...res, offline: true };
  await spendAnswer(user.id);
  // Asked for jobs or internships: Goldie's reply already says what to search, so the real postings are
  // fetched right here and shown in the chat (no second AI call).
  if (res.action === "search_jobs") {
    const where = res.jobLocation;
    const summary = res.actionQuery || `${res.jobKeywords || "Sports"} ${/intern/i.test(res.jobKeywords) ? "" : "jobs "}${where ? `near ${where}` : "anywhere in the US"}`;
    res.jobs = await jobResults({ keywords: res.jobKeywords, location: where, summary }, profile);
  }
  return res;
}

// An instant answer in the same shape as an AI reply, marked "instant" so the chat can say no AI was used.
async function quickAnswer(quick, profile, plan) {
  const base = { evidence: [], droppedEvidence: 0, unverified: [], nextStep: "", suggestRole: -1, instant: true, action: quick.action, actionQuery: "" };
  if (quick.action === "start_tour") {
    return { ...base, reply: "Let's go! Follow my bubble through the steps.", followUps: ["Find sports internships", "Find sports jobs anywhere"] };
  }
  if (quick.action !== "search_jobs") {
    return { ...base, reply: `Here's ${quick.label}.`, followUps: [plan ? "What should I do first on my plan?" : "Which match should I pick as my target?", "Find sports internships"] };
  }
  const q = quick.query;
  const intern = /intern/i.test(q.keywords);
  const jobs = await jobResults(q, profile);
  const found = jobs.jobs && jobs.jobs.length;
  return {
    ...base,
    actionQuery: q.summary,
    reply: !found ? "I couldn't reach the job sources just now. These searches open real postings:"
      : jobs.query.summary !== q.summary ? `Nothing open for ${q.summary.toLowerCase()} right now, so here's every sports ${intern ? "internship" : "job"} I can find.`
      : `Here's what's open: ${q.summary.charAt(0).toLowerCase()}${q.summary.slice(1)}. Tap Fit check on any posting to see what you can already prove.`,
    jobs,
    followUps: [found ? "Which of these fits me best?" : "Find sports jobs anywhere", intern ? "Find full-time sports jobs" : "Find sports internships", plan ? "Take me to my plan" : "Show my matches"]
  };
}

// Switches the public proof link on or off. The first time it goes on, a random 10-character code is made.
export async function setPublic(formData) {
  const { supabase, user } = await currentUser();
  const on = formData.get("on") === "1";
  const { data: profile } = await supabase.from("sports_profiles").select("public_code").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect(`/profile?error=${encodeURIComponent("Save your profile first.")}`);
  const update = { is_public: on };
  if (on && !profile.public_code) update.public_code = randomBytes(5).toString("hex"); // 10 lowercase hex characters
  const { error } = await supabase.from("sports_profiles").update(update).eq("user_id", user.id);
  if (error) redirect(`/profile?error=${encodeURIComponent("Couldn't change the public link. Try again.")}`);
  revalidatePath("/profile");
  redirect("/profile#proof");
}

// Ticks a plan step. A note about what they did is saved as a new achievement line, so the plan builds proof.
export async function completeStep(i, note) {
  const { supabase, user } = await currentUser();
  const { data: plan } = await supabase.from("plans").select("steps").eq("user_id", user.id).maybeSingle();
  if (!plan || !plan.steps[i]) return { error: "That step wasn't found. Refresh the page." };
  const steps = plan.steps.map((s, n) => (n === i ? { ...s, done: true } : s));
  const { error } = await supabase.from("plans").update({ steps, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  if (error) return { error: "Couldn't save that step. Try again." };
  const line = clean(note, 200).replace(/\s+/g, " ");
  let added = false;
  if (line) {
    const { data: profile } = await supabase.from("sports_profiles").select("achievements").eq("user_id", user.id).maybeSingle();
    const current = String((profile && profile.achievements) || "").trim();
    const exists = current.split("\n").some((l) => l.trim().toLowerCase() === line.toLowerCase());
    if (profile && !exists && (current + "\n" + line).length <= 4000) {
      const { error: e2 } = await supabase.from("sports_profiles").update({ achievements: current ? `${current}\n${line}` : line, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      added = !e2;
    }
  }
  revalidatePath("/profile");
  return { ok: true, added };
}

export async function undoStep(i) {
  const { supabase, user } = await currentUser();
  const { data: plan } = await supabase.from("plans").select("steps").eq("user_id", user.id).maybeSingle();
  if (!plan || !plan.steps[i]) return { error: "That step wasn't found." };
  const steps = plan.steps.map((s, n) => (n === i ? { ...s, done: false } : s));
  await supabase.from("plans").update({ steps, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  revalidatePath("/profile");
  return { ok: true };
}

// Job search: plain rules read the request, Adzuna and sports employers' career boards supply the real postings,
// and each posting gets a fit check against the user's own saved evidence.
async function jobResults(q, profile) {
  const links = searchLinks(q.keywords, q.location);
  let res = await searchJobs(q);
  // Nothing for the exact words ("video internships")? Widen to every sports internship (or job) anywhere,
  // and say so, rather than coming back empty.
  const wide = /intern/i.test(q.keywords) ? "internship" : "";
  if ((res.error || !res.jobs.length) && (q.keywords !== wide || q.location)) {
    const wider = await searchJobs({ keywords: wide, location: "" });
    if (!wider.error && wider.jobs.length) {
      res = wider;
      q = { ...q, summary: `No exact matches for "${q.summary}", so here are all sports ${wide ? "internships" : "jobs"} anywhere` };
    }
  }
  if (res.error) return { query: q, links, error: res.error, enabled: jobsEnabled() };
  const jobs = res.jobs.map((j) => ({ ...j, fit: fitCheck(`${j.title}. ${j.team || ""}. ${j.snippet}`, profile) }));
  return { query: q, links, jobs, total: res.total };
}

export async function findJobs(text) {
  const { supabase, user } = await currentUser();
  const request = String(text || "").trim().slice(0, 200) || "sports jobs that fit me";
  const { data: profile } = await supabase.from("sports_profiles").select("*").eq("user_id", user.id).maybeSingle();
  // Read with plain rules (no AI call), so searching works even when the AI is busy.
  return jobResults(parseJobs(request, profile && profile.location), profile);
}

// Fit check for a pasted job posting.
export async function checkFit(text) {
  const { supabase, user } = await currentUser();
  const posting = String(text || "").trim().slice(0, 8000);
  if (posting.length < 40) return { error: "Paste the full job posting (at least a few sentences)." };
  const { data: profile } = await supabase.from("sports_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile) return { error: "Save your Sports Passport first." };
  const fit = fitCheck(posting, profile);
  if (!fit.total) return { error: "No skills from our list were found in that posting. Try pasting the requirements section." };
  return { fit };
}

// Adds "Build <skill>" to the saved plan, from a gap found by the fit check.
export async function addGapToPlan(tag) {
  const { supabase, user } = await currentUser();
  if (!SKILLS[tag]) return { error: "Unknown skill." };
  const { data: plan } = await supabase.from("plans").select("steps").eq("user_id", user.id).maybeSingle();
  if (!plan) return { error: "Pick a target role first; then gaps can go into your plan." };
  const text = `Build ${label(tag)}: get one project or experience that shows it.`;
  if (plan.steps.some((s) => s.text === text)) return { ok: true, already: true };
  const { error } = await supabase.from("plans").update({ steps: [...plan.steps.slice(0, -1), { text, done: false }, plan.steps[plan.steps.length - 1]], updated_at: new Date().toISOString() }).eq("user_id", user.id);
  if (error) return { error: "Couldn't update your plan. Try again." };
  revalidatePath("/profile");
  return { ok: true };
}
