import CopyButton from "./copy-button";
import { countryName } from "@/lib/countries";

// Jobs tab: roles employers posted on The Assist. Candidates apply where the employer posted it
// (LinkedIn, Indeed, TeamWork Online or the employer's site) and include their proof link.
export default function EmployerRoles({ roles, proofUrl, t, lang }) {
  if (!roles.length) return null;
  return (
    <div className="card employer-roles">
      <h3>{t("postedRoles.title")}</h3>
      <p className="muted"><small>{t("postedRoles.sub")}</small></p>
      {proofUrl ? (
        <div className="ref-actions"><small>{t("postedRoles.includeLink")}</small> <CopyButton text={proofUrl} label={t("postedRoles.copyLink")} /></div>
      ) : <p className="warn"><small>{t("postedRoles.noLink")} <a href="/profile?tab=share" data-tab-link="share">{t("postedRoles.turnOn")}</a></small></p>}
      <ul className="role-list">
        {roles.map((r) => (
          <li key={r.id}>
            <div><strong>{r.role_title}</strong> · {r.company}{r.country && <span className="muted"> · {countryName(r.country, lang)}</span>}</div>
            <a className="cta small" href={r.posting_url} target="_blank" rel="noopener noreferrer nofollow">{t(`postedRoles.applyOn.${r.source}`)} ↗</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
