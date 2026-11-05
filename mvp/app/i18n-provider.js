"use client";
import { createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LANGS, LANG_COOKIE, COUNTRY_COOKIE, ANYWHERE, makeT, setCookie } from "@/lib/i18n";
import { countryList } from "@/lib/countries";

// The visitor's language for browser components: the server passes in one dictionary (not all ten).
const I18n = createContext({ lang: "en", dict: {}, country: "US", t: (k) => k });

export function I18nProvider({ lang, dict, country, children }) {
  const value = useMemo(() => ({ lang, dict, country, t: makeT(dict) }), [lang, dict, country]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useT = () => useContext(I18n);

// "Jobs in: [country]" above a job search. Every country is listed (names in the visitor's language), plus
// "Anywhere". The choice is saved in a cookie; onChange lets the search run again for the new country.
export function CountryPicker({ onChange }) {
  const router = useRouter();
  const { lang, country, t } = useT();
  const list = useMemo(() => countryList(lang), [lang]);
  return (
    <label className="country-picker">
      <span>{t("search.jobsIn")}</span>
      <select value={country} onChange={(e) => { setCookie(COUNTRY_COOKIE, e.target.value); router.refresh(); onChange?.(e.target.value); }}>
        <option value={ANYWHERE}>{t("search.anywhere")}</option>
        {list.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
    </label>
  );
}

// Top-bar language menu. The choice is saved in a cookie and the page redraws in that language.
export function LanguagePicker() {
  const router = useRouter();
  const { lang, t } = useT();
  return (
    <label className="lang-picker">
      <span className="visually-hidden">{t("nav.language")}</span>
      <select value={lang} onChange={(e) => { setCookie(LANG_COOKIE, e.target.value); router.refresh(); }}>
        {LANGS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
    </label>
  );
}
