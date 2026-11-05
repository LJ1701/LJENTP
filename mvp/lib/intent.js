// Recognises Goldie's most common requests with plain rules, so they are answered instantly without an AI call:
// job and internship searches, "take me to my plan", and "give me a tour". Real questions ("why is this my best
// match?") return null and go to Gemini. Fewer AI calls means Goldie keeps working when the AI is busy or out of
// free answers. The word lists cover all ten app languages; Hindi and Japanese words match anywhere in a message.

// Builds a pattern whose Latin-script words must stand alone (no letter before or after).
const words = (list, { prefix = false } = {}) => new RegExp(list.map((w) => (/^[\p{Script=Latin}]/u.test(w)
  ? `(?<![\\p{L}])(?:${w})${prefix ? "" : "(?![\\p{L}])"}`
  : `(?:${w})`)).join("|"), "iu");

const SECTION_WORDS = [
  ["go_passport", words(["passport", "profile", "pasaporte", "perfil", "passaporte", "passeport", "profil", "pass", "passaporto", "profilo", "paspoort", "paszport", "पासपोर्ट", "प्रोफ़ाइल", "パスポート", "プロフィール"])],
  ["go_matches", words(["match(es)?", "coincidencias", "afinidades", "compatibilidades", "correspondances", "treffer", "corrispondenze", "dopasowania", "मैच", "マッチ"])],
  ["go_plan", words(["plan", "plano", "piano", "planu?", "योजना", "プラン", "計画"])],
  ["go_proof", words(["proof( link)?", "public link", "r(e|é)sum(e|é)", "prueba", "prova", "preuve", "nachweis", "bewijs", "dow[oó]d(y)?", "सबूत", "証明"])],
  ["go_jobs", words(["jobs? (section|page|step)", "jobs? & internships"])]
];

const JOB_WORDS = words([
  "jobs?", "internships?", "interns?", "openings?", "positions?", "vacanc(y|ies)", "roles?", "hiring", "gigs?", "work at", "careers? at", "co-?ops?",
  "empleos?", "trabajos?", "pr[aá]cticas", "pasant[ií]as?", "becas?", "vacantes?", "ofertas?",
  "empregos?", "vagas?", "est[aá]gios?", "trabalhos?",
  "emplois?", "postes?", "stages?", "alternances?", "offres?",
  "stellen", "stellenangebote", "praktik(a|um|ums)?", "werkstudent",
  "lavori", "lavoro", "tirocini(o)?", "offerte",
  "vacatures?", "banen", "baan", "stageplaats(en)?",
  "praca", "prace", "pracy", "oferty", "sta[zż](e|u)?", "praktyk[ia]?",
  "नौकरी", "नौकरियां", "इंटर्नशिप", "जॉब",
  "求人", "仕事", "インターン", "採用"
]);
// Questions that want advice, not a list: these go to the AI.
const ADVICE = /^\s*(?:(?:how|why|what (?:should|do|would|skills|is|are)|should i|can you (?:help|explain|review)|tips|which (?:one|of these)|is it|do i need|explain|tell me why|c[oó]mo|por qu[eé]|qu[eé] (?:debo|deber[ií]a|necesito)|deber[ií]a|cu[aá]l|como|por que|o que (?:devo|preciso)|qual|comment|pourquoi|que dois|quel|quelle|wie|warum|was soll|welche[rs]?|sollte|come|perch[eé]|cosa devo|quale|hoe|waarom|wat moet|welke|jak|dlaczego|co powinien|kt[oó]r[ya])(?![\p{L}])|क्या|क्यों|कैसे|कौन|どう|なぜ|何を|どれ)/iu;
const TOUR = words(["tour", "show me around", "how does (this|it|the app) work", "where do i start", "get(ting)? started", "what can you do", "help me start",
  "recorrido", "visita guiada", "c[oó]mo funciona", "por d[oó]nde empiezo", "como funciona", "por onde come[cç]o", "visite guid[eé]e", "comment [cç]a marche", "par o[uù] commencer",
  "rundgang", "wie funktioniert", "wo fange ich an", "come funziona", "da dove inizio", "rondleiding", "hoe werkt", "waar begin ik", "jak to dzia[lł]a", "od czego zacz[aą][cć]",
  "टूर", "कैसे काम करता", "ツアー", "使い方", "案内"]);
const NAV = words(["take me", "go( back)? to", "open", "jump to", "scroll to", "where('s| is| are)", "bring me to", "navigate to", "show( me)? my", "see my",
  "ll[eé]vame", "ir a", "abre", "abrir", "mu[eé]strame", "ver mi", "leve-me", "me leve", "ir para", "mostre", "ver meu", "ver minha", "emm[eè]ne-moi", "aller [aà]", "ouvre", "montre-moi", "voir mon", "voir ma",
  "bring mich", "geh zu", "[oö]ffne", "zeig mir", "vai a", "portami", "apri", "mostrami", "breng me", "ga naar", "toon mijn", "zabierz mnie", "przejd[zź] do", "otw[oó]rz", "poka[zż]",
  "ले चलो", "दिखाओ", "खोलो", "開いて", "見せて", "移動"]);
