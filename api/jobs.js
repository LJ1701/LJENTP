const ROLE_QUERIES = [
  "sports content creator",
  "sports video analyst",
  "sports journalist",
  "youth sports coach",
  "sports scout analyst",
  "sports marketing sponsorship",
  "sports event coordinator",
  "sports operations coordinator"
];

const PREFERRED_PUBLISHERS = ["linkedin", "indeed", "glassdoor"];

function publisherRank(name) {
  const i = PREFERRED_PUBLISHERS.indexOf(String(name || "").toLowerCase());
  return i === -1 ? PREFERRED_PUBLISHERS.length : i;
}

function formatSalary(job) {
  const min = job.job_min_salary;
  const max = job.job_max_salary;
  if (!min && !max) return "";
  const cur = job.job_salary_currency || "USD";
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const range = min && max ? `${fmt(min)}–${fmt(max)}` : fmt(min || max);
  return `${range} ${cur}${job.job_salary_period ? "/" + String(job.job_salary_period).toLowerCase() : ""}`;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const fail = (status, error) => {
    res.setHeader("Cache-Control", "no-store");
    return res.status(status).json({ error });
  };

  if (req.method !== "GET") return fail(405, "method_not_allowed");

  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return fail(503, "not_configured");

  const role = Number(req.query.role);
  if (!Number.isInteger(role) || role < 0 || role >= ROLE_QUERIES.length) return fail(400, "bad_role");

  const location = String(req.query.location || "")
    .replace(/[^\p{L}\p{N}\s,.'-]/gu, "")
    .trim()
    .slice(0, 80);

  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", `${ROLE_QUERIES[role]} jobs${location ? " in " + location : ""}`);
  url.searchParams.set("page", "1");
  url.searchParams.set("num_pages", "1");
  url.searchParams.set("country", "us");
  url.searchParams.set("date_posted", "month");

  try {
    const upstream = await fetch(url, {
      headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" }
    });
    if (!upstream.ok) return fail(502, "upstream_error");

    const body = await upstream.json();
    const jobs = (Array.isArray(body.data) ? body.data : [])
      .filter((j) => /^https?:\/\//i.test(j.job_apply_link || ""))
      .sort((a, b) => publisherRank(a.job_publisher) - publisherRank(b.job_publisher))
      .slice(0, 6)
      .map((j) => ({
        title: j.job_title || "",
        employer: j.employer_name || "",
        location: [j.job_city, j.job_state].filter(Boolean).join(", ") || (j.job_is_remote ? "Remote" : ""),
        publisher: j.job_publisher || "",
        url: j.job_apply_link,
        salary: formatSalary(j)
      }));

    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=3600");
    return res.status(200).json({ jobs });
  } catch {
    return fail(502, "upstream_error");
  }
};
