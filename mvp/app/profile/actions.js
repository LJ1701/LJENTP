"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SKILLS, INTERESTS, SPORTS, CAREER_PATHS, buildPlanSteps, topMatches, label, gapStepIn, pathName } from "@/lib/careers";
import { effectiveProfile } from "@/lib/detect";
import { honestBullets, coachReply } from "@/lib/gemini";
import { searchJobs, searchLinks, jobsEnabled } from "@/lib/jobs";
import { fitCheck } from "@/lib/fit";
import { quickIntent, parseJobs } from "@/lib/intent";
import { resumeFileText } from "@/lib/resume-file";
import { canUseAi, spendAnswer, FREE_ANSWERS } from "@/lib/billing";
import { getT, getCountry, dictFor } from "@/lib/i18n-server";
import { ADZUNA, countryName } from "@/lib/countries";

// Server actions: they run on the server as the signed-in user, so row level security applies.
async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return { supabase, user };
}

const clean = (v, max) => String(v || "").trim().slice(0, max);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Language and country for this request: t() for words, plus a writer for search labels
// ("Marketing internships in Spain", "Prácticas de marketing en España").
async function context() {
  const [{ t, lang, dict }, country] = await Promise.all([getT(), getCountry()]);
  const place = country === "ANY" ? "" : countryName(country, lang);
  const summarize = ({ kw, intern, location }) => {
    const what = kw ? t(intern ? "search.sumInterns" : "search.sumJobs", { kw }) : t(intern ? "search.sportsInterns" : "search.sportsJobs");
    const where = location ? t("search.near", { place: location }) : place ? t("search.inCountry", { country: place }) : t("search.everywhere");
    return `${cap(what)} ${where}`;
  };
  return { t, lang, dict, country, place, summarize };
}

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
  if (error) redirect(`/profile?error=${encodeURIComponent((await getT()).t("profile.saveError"))}`);
  revalidatePath("/profile");
  redirect("/profile?saved=1");
}

export async function setTarget(formData) {
  const { supabase, user } = await currentUser();
  const idx = Number(formData.get("role_idx"));
  if (!Number.isInteger(idx) || idx < 0 || idx > 7) return;
  const { data: profile } = await supabase.from("sports_profiles").select("skills, interests, achievements").eq("user_id", user.id).maybeSingle();
  // Skills found in achievements count as "have", so the plan doesn't ask the user to build them again.
  await supabase.from("plans").upsert({ user_id: user.id, role_idx: idx, steps: buildPlanSteps(idx, effectiveProfile(profile), dictFor("en")), updated_at: new Date().toISOString() });
  revalidatePath("/profile");
  redirect("/profile#path");
}

// Uploaded résumé file (PDF, Word or text) to plain text for the résumé filler. Nothing is saved here:
// the text goes back to the page, where the user checks the filled-in Passport before saving.
export async function readResumeFile(formData) {
  const { user } = await currentUser();
  const { t } = await getT();
  const file = formData.get("file");
  // Word and text files are read without AI (free). A PDF read by the AI counts as one AI answer.
  if (/\.pdf$/i.test(String(file?.name || "")) && !(await canUseAi(user.id))) return { error: t("upload.outOfAnswers"), upgrade: true };
  const res = await resumeFileText(file);
  if (res.via === "ai") await spendAnswer(user.id);
  return res.error ? { error: t(`upload.${res.error}`) } : res;
}

// AI résumé bullets from the user's SAVED achievements (read on the server, sent to Gemini on the server).
export async function writeBullets() {
  const { supabase, user } = await currentUser();
  const { data: profile } = await supabase.from("sports_profiles").select("achievements").eq("user_id", user.id).maybeSingle();
  const { t, lang } = await getT();
  if (!(await canUseAi(user.id))) return { error: t("billing.outOfAnswers", { n: FREE_ANSWERS }), upgrade: true };
  const res = await honestBullets(profile && profile.achievements, lang);
  if (res.error) return { error: t(`ai.${res.error}`) };
  await spendAnswer(user.id);
  return res;
}