const NEAR = words(["near me", "nearby", "around me", "local(ly)?", "in my (city|area)", "cerca de m[ií]", "perto de mim", "pr[eè]s de chez moi", "in meiner n[aä]he", "vicino a me", "in de buurt", "w pobli[zż]u", "मेरे पास", "近く"]);
const FILLER = words([
  "find", "show", "search", "get", "give", "list", "me", "my", "any", "some", "all", "are", "is", "there", "for", "a", "an", "the", "i", "im", "i'm", "want", "need", "looking", "look", "please", "can", "you",
  "sports?", "jobs?", "careers?", "openings?", "positions?", "roles?", "hiring", "vacanc(y|ies)", "gigs?", "right", "now", "currently", "open", "available", "new", "latest", "anywhere", "nationwide",
  "in", "near", "nearby", "around", "local", "remote", "us", "usa", "united", "states", "of", "to", "with", "at", "on", "work", "that", "which", "what", "instead", "also", "more", "other", "too",
  "b[uú]sca(me)?", "buscar", "encuentra(me)?", "mu[eé]strame", "quiero", "necesito", "de", "del", "la", "el", "los", "las", "un", "una", "en", "para", "y", "deportes?", "deportiv[oa]s?", "empleos?", "trabajos?", "vacantes?", "ofertas?",
  "encontre", "procuro", "quero", "preciso", "do", "da", "dos", "das", "o", "os", "as", "um", "uma", "em", "no", "na", "e", "esportes?", "esportiv[oa]s?", "desportiv[oa]s?", "empregos?", "vagas?", "trabalhos?",
  "trouve(-moi)?", "cherche", "je", "veux", "des", "du", "le", "les", "une", "et", "dans", "sportifs?", "sportives?", "emplois?", "postes?", "offres?",
  "finde", "suche", "ich", "m[oö]chte", "einen?", "der", "die", "das", "und", "im", "f[uü]r", "sportliche?", "stellen", "stellenangebote",
  "trova(mi)?", "cerco", "voglio", "di", "il", "lo", "gli", "dei", "delle", "per", "sportiv[oie]", "lavori", "lavoro", "offerte",
  "zoek", "ik", "wil", "een", "het", "van", "voor", "sportieve", "vacatures?", "banen", "baan",
  "znajd[zź]", "szukam", "chc[eę]", "w", "z", "dla", "sportow[aey]", "praca", "prace", "pracy", "oferty"
]);
const INTERN = words(["internships?", "interns?", "co-?ops?", "pr[aá]cticas", "pasant[ií]as?", "becari[oa]s?", "est[aá]gios?", "stages?", "stagiaires?", "alternances?", "praktik(a|um|ums)?", "werkstudent(in)?", "tirocini(o)?", "stageplaats(en)?", "sta[zż](e|u)?", "praktyk[ia]?", "इंटर्नशिप", "インターン"]);
// "... in Chicago", "... en Madrid", "... à Paris": a place name (capitalised) at the end of the request.
const PLACE = /(?:^|\s)(?:in|near|around|en|cerca de|em|perto de|à|près de|bei|nahe|vicino a|nabij|w|pod)\s+(?!me\b|my\b|mi\b|meu\b|mon\b|ma\b|meiner\b|mijn\b)(\p{Lu}[\p{L} .,'-]{1,40})$/u;
const all = (re) => new RegExp(re.source, "giu");

// Turns "marketing internships in Chicago" into { keywords: "marketing internship", location: "Chicago", kw, intern }.
// summarize(q) writes the label shown above the results, in the visitor's language.
export function parseJobs(text, city, summarize = englishSummary) {
  const clean = String(text || "").replace(/[?!.¿¡。？！]+/g, " ").trim();
  const placeMatch = clean.match(PLACE);
  const location = placeMatch ? placeMatch[1].trim() : NEAR.test(clean) && city ? city : "";
  const intern = INTERN.test(clean);
  const kw = (placeMatch ? clean.slice(0, placeMatch.index) : clean)
    .replace(all(NEAR), " ")
    .replace(/\b(full|part)[- ]time\b/gi, " ")
    .replace(all(INTERN), " ")
    .replace(all(FILLER), " ")
    .replace(/[^\p{L}\p{N}&+ -]/gu, " ")
    .replace(/\s+/g, " ").trim().slice(0, 40);
  // Employer-board postings are in English, so Hindi and Japanese words aren't used as search words.
  const latinKw = /[^\p{Script=Latin}\d &+ -]/u.test(kw) ? "" : kw;
  const q = { keywords: [latinKw, intern ? "internship" : ""].filter(Boolean).join(" "), location, kw: latinKw, intern };
  return { ...q, summary: summarize(q) };
}

function englishSummary({ kw, intern, location }) {
  const what = `${kw ? `${kw} ` : "sports "}${intern ? "internships" : "jobs"}`;
  return `${what.charAt(0).toUpperCase()}${what.slice(1)} ${location ? `near ${location}` : "anywhere"}`;
}

// text: the user's latest message; city: their saved city. Returns null when the AI should answer.
export function quickIntent(text, city, summarize) {
  const t = String(text || "").trim();
  if (!t || t.length > 160) return null;
  if (TOUR.test(t) && !JOB_WORDS.test(t)) return { action: "start_tour" };
  if (NAV.test(t)) {
    const hit = SECTION_WORDS.find(([, re]) => re.test(t));
    if (hit) return { action: hit[0] };
  }
  if (JOB_WORDS.test(t) && !ADVICE.test(t)) return { action: "search_jobs", query: parseJobs(t, city, summarize) };
  return null;
}
