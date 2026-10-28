"use server";
import { searchJobs } from "@/lib/jobs";
import { parseJobs } from "@/lib/intent";

// Homepage search: real postings for anyone, before signing up. Plain rules read the request (no AI),
// and no profile is read, so there is no fit check here; "See your fit" starts a Passport for that.
export async function previewJobs(text) {
  const request = String(text || "").trim().slice(0, 120) || "sports jobs";
  let q = parseJobs(request, "");
  let res = await searchJobs(q);
  // Nothing for the exact words: show every sports internship (or job) instead, and say so.
  if (res.error || !res.jobs.length) {
    const wide = /intern/i.test(q.keywords) ? "internship" : "";
    const wider = await searchJobs({ keywords: wide, location: "" });
    if (wider.error || !wider.jobs.length) return { query: q, jobs: [], total: 0 };
    q = { ...q, summary: `No exact matches for "${q.summary}", so here are all sports ${wide ? "internships" : "jobs"}` };
    res = wider;
  }
  const jobs = res.jobs.slice(0, 8).map(({ id, title, company, location, created, url, source }) => ({ id, title, company, location, created, url, source }));
  return { query: q, jobs, total: res.total };
}