// Career Coach: the profile, matches and plan are read here from the database (never sent by the browser),
// so the coach only ever knows this user's own saved data. Limits keep one visitor from using up the free quota.
const MAX_TURNS = 10;
const MAX_CHARS = 500;

export async function askCoach(history, mode) {
  const { supabase, user } = await currentUser();
  const ctx = await context();
  const { t } = ctx;
  const turns = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === "user" || m.role === "coach") && typeof m.text === "string")
    .map((m) => ({ role: m.role, text: m.text.slice(0, m.role === "user" ? MAX_CHARS : 2000) }))
    .slice(-16);
  if (!turns.length || turns[turns.length - 1].role !== "user" || !turns[turns.length - 1].text.trim()) return { error: t("coach.typeFirst") };
  if (turns.filter((m) => m.role === "user").length > MAX_TURNS) return { error: t("coach.limit", { n: MAX_TURNS }) };

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
  if (mode === "interview" && !target) return { error: t("coach.needsTarget") };

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
    `JOB SEARCH COUNTRY: ${ctx.place || "any country"}`,
    `CAREER PATHS (use the number for suggest_role): ${CAREER_PATHS.map((c, i) => `${i}=${c.name}`).join(", ")}`
  ].filter(Boolean).join("\n");

  // Simple requests (find jobs or internships, go to a step, take the tour) are answered by rules, with no AI call.
  if (mode !== "interview") {
    const quick = quickIntent(turns[turns.length - 1].text, p.location, ctx.summarize);
    if (quick) return quickAnswer(quick, profile, plan, ctx);
  }

  // Real questions use the AI, which counts against the monthly allowance (instant answers above don't).
  if (!(await canUseAi(user.id))) return { error: t("billing.outOfAnswers", { n: FREE_ANSWERS }), upgrade: true };
  const res = await coachReply({ profileText: "USER DATA:\n" + contextText, achievements, contextText }, turns, mode === "interview" ? "interview" : "ask", ctx.lang);
  // AI busy, slow or out of free answers: the chat offers the things that work without it.
  if (res.error) return { error: t(`ai.${res.error}`), offline: true };
  await spendAnswer(user.id);
  // Asked for jobs or internships: Goldie's reply already says what to search, so the real postings are
  // fetched right here and shown in the chat (no second AI call).
  if (res.action === "search_jobs") {
    const intern = /intern/i.test(res.jobKeywords);
    const kw = res.jobKeywords.replace(/\bintern(ship)?s?\b/gi, "").trim();
    const q = { keywords: res.jobKeywords, location: res.jobLocation, kw, intern };
    res.jobs = await jobResults({ ...q, summary: res.actionQuery || ctx.summarize(q) }, profile, ctx);
  }
  return res;
}

// An instant answer in the same shape as an AI reply, marked "instant" so the chat can say no AI was used.
async function quickAnswer(quick, profile, plan, ctx) {
  const { t } = ctx;
  const base = { evidence: [], droppedEvidence: 0, unverified: [], nextStep: "", suggestRole: -1, instant: true, action: quick.action, actionQuery: "" };
  if (quick.action === "start_tour") {
    return { ...base, reply: t("coach.tourReply"), followUps: [t("coach.fuInterns"), t("coach.fuAnywhere")] };
  }
  if (quick.action !== "search_jobs") {
    return { ...base, reply: t("coach.hereIs", { label: t(`coach.sections.${quick.action}`) }), followUps: [plan ? t("coach.fuFirst") : t("coach.fuTarget"), t("coach.fuInterns")] };
  }
  const q = quick.query;
  const jobs = await jobResults(q, profile, ctx);
  const found = jobs.jobs && jobs.jobs.length;
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  return {
    ...base,
    actionQuery: q.summary,
    reply: !found ? t("coach.searchFail")
      : jobs.query.summary !== q.summary ? t("coach.nothingFor", { q: lower(q.summary) })
      : t("coach.hereOpen", { q: lower(q.summary) }),
    jobs,
    followUps: [found ? t("coach.fuWhichFits") : t("coach.fuAnywhere"), q.intern ? t("coach.fuFullTime") : t("coach.fuInterns"), plan ? t("coach.fuPlan") : t("coach.fuMatches")]
  };
}

