import "server-only";
import { cookies, headers } from "next/headers";
import { LANG_CODES, LANG_COOKIE, COUNTRY_COOKIE, ANYWHERE, pickLang, makeT } from "./i18n";
import { isCountry } from "./countries";
import en from "@/locales/en";
import es from "@/locales/es";
import pt from "@/locales/pt";
import fr from "@/locales/fr";
import de from "@/locales/de";
import it from "@/locales/it";
import nl from "@/locales/nl";
import pl from "@/locales/pl";
import hi from "@/locales/hi";
import ja from "@/locales/ja";

const ALL = { en, es, pt, fr, de, it, nl, pl, hi, ja };

// Any word a translation is missing comes from English, so the page never shows a blank.
function merge(base, over) {
  if (Array.isArray(base)) return base.map((b, i) => (over && over[i] !== undefined ? merge(b, over[i]) : b));
  if (base && typeof base === "object") {
    const out = {};
    for (const k of Object.keys(base)) out[k] = merge(base[k], over ? over[k] : undefined);
    return out;
  }
  return over !== undefined && over !== "" ? over : base;
}
const DICTS = Object.fromEntries(Object.entries(ALL).map(([k, d]) => [k, k === "en" ? en : merge(en, d)]));

export const dictFor = (lang) => DICTS[lang] || en;

// The visitor's language: their saved choice, else their browser's language, else English.
export async function getLang() {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  if (LANG_CODES.includes(saved)) return saved;
  return pickLang((await headers()).get("accept-language"));
}

export async function getT() {
  const lang = await getLang();
  const dict = dictFor(lang);
  return { lang, dict, t: makeT(dict) };
}

// Where they want to work: their saved choice, else the country Vercel sees them in, else the US.
export async function getCountry() {
  const saved = (await cookies()).get(COUNTRY_COOKIE)?.value;
  if (saved === ANYWHERE || isCountry(saved)) return saved;
  const seen = (await headers()).get("x-vercel-ip-country");
  return isCountry(seen) ? seen : "US";
}
