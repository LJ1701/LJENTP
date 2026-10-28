import "server-only";

// Live job postings from Adzuna (https://developer.adzuna.com). Every job, employer and link shown in the app
// comes from this API; nothing is written by AI. Results are cached for an hour to stay inside the free limit.
const SPORTS_WORDS = ["sport", "sports", "athletic", "athletics", "athlete", "team", "league", "stadium", "arena", "esports", "recreation", "fitness", "club", "coach", "coaching", "tournament", "ballpark", "nfl", "nba", "mlb", "nhl", "mls", "ncaa", "wnba", "nwsl", "fifa", "olympic"];
const sportsRe = new RegExp(`\\b(${SPORTS_WORDS.join("|")})`, "i");

const stripTags = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export const jobsEnabled = () => !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);

// Search-page links for when live jobs aren't switched on (or as "see more").
export function searchLinks(keywords, location) {
  const q = encodeURIComponent(`sports ${keywords || ""}`.trim());
  const l = encodeURIComponent(location || "");
  return [
    ["Indeed", `https://www.indeed.com/jobs?q=${q}${l ? `&l=${l}` : ""}`],
    ["LinkedIn", `https://www.linkedin.com/jobs/search/?keywords=${q}${l ? `&location=${l}` : ""}`],
    ["TeamWork Online", "https://www.teamworkonline.com/"],
    ["WorkInSports", "https://www.workinsports.com/"]
  ];
}

// keywords: the role words ("video analyst"), may be empty for "any sports job". location: "Dallas, TX" or "".
export async function searchJobs({ keywords, location }) {
  if (!jobsEnabled()) return { error: "off" };
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    results_per_page: "30",
    max_days_old: "45",
    sort_by: "date",
    "content-type": "application/json"
  });
  if (keywords) params.set("what", keywords);
  // At least one sports word must appear, so "marketing coordinator" means sports marketing, not any marketing.
  params.set("what_or", "sports athletic athletics athlete stadium arena league esports recreation");
  if (location) {
    params.set("where", location);
    params.set("distance", "80");
  }
  try {
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000)
    });
    if (res.status === 401 || res.status === 403) return { error: "keys" };
    if (res.status === 429) return { error: "limit" };
    if (!res.ok) return { error: "down" };
    const data = await res.json();
    const seen = new Set();
    const jobs = (data.results || [])
      .map((j) => ({
        id: String(j.id),
        title: stripTags(j.title),
        company: stripTags(j.company && j.company.display_name) || "Employer not listed",
        location: stripTags(j.location && j.location.display_name),
        created: j.created,
        url: j.redirect_url,
        snippet: stripTags(j.description).slice(0, 600),
        salary: j.salary_min && j.salary_is_predicted !== "1"
          ? `$${Math.round(j.salary_min).toLocaleString("en-US")}${j.salary_max && j.salary_max !== j.salary_min ? `–$${Math.round(j.salary_max).toLocaleString("en-US")}` : ""} (as listed)`
          : ""
      }))
      // Keep postings that are really about sports, and drop exact duplicates (same title at the same employer).
      .filter((j) => j.url && sportsRe.test(`${j.title} ${j.company} ${j.snippet}`))
      .filter((j) => { const k = `${j.title}|${j.company}`.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 12);
    return { jobs, total: data.count || 0 };
  } catch {
    return { error: "down" };
  }
}