// Switches the public proof link on or off. The first time it goes on, a random 10-character code is made.
export async function setPublic(formData) {
  const { supabase, user } = await currentUser();
  const on = formData.get("on") === "1";
  const { data: profile } = await supabase.from("sports_profiles").select("public_code").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect(`/profile?error=${encodeURIComponent((await getT()).t("profile.proofFirst"))}`);
  const update = { is_public: on };
  if (on && !profile.public_code) update.public_code = randomBytes(5).toString("hex"); // 10 lowercase hex characters
  const { error } = await supabase.from("sports_profiles").update(update).eq("user_id", user.id);
  if (error) redirect(`/profile?error=${encodeURIComponent((await getT()).t("profile.linkError"))}`);
  revalidatePath("/profile");
  redirect("/profile#proof");
}

// Ticks a plan step. A note about what they did is saved as a new achievement line, so the plan builds proof.
export async function completeStep(i, note) {
  const { supabase, user } = await currentUser();
  const { data: plan } = await supabase.from("plans").select("steps").eq("user_id", user.id).maybeSingle();
  if (!plan || !plan.steps[i]) return { error: (await getT()).t("plan.notFound") };
  const steps = plan.steps.map((s, n) => (n === i ? { ...s, done: true } : s));
  const { error } = await supabase.from("plans").update({ steps, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  if (error) return { error: (await getT()).t("plan.saveError") };
  const added = await appendAchievement(supabase, user, note);
  revalidatePath("/profile");
  return { ok: true, added };
}

// Adds one line to the saved achievements (skipped if it's already there or the box is full). True if added.
async function appendAchievement(supabase, user, note) {
  const line = clean(note, 200).replace(/\s+/g, " ");
  if (!line) return false;
  const { data: profile } = await supabase.from("sports_profiles").select("achievements").eq("user_id", user.id).maybeSingle();
  const current = String((profile && profile.achievements) || "").trim();
  const exists = current.split("\n").some((l) => l.trim().toLowerCase() === line.toLowerCase());
  if (!profile || exists || (current + "\n" + line).length > 4000) return false;
  const { error } = await supabase.from("sports_profiles").update({ achievements: current ? `${current}\n${line}` : line, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  return !error;
}

// Proof builder: saves the line Goldie helped write. No Passport yet → the line only goes into the form.
export async function addProof(line) {
  const { supabase, user } = await currentUser();
  const added = await appendAchievement(supabase, user, line);
  if (added) revalidatePath("/profile");
  return { added };
}

// "New since you left": postings for the user's target (or best match) published after their last visit,
// and how many of those they already have proof for. Rules and open job data only, no AI.
export async function newSince(since) {
  const { supabase, user } = await currentUser();
  const after = new Date(since);
  if (Number.isNaN(after.getTime())) return { count: 0 };
  const [{ data: profile }, { data: plan }] = await Promise.all([
    supabase.from("sports_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("plans").select("role_idx").eq("user_id", user.id).maybeSingle()
  ]);
  if (!profile) return { count: 0 };
  const { dict, country } = await context();
  const idx = plan ? plan.role_idx : (topMatches(effectiveProfile(profile))[0] || {}).idx;
  const word = idx === undefined ? "" : CAREER_PATHS[idx].search;
  const res = await searchJobs({ keywords: word, location: "", country });
  if (res.error) return { count: 0 };
  const fresh = res.jobs.filter((j) => j.created && new Date(j.created) > after);
  const withProof = fresh.filter((j) => fitCheck(`${j.title}. ${j.team || ""}. ${j.snippet}`, profile).proven > 0).length;
  // query: what "Show me" searches for (the role's job-title word, which the search rules understand in any language).
  return { count: fresh.length, withProof, query: `${word || "sports"} jobs`, role: idx === undefined ? "" : pathName(dict, idx) };
}

export async function undoStep(i) {
  const { supabase, user } = await currentUser();
  const { data: plan } = await supabase.from("plans").select("steps").eq("user_id", user.id).maybeSingle();
  if (!plan || !plan.steps[i]) return { error: (await getT()).t("plan.notFound") };
  const steps = plan.steps.map((s, n) => (n === i ? { ...s, done: false } : s));
  await supabase.from("plans").update({ steps, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  revalidatePath("/profile");
  return { ok: true };
}

// Job search: plain rules read the request, Adzuna and sports employers' career boards supply the real postings,
// and each posting gets a fit check against the user's own saved evidence.
// boardsOnly: set when Adzuna doesn't cover the country, so the page can say where postings come from.
async function jobResults(q, profile, ctx) {
  const { t, country, place } = ctx;
  const links = searchLinks(q.keywords, q.location, country, place);
  const boardsOnly = country !== "ANY" && !ADZUNA.includes(country) ? place : "";
  let res = await searchJobs({ ...q, country });
  // Nothing for the exact words ("video internships")? Widen to every sports internship (or job) in the same
  // country, and say so, rather than coming back empty.
  const wide = q.intern ? "internship" : "";
  if ((res.error || !res.jobs.length) && (q.keywords !== wide || q.location)) {
    const wider = await searchJobs({ keywords: wide, location: "", country });
    if (!wider.error && wider.jobs.length) {
      res = wider;
      const where = place ? t("search.inCountry", { country: place }) : t("search.everywhere");
      q = { ...q, summary: t(wide ? "search.noExactInterns" : "search.noExactJobs", { q: q.summary, where }) };
    }
  }
  if (res.error) return { query: q, links, error: res.error, enabled: jobsEnabled(), boardsOnly };
  const jobs = res.jobs.map((j) => ({ ...j, fit: fitCheck(`${j.title}. ${j.team || ""}. ${j.snippet}`, profile) }));
  return { query: q, links, jobs, total: res.total, boardsOnly };
}

export async function findJobs(text) {
  const { supabase, user } = await currentUser();
  const request = String(text || "").trim().slice(0, 200) || "sports jobs";
  const { data: profile } = await supabase.from("sports_profiles").select("*").eq("user_id", user.id).maybeSingle();
  const ctx = await context();
  // Read with plain rules (no AI call), so searching works even when the AI is busy.
  return jobResults(parseJobs(request, profile && profile.location, ctx.summarize), profile, ctx);
}

// Fit check for a pasted job posting.
export async function checkFit(text) {
  const { supabase, user } = await currentUser();
  const posting = String(text || "").trim().slice(0, 8000);
  const { t } = await getT();
  if (posting.length < 40) return { error: t("jobs.pasteShort") };
  const { data: profile } = await supabase.from("sports_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile) return { error: t("jobs.passportFirst") };
  const fit = fitCheck(posting, profile);
  if (!fit.total) return { error: t("jobs.noSkillsPasted") };
  return { fit };
}

// Adds the 1-week "close the gap" step for a skill to the saved plan, from a gap found by the fit check.
export async function addGapToPlan(tag) {
  const { supabase, user } = await currentUser();
  const { t } = await getT();
  if (!SKILLS[tag]) return { error: t("fit.unknown") };
  const { data: plan } = await supabase.from("plans").select("steps").eq("user_id", user.id).maybeSingle();
  if (!plan) return { error: t("fit.pickTarget") };
  // The step remembers its skill (shown in the reader's language); text is the English version.
  // Plans made before 29 Oct 2026 used "Build <skill>: …" or "<Skill>: …" text without a tag.
  if (plan.steps.some((s) => s.tag === tag || s.text.startsWith(`Build ${label(tag)}:`) || s.text.startsWith(`${label(tag)}:`))) return { ok: true, already: true };
  const step = { tag, text: gapStepIn(dictFor("en"), tag), done: false };
  const { error } = await supabase.from("plans").update({ steps: [...plan.steps.slice(0, -1), step, plan.steps[plan.steps.length - 1]], updated_at: new Date().toISOString() }).eq("user_id", user.id);
  if (error) return { error: t("fit.planError") };
  revalidatePath("/profile");
  return { ok: true };
}
