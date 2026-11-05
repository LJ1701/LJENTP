"use client";
import { createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LANGS, LANG_COOKIE, COUNTRY_COOKIE, ANYWHERE, makeT, setCookie } from "@/lib/i18n";

// The visitor's language for browser components: the server passes in one dictionary (not all ten).
const I18n = createContext({ lang: "en", dict: {}, country: "US", countries: [], regions: [], t: (k) => k });

// countries: the country picker's list, built once on the server so the browser shows exactly the same names
// (browsers and the server can spell some country names differently, which breaks the page on load).
export function I18nProvider({ lang, dict, country, countries, regions, children }) {
  const value = useMemo(() => ({ lang, dict, country, countries, regions, t: makeT(dict) }), [lang, dict, country, countries, regions]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useT = () => useContext(I18n);

// "Jobs in: [country]" above a job search. Every country is listed (names in the visitor's language), plus
// "Anywhere". The choice is saved in a cookie; onChange lets the search run again for the new country.
export function CountryPicker({ onChange }) {
  const router = useRouter();
  const { country, countries: list, regions, t } = useT();
  return (
    <label className="country-picker">
      <span>{t("search.jobsIn")}</span>
      <select value={country} onChange={(e) => { setCookie(COUNTRY_COOKIE, e.target.value); router.refresh(); onChange?.(e.target.value); }}>
        <option value={ANYWHERE}>{t("search.anywhere")}</option>
        <optgroup label={t("search.regions")}>
          {regions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </optgroup>
        <optgroup label={t("search.countries")}>
          {list.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </optgroup>
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
