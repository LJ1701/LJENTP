"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../i18n-provider";
import { setCookie, COUNTRY_COOKIE, ANYWHERE } from "@/lib/i18n";

const MAX = 10;
// Same cookie the "Jobs in" menu uses (app/i18n-provider.js).
const setCountry = (code) => setCookie(COUNTRY_COOKIE, code);

// A small country chooser for the Passport form: pick from the list, see chips, remove with ×.
// Sends one hidden <input name={name}> per country, so the server form saves them like checkboxes.
export function CountryChips({ name, label, initial = [], hint }) {
  const { t, countries } = useT();
  const [picked, setPicked] = useState(initial.filter((c) => countries.some(([code]) => code === c)));
  const nameOf = (code) => countries.find(([c]) => c === code)?.[1] || code;
  return (
    <div className="country-chips">
      <label htmlFor={`${name}-add`}>{label}</label>
      {hint && <p className="muted"><small>{hint}</small></p>}
      {picked.map((c) => <input key={c} type="hidden" name={name} value={c} />)}
      {picked.length > 0 && (
        <ul className="chips">
          {picked.map((c) => (
            <li key={c}>{nameOf(c)} <button type="button" className="ghost mini" aria-label={t("work.remove", { country: nameOf(c) })} onClick={() => setPicked(picked.filter((x) => x !== c))}>×</button></li>
          ))}
        </ul>
      )}
      {picked.length < MAX ? (
        <select id={`${name}-add`} value="" onChange={(e) => { const c = e.target.value; if (c && !picked.includes(c)) setPicked([...picked, c]); }}>
          <option value="">{t("work.add")}</option>
          {countries.filter(([c]) => !picked.includes(c)).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      ) : <p className="muted"><small>{t("work.max", { n: MAX })}</small></p>}
    </div>
  );
}

// Jobs tab: if the "Jobs in" country isn't one the user said they can work in, say so neutrally and
// offer one-click searches in the countries they listed. No legal or visa advice, ever.
export function WorkCountryNote({ work = [], regions = {} }) {
  const { t, country, countries } = useT();
  const router = useRouter();
  const nameOf = (code) => countries.find(([c]) => c === code)?.[1] || code;
  if (!work.length) return <p className="work-note muted"><small>{t("work.jobsNone")} <a href="/profile?tab=profile" data-tab-link="profile">{t("work.addInProfile")}</a></small></p>;
  const inRegion = regions[country] && work.some((c) => regions[country].includes(c));
  if (country === ANYWHERE || work.includes(country) || inRegion) return null;
  return (
    <div className="work-note">
      <p><small>{t("work.jobsOutside", { country: nameOf(country) || country })}</small></p>
      <div className="ref-actions">
        {work.slice(0, 4).map((c) => (
          <button key={c} type="button" className="ghost mini" onClick={() => { setCountry(c); router.refresh(); }}>{t("work.searchIn", { country: nameOf(c) })}</button>
        ))}
      </div>
    </div>
  );
}
