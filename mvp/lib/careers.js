// Career data and matching for the MVP, taken from the live LJSportMind site (script.js), English only.

export const SPORTS = ["American football", "Basketball", "Baseball", "Soccer", "Hockey", "Volleyball", "Other"];

export const ROLES = ["Player", "Former player", "Coach", "Student", "Content creator", "Fan", "Other"];

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

export const CAREER_PATHS = [
  { name: "Sports Content Creator", nextStep: "Post one piece of game content a week and add it to your achievements.", tags: ["video editing", "social media", "writing", "photography / design", "content creation", "personal brand building"] },
  { name: "Team Video / Media Analyst", nextStep: "Offer to cut film for a local club or college team to build a reel.", tags: ["video editing", "data & analytics", "coaching", "coaching & player development"] },
  { name: "Sports Journalist / Broadcaster", nextStep: "Start a match-report or postgame recap series in your own voice.", tags: ["writing", "broadcasting / on-camera", "content creation", "journalism & broadcasting"] },
  { name: "Youth or Club Coach", nextStep: "Volunteer as an assistant coach with a local youth or club team.", tags: ["coaching", "playing experience", "event management", "coaching & player development"] },
  { name: "Scouting / Analytics", nextStep: "Start logging your own scouting notes or stats on games you watch.", tags: ["data & analytics", "playing experience", "scouting & analytics"] },
  { name: "Marketing & Sponsorship", nextStep: "Study how a team or athlete you follow runs their sponsor content.", tags: ["marketing & sales", "social media", "content creation", "marketing & sponsorship"] },
  { name: "Event Operations", nextStep: "Volunteer to help run a local tournament or club event.", tags: ["event management", "event operations"] },
  { name: "Front Office / Team Operations", nextStep: "Look for internship or part-time roles with local clubs or franchises.", tags: ["data & analytics", "marketing & sales", "event management", "playing experience", "front office / team ops"] }
];

export const label = (tag) => SKILLS[tag] || INTERESTS[tag] || tag;

// Job-search links for a path, same searches as the live site (Indeed, LinkedIn) plus the two sports boards.
const JOB_QUERIES = ["sports content creator", "sports video analyst", "sports journalist", "youth sports coach", "sports scout analyst", "sports marketing sponsorship", "sports event coordinator", "sports operations coordinator"];

export function jobLinks(idx, location) {
  const q = encodeURIComponent(JOB_QUERIES[idx]);
  const l = encodeURIComponent(location || "");
  return [
    ["Indeed", `https://www.indeed.com/jobs?q=${q}${l ? `&l=${l}` : ""}`],
    ["LinkedIn", `https://www.linkedin.com/jobs/search/?keywords=${q}${l ? `&location=${l}` : ""}`],
    ["TeamWork Online", "https://www.teamworkonline.com/"],
    ["WorkInSports", "https://www.workinsports.com/"]
  ];
}

// Top 3 paths by how much of each role's typical skill set the profile covers.
export function topMatches(profile) {
  const have = new Set([...(profile?.skills || []), ...(profile?.interests || [])]);
  return CAREER_PATHS.map((path, idx) => {
    const matched = path.tags.filter((t) => have.has(t));
    const ratio = matched.length / path.tags.length;
    const strength = ratio >= 0.67 ? "Strong match" : ratio >= 0.34 ? "Good match" : "Possible match";
    const gaps = path.tags.filter((t) => SKILLS[t] && !have.has(t));
    return { ...path, idx, matched, ratio, strength, gaps };
  })
    .filter((m) => m.matched.length > 0)
    .sort((a, b) => b.ratio - a.ratio || b.matched.length - a.matched.length)
    .slice(0, 3);
}

// A saved plan: one step per missing skill, then the path's next step and an application step.
export function buildPlanSteps(idx, profile) {
  const path = CAREER_PATHS[idx];
  const have = new Set(profile?.skills || []);
  const gaps = path.tags.filter((t) => SKILLS[t] && !have.has(t));
  return [
    ...gaps.map((g) => ({ text: `Build ${label(g)}: get one project or experience that shows it.`, done: false })),
    { text: path.nextStep, done: false },
    { text: `Apply to one ${path.name} opening.`, done: false }
  ];
}
