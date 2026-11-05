import "server-only";

import { INTERN_WORD, inCountry, adzunaFor } from "./countries";

// Real job postings from two kinds of source; nothing is written by AI and every link is the employer's own posting.
// 1. Adzuna (https://developer.adzuna.com): local job boards in 19 countries, filtered to sports.
// 2. Public career boards of sports employers (Greenhouse, Lever and Ashby publish them as open JSON, no key needed),
//    which hire worldwide; their postings are filtered by the country in each posting's location.
// Every search has a country: a two-letter code, or "ANY" for every country (employer boards only).
// Results are cached for an hour, so repeated searches don't hit the sources again.
const SPORTS_WORDS = ["sport", "athlet", "atlet", "team", "league", "liga", "stadium", "stadion", "stadio", "estadio", "est[aá]dio", "stade", "arena", "esports", "recreation", "fitness", "club", "clube", "verein", "coach", "tournament", "torneo", "torneio", "tournoi", "turnier", "ballpark", "deport", "esporte", "esportiv", "desport", "futbol", "f[uú]tbol", "futebol", "fu[sß]ball", "calcio", "voetbal", "pi[lł]k", "football", "nfl", "nba", "mlb", "nhl", "mls", "ncaa", "wnba", "nwsl", "fifa", "uefa", "olympic", "ol[ií]mpic"];
const sportsRe = new RegExp(`(?<![\\p{L}])(${SPORTS_WORDS.join("|")})`, "iu");
// Sent to Adzuna as "at least one of these words", in English and the local language.
const ADZUNA_SPORTS = {
  default: "sports athletic athletics athlete stadium arena league esports recreation",
  es: "sports deporte deportes deportivo deportiva estadio club liga", mx: "sports deporte deportes deportivo deportiva estadio club liga",
  br: "sports esporte esportes esportivo esportiva estádio clube futebol", fr: "sport sports sportif sportive stade club ligue",
  be: "sport sports sportif sportive stade club voetbal", de: "sport sportverein verein stadion fußball sportlich", at: "sport sportverein verein stadion fußball",
  ch: "sport sportverein verein stadion fußball sportif", it: "sport sportivo sportiva calcio stadio club", nl: "sport sportclub voetbal stadion vereniging",
  pl: "sport sportowy sportowa klub stadion piłka"
};
// Clearly about sports: an Adzuna posting must use one of these somewhere. Words most job ads use ("team",
// "club", "fitness", "coach") don't count on their own; they let in vets, ICU doctors and engineers.
// Checked against live Adzuna results on 4 Nov 2026; local-language sports words added for other countries.
const STRONG_SPORTS = ["sports?", "athletic", "athletics", "athletes?", "league", "stadium", "arena", "esports", "ballpark", "tournament", "nfl", "nba", "mlb", "nhl", "mls", "ncaa", "wnba", "nwsl", "fifa", "uefa", "olympic", "soccer", "football", "basketball", "baseball", "hockey", "volleyball", "tennis", "golf", "fans?", "season tickets?", "game ?days?", "ticketing",
  "deport\\p{L}*", "esport[ei]s?", "esportiv\\p{L}*", "desport\\p{L}*", "f[uú]tbol", "futebol", "fu[sß]ball", "calcio", "voetbal", "pi[lł]k\\p{L}*", "estadio", "est[aá]dio", "stade", "stadion", "stadio", "liga", "ligue", "torneo", "torneio", "tournoi", "turnier", "sportif", "sportive", "sportivo", "sportiva", "sportverein", "sportowy", "sportowa", "sportlich", "atleta", "atletas", "ol[ií]mpic\\p{L}*"];
