"use server";
import { searchJobs } from "@/lib/jobs";
import { parseJobs } from "@/lib/intent";
import { getT, getCountry } from "@/lib/i18n-server";
import { countryName } from "@/lib/countries";

// Homepage search: real postings for anyone, before signing up. Plain rules read the request (no AI),
// and no profile is read, so there is no fit check here; "See your fit" starts a Passport for that.
// The country is the visitor's choice above the search (saved in a cookie), or where they are.
export async function previewJobs(text) {
  const [{ t, lang }, country] = await Promise.all([getT(), getCountry()]);
  const place = country === "ANY" ? "" : countryName(country, lang);
  const where = place ? t("search.inCountry", { country: place }) : t("search.everywhere");
  const summarize = ({ kw, intern, location }) => {
    const what = kw ? t(intern ? "search.sumInterns" : "search.sumJobs", { kw }) : t(intern ? "search.sportsInterns" : "search.sportsJobs");
    return `${what.charAt(0).toUpperCase()}${what.slice(1)} ${location ? t("search.near", { place: location }) : where}`;
  };
  const request = String(text || "").trim().slice(0, 120) || "sports jobs";
  let q = parseJobs(request, "", summarize);
  let res = await searchJobs({ ...q, country });
  // Nothing for the exact words: show every sports internship (or job) in that country instead, and say so.
  if (res.error || !res.jobs.length) {
    const wide = q.intern ? "internship" : "";
    const wider = await searchJobs({ keywords: wide, location: "", country });
    if (wider.error || !wider.jobs.length) return { query: q, jobs: [], total: 0 };
    q = { ...q, summary: t(wide ? "search.noExactInterns" : "search.noExactJobs", { q: q.summary, where }) };
    res = wider;
  }
  const jobs = res.jobs.slice(0, 8).map(({ id, title, company, location, created, url, source }) => ({ id, title, company, location, created, url, source }));
  return { query: q, jobs, total: res.total };
}
