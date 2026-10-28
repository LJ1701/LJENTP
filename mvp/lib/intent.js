// Recognises Goldie's most common requests with plain rules, so they are answered instantly without an AI call:
// job and internship searches, "take me to my plan", and "give me a tour". Real questions ("why is this my best
// match?") return null and go to Gemini. Fewer AI calls means Goldie keeps working when the AI is busy or out of
// free answers.

const SECTION_WORDS = [
  ["go_passport", /\b(passport|profile)\b/],
  ["go_matches", /\bmatch(es)?\b/],
  ["go_plan", /\bplan\b/],
  ["go_proof", /\bproof( link)?\b|\bpublic link\b/],
  ["go_jobs", /\bjobs? (section|page|step)\b|\bjobs? & internships\b/],
  ["go_coach", /\b(coach|goldie)\b/]
];
const SECTION_NAMES = { go_passport: "your Passport", go_matches: "your matches", go_plan: "your plan", go_proof: "your proof link", go_jobs: "jobs & internships", go_coach: "the coach" };

const JOB_WORDS = /\b(jobs?|internships?|interns?|openings?|positions?|vacanc(y|ies)|roles?|hiring|gigs?|work at|careers? at|co-?ops?)\b/i;
// Questions that want advice, not a list: these go to the AI.
const ADVICE = /^\s*(how|why|what (should|do|would|skills|is|are)|should i|can you (help|explain|review)|tips|which (one|of these)|is it|do i need|explain|tell me why)\b/i;
const TOUR = /\b(tour|show me around|how does (this|it|the app) work|where do i start|get(ting)? started|what can you do|help me start)\b/i;
const NAV = /\b(take me|go( back)? to|open|jump to|scroll to|where('s| is| are)|bring me to|navigate to|show( me)? my|see my)\b/i;
const NEAR = /\b(near me|nearby|around me|local(ly)?|in my (city|area))\b/i;
const FILLER = /\b(find|show|search|get|give|list|me|my|any|some|all|are|is|there|for|a|an|the|i|im|i'm|want|need|looking|look|please|can|you|sports?|jobs?|careers?|openings?|positions?|roles?|hiring|vacanc(y|ies)|gigs?|right|now|currently|open|available|new|latest|anywhere|nationwide|in|near|nearby|around|local|remote|us|usa|united|states|of|to|with|at|on|work|that|which|what|instead|also|more|other|too)\b/gi;

function parseJobs(text, city) {
  const clean = text.replace(/[?!.]+$/g, "").trim();
  const placeMatch = clean.match(/\b(?:in|near|around)\s+(?!me\b|my\b)([a-z][a-z .,'-]{1,40})$/i);
  const location = placeMatch ? placeMatch[1].trim() : NEAR.test(clean) && city ? city : "";
  const intern = /\b(internships?|interns?|co-?ops?)\b/i.test(clean);
  const keywords = (placeMatch ? clean.slice(0, placeMatch.index) : clean)
    .replace(NEAR, " ")
    .replace(/\b(full|part)[- ]time\b/gi, " ")
    .replace(/\b(internships?|interns?|co-?ops?)\b/gi, " ")
    .replace(FILLER, " ")
    .replace(/[^a-z0-9&+ -]/gi, " ")
    .replace(/\s+/g, " ").trim().slice(0, 40);
  const all = [keywords, intern ? "internship" : ""].filter(Boolean).join(" ");
  const what = `${keywords ? `${keywords} ` : "sports "}${intern ? "internships" : "jobs"}`;
  return { keywords: all, location, summary: `${what.charAt(0).toUpperCase()}${what.slice(1)} ${location ? `near ${location}` : "anywhere"}` };
}

// text: the user's latest message; city: their saved city. Returns null when the AI should answer.
export function quickIntent(text, city) {
  const t = String(text || "").trim();
  if (!t || t.length > 160) return null;
  if (TOUR.test(t) && !JOB_WORDS.test(t)) return { action: "start_tour" };
  if (NAV.test(t)) {
    const hit = SECTION_WORDS.find(([, re]) => re.test(t.toLowerCase()));
    if (hit) return { action: hit[0], label: SECTION_NAMES[hit[0]] };
  }
  if (JOB_WORDS.test(t) && !ADVICE.test(t)) return { action: "search_jobs", query: parseJobs(t, city) };
  return null;
}
