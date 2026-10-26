// Skills and interests found in the user's own achievements text, using the live site's keyword tables
// (script.js). Matching is whole-word at the start, case-insensitive, English only.

const SKILL_KEYWORDS = {
  "video editing": ["edited video", "edit video", "video editor", "highlight reel", "highlight video", "highlight tape", "premiere pro", "video edit", "editing video", "premiere", "final cut", "davinci", "capcut", "after effects", "filmora", "videograph", "video production", "motion graphics"],
  "writing": ["wrote", "written", "writer", "recap", "match report", "column", "press release", "editor of", "writing", "copywrit", "content writ", "blog", "newsletter", "storytelling", "articles", "reporting"],
  "coaching": ["coached", "taught", "teaching", "camp counselor", "training sessions", "drills", "coach", "mentor", "instructor", "trainer"],
  "data & analytics": ["data", "stats", "spreadsheet", "google sheets", "analyzed", "analysed", "analysis", "analytics", "data analysis", "excel", "sql", "tableau", "power bi", "statistic", "python", "sabermetric", "data-driven"],
  "social media": ["social", "snapchat", "linkedin", "posted", "followers", "social media", "instagram", "tiktok", "twitter", "facebook", "youtube", "hootsuite", "community management", "content calendar"],
  "playing experience": ["played", "player", "starter", "jv", "intramural", "athlete", "club soccer", "club basketball", "high school team", "varsity", "captain", "ncaa", "division i", "all-conference", "collegiate athlete", "student-athlete", "student athlete", "semi-pro", "professional player", "club team", "travel team", "academy"],
  "event management": ["organized", "organised", "planned", "hosted", "event", "volunteer", "event management", "event planning", "event coordinat", "tournament", "logistics", "game day", "gameday", "volunteer coordinat"],
  "marketing & sales": ["promoted", "promotion", "campaign", "ticket sales", "sponsor", "marketing", "sales", "business development", "seo", "advertising", "brand partnership", "crm", "salesforce", "fundraising"],
  "photography / design": ["photo", "designed", "graphics", "poster", "flyer", "logo", "photograph", "photoshop", "lightroom", "canva", "graphic design", "illustrator", "figma", "indesign"],
  "broadcasting / on-camera": ["announced", "on air", "livestream", "live stream", "commentary", "host of", "broadcast", "announcer", "commentat", "play-by-play", "on-camera", "on camera", "podcast", "radio", "sideline report", "voiceover", "voice-over", "color analyst"]
};

const INTEREST_KEYWORDS = {
  "content creation": ["content", "youtube", "creator", "videos", "content creat", "youtuber", "youtube channel", "influencer", "vlog", "short-form", "reels", "tiktok"],
  "coaching & player development": ["coach", "coaching", "mentored", "player development", "athlete development", "youth development", "talent development"],
  "scouting & analytics": ["scouting", "film study", "opponent analysis", "scout", "recruiting", "recruit", "talent evaluation", "performance analysis", "sabermetric"],
  "journalism & broadcasting": ["newspaper", "journal", "article", "press", "radio", "podcast", "journalis", "reporter", "sports writer", "broadcast", "media relations"],
  "marketing & sponsorship": ["sponsor", "marketing", "sponsorship", "brand partnership", "sports marketing", "partnerships"],
  "event operations": ["event", "operations", "stadium", "arena", "ticketing", "event operations", "game day", "gameday", "tournament", "facilities", "venue"],
  "front office / team ops": ["athletics department", "athletic department", "team office", "operations intern", "front office", "team operations", "operations coordinator", "athletics administration", "athletic administration", "sports management", "sport management", "general manager"],
  "personal brand building": ["my brand", "my channel", "personal brand", "own brand", "influencer", "followers"]
};

const escapeRe = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// For each tag, the first achievement line that mentions it (that line is the evidence shown to the user).
function detect(text, table) {
  const lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const found = {};
  for (const [tag, words] of Object.entries(table)) {
    const res = words.map((w) => new RegExp("\\b" + escapeRe(w), "i"));
    const line = lines.find((l) => res.some((re) => re.test(l)));
    if (line) found[tag] = line;
  }
  return found;
}

export const detectSkills = (text) => detect(text, SKILL_KEYWORDS);
export const detectInterests = (text) => detect(text, INTEREST_KEYWORDS);

// Ticked skills plus those found in achievements. `evidence` maps each found tag to its achievement line.
export function effectiveProfile(profile) {
  const p = profile || {};
  const foundSkills = detectSkills(p.achievements);
  const foundInterests = detectInterests(p.achievements);
  const skills = [...new Set([...(p.skills || []), ...Object.keys(foundSkills)])];
  const interests = [...new Set([...(p.interests || []), ...Object.keys(foundInterests)])];
  const evidence = { ...foundInterests, ...foundSkills };
  const auto = new Set([...Object.keys(foundSkills), ...Object.keys(foundInterests)].filter((t) => !(p.skills || []).includes(t) && !(p.interests || []).includes(t)));
  return { ...p, skills, interests, evidence, auto };
}