const strongRe = new RegExp(`(?<![\\p{L}])(${STRONG_SPORTS.join("|")})(?![\\p{L}])`, "iu");
// Cleaning and janitorial roles at gyms and arenas pass the sports test but aren't sports careers (seen in
// Brazilian results on 5 Nov 2026), so they're left out in every language the app speaks.
const NOT_CAREER = /(?<![\p{L}])(limpeza|limpieza|faxin\p{L}*|cleaner|cleaning|janitor\p{L}*|housekeep\p{L}*|custodian|nettoyage|agent d'entretien|reinigung\p{L}*|putzkraft|pulizi\p{L}*|schoonma\p{L}*|sprzątan\p{L}*)/iu;
const clearlySports = (j) => strongRe.test(`${j.title} ${j.company} ${j.snippet}`) && !NOT_CAREER.test(j.title);

const stripTags = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export const jobsEnabled = () => !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);

// Search-page links for when job listings aren't switched on (or as "see more"). LinkedIn works in every country;
// Indeed's US site and the two US sports boards are only offered for the US (and Canada for the boards).
export function searchLinks(keywords, location, country = "US", countryLabel = "") {
  const q = encodeURIComponent(`sports ${keywords || ""}`.trim());
  const where = location || (country !== "ANY" ? countryLabel : "");
  const l = encodeURIComponent(where);
  const links = [["LinkedIn", `https://www.linkedin.com/jobs/search/?keywords=${q}${l ? `&location=${l}` : ""}`]];
  if (country === "US") links.unshift(["Indeed", `https://www.indeed.com/jobs?q=${q}${location ? `&l=${encodeURIComponent(location)}` : ""}`]);
  if (country === "US" || country === "CA") links.push(["TeamWork Online", "https://www.teamworkonline.com/"], ["WorkInSports", "https://www.workinsports.com/"]);
  else links.push(["Google", `https://www.google.com/search?q=${encodeURIComponent(`sports jobs ${keywords || ""} ${where}`.replace(/\s+/g, " ").trim())}&ibp=htl;jobs`]);
  return links;
}

// Sports employers whose public career boards were checked on 28 Oct 2026 (all returned open jobs).
// Added 5 Nov 2026 for Europe and Latin America (each board checked and returning open jobs that day):
// Catapult (London, Cologne), Eversports (Vienna), Gymshark (UK), Kaizen Gaming / Betano (Athens, Malta,
// Germany, Spain), Wellhub (Brazil, Europe), Rush Street Interactive (Bogotá, Medellín, Mexico), Sporty Group
// (São Paulo, Europe remote).
const EMPLOYERS = [
  ["greenhouse", "catapultsports", "Catapult"], ["greenhouse", "eversports", "Eversports"], ["greenhouse", "gymshark", "Gymshark"],
  ["greenhouse", "kaizengaming", "Kaizen Gaming (Betano)"], ["greenhouse", "gympass", "Wellhub"],
  ["greenhouse", "rushstreetinteractive", "Rush Street Interactive"], ["greenhouse", "sportygroup", "Sporty Group"],
  ["greenhouse", "hudl", "Hudl"], ["greenhouse", "fanduel", "FanDuel"], ["greenhouse", "prizepicks", "PrizePicks"],
  ["greenhouse", "geniussports", "Genius Sports"], ["greenhouse", "seatgeek", "SeatGeek"], ["greenhouse", "fubotv", "Fubo"],
  ["greenhouse", "barstoolsports", "Barstool Sports"], ["greenhouse", "zwift", "Zwift"], ["greenhouse", "peloton", "Peloton"],
  ["greenhouse", "future", "Future (fitness coaching)"], ["lever", "theathletic", "The Athletic"], ["lever", "teamsnap", "TeamSnap"],
  ["lever", "veo", "Veo"], ["ashby", "whoop", "WHOOP"], ["ashby", "sleeper", "Sleeper"], ["ashby", "strava", "Strava"],
  ["ashby", "sorare", "Sorare"], ["ashby", "tonal", "Tonal"], ["ashby", "teamworks", "Teamworks"]
];

const BOARD_URL = {
  greenhouse: (t) => `https://boards-api.greenhouse.io/v1/boards/${t}/jobs`,
  lever: (t) => `https://api.lever.co/v0/postings/${t}?mode=json`,
  ashby: (t) => `https://api.ashbyhq.com/posting-api/job-board/${t}`
};

