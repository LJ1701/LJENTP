// Languages the app is translated into, and the small helpers both server and browser code use.
// The words themselves live in mvp/locales/<code>.js; the server picks one language per visitor
// (lib/i18n-server.js) and hands only that dictionary to the browser.
export const LANGS = [
  ["en", "English"], ["es", "Español"], ["pt", "Português"], ["fr", "Français"], ["de", "Deutsch"],
  ["it", "Italiano"], ["nl", "Nederlands"], ["pl", "Polski"], ["hi", "हिन्दी"], ["ja", "日本語"]
];
export const LANG_CODES = LANGS.map(([c]) => c);
// English names, for telling the AI which language to answer in.
export const LANG_ENGLISH = { en: "English", es: "Spanish", pt: "Portuguese", fr: "French", de: "German", it: "Italian", nl: "Dutch", pl: "Polish", hi: "Hindi", ja: "Japanese" };

export const LANG_COOKIE = "lang";
export const COUNTRY_COOKIE = "country";
export const ANYWHERE = "ANY";

// Picks a supported language from an Accept-Language header ("es-MX,es;q=0.9,en;q=0.8" -> "es").
export function pickLang(header) {
  for (const part of String(header || "").split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (LANG_CODES.includes(code)) return code;
  }
  return "en";
}

// "Hi {name}" + { name: "Ana" } -> "Hi Ana". Missing values become "".
export function fill(text, vars) {
  return String(text ?? "").replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ""));
}

// t("home.title", { n: 3 }) from a dictionary object. Falls back to the key itself so a gap is visible, not blank.
export function makeT(dict) {
  return (key, vars) => {
    const value = key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);
    return typeof value === "string" ? fill(value, vars) : key;
  };
}

// Saves a choice for a year in a cookie the server reads on the next request.
export function setCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}
