// Career data and matching for the MVP, taken from the live LJSportMind site (script.js), English only.

export const SPORTS = ["American football", "Basketball", "Baseball", "Soccer", "Hockey", "Volleyball", "Several sports", "Other"];

export const ROLES = ["Student", "Player", "Former player", "Coach", "Content creator", "Fan", "Career changer", "Already work in sports", "Other"];

export const SKILLS = {
  "video editing": "Video Editing",
  "writing": "Writing",
  "coaching": "Coaching",
  "data & analytics": "Data & Analytics",
  "social media": "Social Media",
  "playing experience": "Playing Experience",
  "event management": "Event Management",
  "marketing & sales": "Marketing & Sales",
  "photography / design": "Photography / Design",
  "broadcasting / on-camera": "Broadcasting / On-Camera"
};

export const INTERESTS = {
  "content creation": "Digital Content",
  "coaching & player development": "Player Development",
  "scouting & analytics": "Scouting & Performance Insight",
  "journalism & broadcasting": "Sports Journalism",
  "marketing & sponsorship": "Sponsorship & Partnerships",
  "event operations": "Game-Day Operations",
  "front office / team ops": "Front Office",
  "personal brand building": "Personal Brand"
};

// search: the one word job titles for this path usually contain, used by "See jobs for this role".
export const CAREER_PATHS = [
  { name: "Sports Content Creator", search: "content", nextStep: "Post one piece of game content a week and add it to your achievements.", tags: ["video editing", "social media", "writing", "photography / design", "content creation", "personal brand building"] },
  { name: "Team Video / Media Analyst", search: "video", nextStep: "Offer to cut film for a local club or college team to build a reel.", tags: ["video editing", "data & analytics", "coaching", "coaching & player development"] },
  { name: "Sports Journalist / Broadcaster", search: "writer", nextStep: "Start a match-report or postgame recap series in your own voice.", tags: ["writing", "broadcasting / on-camera", "content creation", "journalism & broadcasting"] },
  { name: "Youth or Club Coach", search: "coach", nextStep: "Volunteer as an assistant coach with a local youth or club team.", tags: ["coaching", "playing experience", "event management", "coaching & player development"] },
  { name: "Scouting / Analytics", search: "analyst", nextStep: "Start logging your own scouting notes or stats on games you watch.", tags: ["data & analytics", "playing experience", "scouting & analytics"] },
  { name: "Marketing & Sponsorship", search: "marketing", nextStep: "Study how a team or athlete you follow runs their sponsor content.", tags: ["marketing & sales", "social media", "content creation", "marketing & sponsorship"] },
  { name: "Event Operations", search: "event", nextStep: "Volunteer to help run a local tournament or club event.", tags: ["event management", "event operations"] },
  { name: "Front Office / Team Operations", search: "operations", nextStep: "Look for internship or part-time roles with local clubs or franchises.", tags: ["data & analytics", "marketing & sales", "event management", "playing experience", "front office / team ops"] }
];

export const label = (tag) => SKILLS[tag] || INTERESTS[tag] || tag;
// The same, in the visitor's language (dict: a locales/<lang>.js dictionary).
export const labelIn = (dict, tag) => (dict && ((dict.skills && dict.skills[tag]) || (dict.interests && dict.interests[tag]))) || label(tag);
export const pathName = (dict, idx) => (dict && dict.paths && dict.paths[idx] && dict.paths[idx].name) || CAREER_PATHS[idx].name;

// Job-search links for a path: LinkedIn works in every country; Indeed and the two US sports boards only for the US.
const JOB_QUERIES = ["sports content creator", "sports video analyst", "sports journalist", "youth sports coach", "sports scout analyst", "sports marketing sponsorship", "sports event coordinator", "sports operations coordinator"];

export function jobLinks(idx, location, country = "US", countryLabel = "") {
  const q = encodeURIComponent(JOB_QUERIES[idx]);
  const l = encodeURIComponent(location || countryLabel || "");
  const links = [["LinkedIn", `https://www.linkedin.com/jobs/search/?keywords=${q}${l ? `&location=${l}` : ""}`]];
  if (country === "US") links.unshift(["Indeed", `https://www.indeed.com/jobs?q=${q}${location ? `&l=${encodeURIComponent(location)}` : ""}`]);
  if (country === "US" || country === "CA") links.push(["TeamWork Online", "https://www.teamworkonline.com/"], ["WorkInSports", "https://www.workinsports.com/"]);
  return links;
}

// Top 3 paths by how much of each role's typical skill set the profile covers.
// level: "strong" | "good" | "possible", shown through the dictionary.
export function topMatches(profile) {
  const have = new Set([...(profile?.skills || []), ...(profile?.interests || [])]);
  return CAREER_PATHS.map((path, idx) => {
    const matched = path.tags.filter((t) => have.has(t));
    const ratio = matched.length / path.tags.length;
    const level = ratio >= 0.67 ? "strong" : ratio >= 0.34 ? "good" : "possible";
    const strength = { strong: "Strong match", good: "Good match", possible: "Possible match" }[level];
    const gaps = path.tags.filter((t) => SKILLS[t] && !have.has(t));
    return { ...path, idx, matched, ratio, level, strength, gaps };
  })
    .filter((m) => m.matched.length > 0)
    .sort((a, b) => b.ratio - a.ratio || b.matched.length - a.matched.length)
    .slice(0, 3);
}

// "Close the gap": one concrete step per skill, small enough for one week, that ends in something countable.
// The words are in locales/<lang>.js (gapSteps), so a step shows in whatever language the visitor reads.
export const gapStepIn = (dict, tag) => `${labelIn(dict, tag)}: ${(dict && dict.gapSteps && dict.gapSteps[tag]) || ""}`.replace(/: $/, "");

// A saved plan: one step per missing skill, then the path's next step and an application step.
// Each step remembers what it is (tag or kind), so it's shown in the reader's language; text is the
// English version, kept for the AI coach and for plans saved before translations existed.
export function buildPlanSteps(idx, profile, en) {
  const path = CAREER_PATHS[idx];
  const have = new Set(profile?.skills || []);
  const gaps = path.tags.filter((t) => SKILLS[t] && !have.has(t));
  return [
    ...gaps.map((g) => ({ tag: g, text: gapStepIn(en, g), done: false })),
    { kind: "next", text: path.nextStep, done: false },
    { kind: "apply", text: `Apply to one ${path.name} opening.`, done: false }
  ];
}

// One plan step's words in the reader's language.
export function stepText(dict, step, roleIdx) {
  if (step.tag && dict.gapSteps && dict.gapSteps[step.tag]) return gapStepIn(dict, step.tag);
  if (step.kind === "next" && dict.paths && dict.paths[roleIdx]) return dict.paths[roleIdx].nextStep;
  if (step.kind === "apply") return (dict.profile.applyStep || "").replace("{role}", pathName(dict, roleIdx));
  return step.text;
}