// One employer's open jobs in the app's shape. A board that fails or times out just adds nothing.
async function boardJobs([kind, token, name]) {
  try {
    const res = await fetch(BOARD_URL[kind](token), { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (kind === "greenhouse") return (data.jobs || []).map((j) => ({
      id: `gh-${j.id}`, title: stripTags(j.title), company: name, location: stripTags(j.location && j.location.name),
      created: j.first_published || j.updated_at, url: j.absolute_url, snippet: "", team: "", type: "", source: `${name} careers`
    }));
    if (kind === "lever") return (Array.isArray(data) ? data : []).map((j) => ({
      id: `lv-${j.id}`, title: stripTags(j.text), company: name, location: stripTags(j.categories && j.categories.location),
      created: new Date(Number(j.createdAt)).toISOString(), url: j.hostedUrl, snippet: stripTags(j.descriptionPlain || j.openingPlain).slice(0, 600),
      team: stripTags(j.categories && j.categories.team), type: stripTags(j.categories && j.categories.commitment), source: `${name} careers`
    }));
    return (data.jobs || []).filter((j) => j.isListed !== false).map((j) => ({
      id: `ab-${j.id}`, title: stripTags(j.title), company: name, location: stripTags(j.location) + (j.isRemote ? " (remote)" : ""),
      created: j.publishedAt, url: j.jobUrl, snippet: stripTags(j.descriptionPlain).slice(0, 600),
      team: stripTags(j.department || j.team), type: stripTags(j.employmentType), source: `${name} careers`
    }));
  } catch {
    return [];
  }
}

const INTERN = /\bintern(ship)?s?\b|\bco-?op\b|\bapprentice|\btrainee|\bpraktik|werkstudent|pr[aá]cticas|\bbecari|est[aá]gi|\bstage\b|\bstagiaire|alternance|tirocini|stageplaats|sta[zż]\b|sta[zż]ysta/i;
const wantsIntern = (keywords) => /\bintern/i.test(keywords || "");
// The search words without "intern(ship)", each shortened a little so "analyst" also matches "analytics".
const terms = (keywords) => String(keywords || "").toLowerCase().replace(/\bintern(ship)?s?\b/g, " ").split(/[^a-z0-9&+]+/)
  .filter((w) => w.length > 2 && !["and", "the", "for", "with", "remote"].includes(w))
  .map((w) => (w.length > 6 ? w.slice(0, w.length - 2) : w));

async function searchBoards({ keywords, location, country }) {
  const all = (await Promise.all(EMPLOYERS.map(boardJobs))).flat();
  const words = terms(keywords);
  const intern = wantsIntern(keywords);
  const place = String(location || "").split(",")[0].trim().toLowerCase();
  return all.filter((j) => {
    const text = `${j.title} ${j.team}`.toLowerCase();
    if (intern && !INTERN.test(`${j.title} ${j.type}`)) return false;
    if (words.length && !words.every((w) => text.includes(w))) return false;
    if (!inCountry(j.location, country)) return false;
    if (place && !`${j.location}`.toLowerCase().includes(place) && !/remote/i.test(j.location)) return false;
    return j.url;
  });
}

// A country, or a region (Europe, Latin America, South America): one Adzuna search per covered country,
// merged. Countries Adzuna doesn't cover return nothing (no error); an error only counts if every search failed.
async function searchAdzuna(query) {
  const list = adzunaFor(query.country || "US");
  if (!list.length) return { jobs: [], total: 0 };
  const results = await Promise.all(list.map((c) => searchAdzunaIn({ ...query, country: c }, list.length > 1 ? 20 : 50)));
  const ok = results.filter((r) => !r.error);
  if (!ok.length) return { error: results[0].error };
  return { jobs: ok.flatMap((r) => r.jobs), total: ok.reduce((n, r) => n + r.total, 0) };
}

// keywords: the role words ("video analyst", "marketing internship"); may be empty for "any sports job".
// location: "Dallas, TX", or "" for anywhere in the country.
async function searchAdzunaIn({ keywords, location, country = "US" }, perPage = 50) {
  if (!jobsEnabled()) return { error: "off" };
  const cc = country.toLowerCase();
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    results_per_page: String(perPage),
    max_days_old: "60",
    sort_by: "date",
    "content-type": "application/json"
  });
  const words = String(keywords || "").replace(/\bintern(ship)?s?\b/gi, " ").replace(/\s+/g, " ").trim();
  // Internships: Adzuna matches the word "internship", which nearly every intern posting contains.
  const what = [words, wantsIntern(keywords) ? INTERN_WORD[country] || "internship" : ""].filter(Boolean).join(" ");
  if (what) params.set("what", what);
  // At least one sports word must appear, so "marketing coordinator" means sports marketing, not any marketing.
  params.set("what_or", ADZUNA_SPORTS[cc] || ADZUNA_SPORTS.default);
  if (location) {
    params.set("where", location);
    params.set("distance", "80");
  }
  try {
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${cc}/search/1?${params}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000)
    });
    if (res.status === 401 || res.status === 403) return { error: "keys" };
    if (res.status === 429) return { error: "limit" };
    if (!res.ok) return { error: "down" };
    const data = await res.json();
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
          ? `${money(j.salary_min, country)}${j.salary_max && j.salary_max !== j.salary_min ? `–${money(j.salary_max, country)}` : ""}`
          : "",
        source: "Adzuna"
      }))
      // Keep postings that are really about sports.
      // Keep postings that are really about sports; for internship searches, the title must say so too
      // (Adzuna also matches "internship" anywhere in a description).
      .filter((j) => j.url && clearlySports(j))
      .filter((j) => !wantsIntern(keywords) || INTERN.test(j.title));
    return { jobs, total: data.count || 0 };
  } catch {
    return { error: "down" };
  }
}

