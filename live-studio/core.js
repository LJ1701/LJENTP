// LJ LIVE Studio core: languages, small DOM helpers and the AI call. studio.js holds the app itself.

const LANG_KEY = "ljlive_lang";
const LANGS = {
  en: "English", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", it: "Italiano",
  zh: "中文", ja: "日本語", hi: "हिन्दी", ar: "العربية"
};
const SPEECH_LANGS = { en: "en-US", es: "es-ES", fr: "fr-FR", pt: "pt-BR", de: "de-DE", it: "it-IT", zh: "zh-CN", ja: "ja-JP", hi: "hi-IN", ar: "ar-SA" };
const RTL_LANGS = ["ar"];

// English, Spanish, Chinese and Arabic live in studio.js; the others load from locales/ when picked.
const I18N = {
  en: { aiErrGeneric: "Something went wrong. Try again.", appTag: "by LJSOCCER · @ljsoccer01", alsoFrom: "Also from LJSOCCER:" },
  es: { aiErrGeneric: "Algo salió mal. Inténtalo de nuevo.", appTag: "por LJSOCCER · @ljsoccer01", alsoFrom: "También de LJSOCCER:" },
  zh: { aiErrGeneric: "出了点问题，请重试。", appTag: "LJSOCCER 出品 · @ljsoccer01", alsoFrom: "LJSOCCER 的其他产品：" },
  ar: { aiErrGeneric: "حدث خطأ ما. حاول مرة أخرى.", appTag: "من LJSOCCER · @ljsoccer01", alsoFrom: "أيضًا من LJSOCCER:" }
};
const EXTRA = {
  fr: ["par LJSOCCER · @ljsoccer01", "Aussi par LJSOCCER :"], pt: ["pela LJSOCCER · @ljsoccer01", "Também da LJSOCCER:"],
  de: ["von LJSOCCER · @ljsoccer01", "Auch von LJSOCCER:"], it: ["di LJSOCCER · @ljsoccer01", "Anche da LJSOCCER:"],
  hi: ["LJSOCCER द्वारा · @ljsoccer01", "LJSOCCER से और:"], ja: ["LJSOCCER · @ljsoccer01", "LJSOCCERのほかのアプリ："]
};

let currentLang = "en";
try {
  currentLang = localStorage.getItem(LANG_KEY) || (navigator.language || "en").slice(0, 2);
} catch {
  // storage unavailable; English by default
}
if (!LANGS[currentLang]) currentLang = "en";

const loadedLocales = new Set(["en", "es", "zh", "ar"]);
const localeLoads = {};

// Locale files are shared with LJSportMind; only their interface text is used here.
function registerLocale(code, pack) {
  I18N[code] = Object.assign(I18N[code] || {}, pack.ui);
  if (EXTRA[code]) Object.assign(I18N[code], { appTag: EXTRA[code][0], alsoFrom: EXTRA[code][1] });
  loadedLocales.add(code);
}

function loadLocale(code) {
  if (!localeLoads[code]) {
    localeLoads[code] = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `locales/${code}.js`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }
  return localeLoads[code];
}

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

function tf(key, vars) {
  return Object.entries(vars || {}).reduce((str, [k, v]) => str.split("{" + k + "}").join(v), t(key));
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function tag(name) {
  return String(name).replace(/[^a-zA-Z0-9]/g, "");
}

async function callAssistant(payload) {
  try {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, lang: currentLang })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.text) return { error: t("aiErrGeneric"), code: body.error || "" };
    return { text: body.text };
  } catch {
    return { error: t("aiErrGeneric") };
  }
}

// ---- Language picker ----
const langSelect = document.getElementById("langSelect");
Object.entries(LANGS).forEach(([code, name]) => {
  const option = document.createElement("option");
  option.value = code;
  option.textContent = name;
  langSelect.append(option);
});
langSelect.value = currentLang;

function applyLanguage(lang) {
  if (!LANGS[lang]) lang = "en";
  if (!loadedLocales.has(lang)) {
    loadLocale(lang).then(() => {
      langSelect.value = lang;
      langSelect.dispatchEvent(new Event("change"));
    }).catch(() => applyLanguage("en"));
    return;
  }
  currentLang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // choice won't persist
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  document.querySelectorAll(".app-chrome [data-i18n]").forEach((n) => (n.textContent = t(n.dataset.i18n)));
}
langSelect.addEventListener("change", () => applyLanguage(langSelect.value));

// AI buttons stay hidden unless the server confirms the AI key works.
fetch("/api/config").then((r) => (r.ok ? r.json() : {})).then((cfg) => {
  document.body.classList.toggle("ai-on", !!cfg.aiEnabled);
}).catch(() => {});
applyLanguage(currentLang);
