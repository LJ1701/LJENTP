// Every country (ISO 3166 two-letter codes), plus what each job source can do there.
// Names are never typed out here: Intl.DisplayNames gives each country's name in the visitor's language.
const CODES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");

export const isCountry = (code) => CODES.includes(code);

// Countries sorted by their name in the given language, for the picker.
export function countryList(lang) {
  const names = new Intl.DisplayNames([lang, "en"], { type: "region" });
  return CODES.map((c) => [c, names.of(c) || c]).sort((a, b) => a[1].localeCompare(b[1], lang));
}

export function countryName(code, lang = "en") {
  try { return new Intl.DisplayNames([lang, "en"], { type: "region" }).of(code) || code; } catch { return code; }
}

// Countries Adzuna (job listings from many local job boards) covers. Elsewhere, postings come from the
// sports employers' own career boards (which hire worldwide) and remote roles.
export const ADZUNA = ["AT", "AU", "BE", "BR", "CA", "CH", "DE", "ES", "FR", "GB", "IN", "IT", "MX", "NL", "NZ", "PL", "SG", "US", "ZA"];

// The word local postings use for "internship", so Adzuna finds them in each country's language.
export const INTERN_WORD = { ES: "prácticas", MX: "prácticas", BR: "estágio", FR: "stage", BE: "stage", DE: "Praktikum", AT: "Praktikum", CH: "Praktikum", IT: "stage", NL: "stage", PL: "staż" };

// ---------- Which country a posting's location is in ----------
// Board locations look like "New York, NY", "London, UK", "Remote - US", "Berlin" or "Remote".
const US_STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const CA_PROVINCES = "AB BC MB NB NL NS NT NU ON PE QC SK YT".split(" ");
// Short names and big cities that board postings use instead of the country's name.
const ALIASES = {
  US: ["usa", "u.s.", "united states", "america", "new york", "nyc", "san francisco", "los angeles", "chicago", "boston", "seattle", "austin", "denver", "atlanta", "miami", "dallas", "washington"],
  GB: ["uk", "u.k.", "united kingdom", "england", "scotland", "wales", "northern ireland", "london", "manchester", "birmingham", "leeds", "edinburgh", "glasgow", "bristol"],
  IE: ["ireland", "dublin", "cork"], FR: ["france", "paris", "lyon", "marseille", "bordeaux"], DE: ["germany", "deutschland", "berlin", "munich", "münchen", "hamburg", "cologne", "köln", "frankfurt"],
  ES: ["spain", "españa", "madrid", "barcelona", "valencia", "sevilla"], PT: ["portugal", "lisbon", "lisboa", "porto"], IT: ["italy", "italia", "milan", "milano", "rome", "roma", "turin", "torino"],
  NL: ["netherlands", "nederland", "amsterdam", "rotterdam", "utrecht"], BE: ["belgium", "brussels", "bruxelles", "antwerp"], DK: ["denmark", "danmark", "copenhagen", "københavn", "aarhus"],
  SE: ["sweden", "stockholm", "gothenburg"], NO: ["norway", "oslo"], FI: ["finland", "helsinki"], CH: ["switzerland", "zurich", "zürich", "geneva", "basel"], AT: ["austria", "vienna", "wien"],
  PL: ["poland", "polska", "warsaw", "warszawa", "krakow", "kraków", "wroclaw"], CA: ["canada", "toronto", "vancouver", "montreal", "montréal", "calgary", "ottawa"],
  AU: ["australia", "sydney", "melbourne", "brisbane", "perth"], NZ: ["new zealand", "auckland", "wellington"], IN: ["india", "bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "pune", "chennai"],
  JP: ["japan", "tokyo", "osaka"], SG: ["singapore"], BR: ["brazil", "brasil", "são paulo", "sao paulo", "rio de janeiro"], MX: ["mexico", "méxico", "mexico city", "ciudad de méxico", "guadalajara", "monterrey"],
  AE: ["uae", "united arab emirates", "dubai", "abu dhabi"], ZA: ["south africa", "cape town", "johannesburg"], AR: ["argentina", "buenos aires"], CO: ["colombia", "bogotá", "bogota", "medellín"],
  KR: ["south korea", "korea", "seoul"], CN: ["china", "beijing", "shanghai", "shenzhen"], HK: ["hong kong"], IL: ["israel", "tel aviv"], PH: ["philippines", "manila"], CZ: ["czech", "czechia", "prague"],
  GR: ["greece", "athens"], TR: ["turkey", "türkiye", "istanbul"], EE: ["estonia", "tallinn"], LT: ["lithuania", "vilnius"], UA: ["ukraine", "kyiv"], RO: ["romania", "bucharest"], HU: ["hungary", "budapest"]
};
const escapeRe = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MATCHERS = Object.entries(ALIASES).map(([cc, words]) => {
  const names = [...new Set([...words, countryName(cc).toLowerCase()])];
  return [cc, new RegExp(`(^|[^\\p{L}])(${names.map(escapeRe).join("|")})(?![\\p{L}])`, "iu")];
});
// "Jersey" and "Georgia" are skipped: they're also US places.
const FULL_NAMES = CODES.filter((cc) => cc !== "JE" && cc !== "GE").map((cc) => [cc, countryName(cc)]).filter(([, n]) => n.length > 3)
  .map(([cc, n]) => [cc, new RegExp(`(^|[^\\p{L}])${escapeRe(n)}(?![\\p{L}])`, "iu")]);

// The country a location string points to, or null when it doesn't say (e.g. just "Remote").
export function locationCountry(location) {
  const loc = String(location || "").trim();
  if (!loc) return null;
  // "Austin, TX" / "Toronto, ON": a state or province code after a comma.
  const code = (loc.match(/,\s*([A-Z]{2})\b/) || [])[1];
  if (code && CA_PROVINCES.includes(code) && !US_STATES.includes(code)) return "CA";
  if (code && US_STATES.includes(code)) return "US";
  if (/\b(US|USA)\b/.test(loc)) return "US";
  const hit = MATCHERS.find(([, re]) => re.test(loc));
  if (hit) return hit[0];
  // Any other country named in full, in English.
  const full = FULL_NAMES.find(([, re]) => re.test(loc));
  return full ? full[0] : null;
}

const REMOTE = /remote|anywhere|worldwide|global|distributed/i;

// True when a posting belongs in a search for this country ("ANY" means every posting).
export function inCountry(location, country) {
  if (!country || country === "ANY") return true;
  const cc = locationCountry(location);
  if (cc) return cc === country;
  return REMOTE.test(String(location || ""));
}