// A salary in the posting country's currency, as Adzuna lists it.
const CURRENCY = { US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD", IN: "INR", SG: "SGD", ZA: "ZAR", BR: "BRL", MX: "MXN", PL: "PLN", CH: "CHF" };
const money = (n, country) => new Intl.NumberFormat("en", { style: "currency", currency: CURRENCY[country] || "EUR", maximumFractionDigits: 0 }).format(Math.round(n));

// Both sources at once, newest first, duplicates (same title at the same employer) removed. Up to 40 postings.
// query: { keywords, location, country }
export async function searchJobs(query) {
  const [adzuna, boards] = await Promise.all([searchAdzuna(query), searchBoards(query)]);
  const seen = new Set();
  const found = [...(adzuna.jobs || []), ...boards]
    .filter((j) => { const k = `${j.title}|${j.company}`.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
  // An Adzuna problem only matters when the employer boards found nothing either.
  if (!found.length && adzuna.error) return { error: adzuna.error };
  return { jobs: found.slice(0, 40), total: found.length };
}

// Homepage numbers, counted exactly from the sports employers' own career boards every hour: open postings,
// internships, and the newest posting from each employer. Adzuna is left out on purpose: its total counts
// any posting that mentions a sports word, which is far broader than real sports jobs.
export async function jobStats() {
  const boards = (await Promise.all(EMPLOYERS.map(boardJobs))).flat().filter((j) => j.url);
  // Newest posting from each employer, so the strip shows the range of companies.
  const seen = new Set();
  const latest = [...boards].sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0))
    .filter((j) => !seen.has(j.company) && seen.add(j.company)).slice(0, 8)
    .map(({ id, title, company, url }) => ({ id, title, company, url }));
  return {
    total: boards.length,
    internships: boards.filter((j) => INTERN.test(`${j.title} ${j.type}`)).length,
    employers: new Set(boards.map((j) => j.company)).size,
    latest
  };
}
