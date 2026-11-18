import { getT } from "@/lib/i18n-server";
import { countryList } from "@/lib/countries";
import { approvedRoles } from "@/lib/employer-roles";
import { postRole } from "./actions";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("employers.metaTitle"), description: t("employers.sub") };
}

// For employers: what they get (candidates with proof), and a short form to post a role by linking the
// posting they already have on LinkedIn, Indeed, TeamWork Online or their own site. Free during early access.
export default async function Employers({ searchParams }) {
  const { posted, error } = await searchParams;
  const [{ t, lang, dict }, roles] = await Promise.all([getT(), approvedRoles()]);
  const E = dict.employers;
  return (
    <>
      <div className="page-head">
        <p className="eyebrow">{t("employers.eyebrow")}</p>
        <h1>{t("employers.title")} <span className="gold-text">{t("employers.titleGold")}</span></h1>
        <p className="muted">{t("employers.sub")}</p>
        <p><a className="cta" href="#post">{t("employers.cta")}</a></p>
      </div>

      <div className="card">
        <h2>{t("employers.seeTitle")}</h2>
        <ol className="how-strip employer-how">
          {E.see.map(([title, text], i) => (
            <li key={title}><span className="step-num">{i + 1}</span><div><strong>{title}</strong><span>{text}</span></div></li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h2>{t("employers.howTitle")}</h2>
        <ol className="plain-steps">{E.how.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="muted"><small>{t("employers.price")}</small></p>
      </div>

      <div className="card" id="post">
        <h2>{t("employers.formTitle")}</h2>
        {posted ? <p className="ok">{t("employers.thanks")}</p> : (
          <form action={postRole} className="pilot-form">
            {error && <p className="error">{error}</p>}
            <div className="row">
              <div><label htmlFor="em-company">{t("employers.company")}</label><input id="em-company" name="company" type="text" required maxLength={120} /></div>
              <div><label htmlFor="em-role">{t("employers.roleTitle")}</label><input id="em-role" name="role_title" type="text" required maxLength={120} placeholder={t("employers.rolePh")} /></div>
            </div>
            <label htmlFor="em-url">{t("employers.link")}</label>
            <input id="em-url" name="posting_url" type="url" required maxLength={300} placeholder="https://www.linkedin.com/jobs/view/…" />
            <p className="muted"><small>{t("employers.linkHint")}</small></p>
            <label htmlFor="em-country">{t("employers.country")} <small>({t("evidence.optional")})</small></label>
            <select id="em-country" name="country" defaultValue="">
              <option value="">{t("employers.anyCountry")}</option>
              {countryList(lang).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
            <div className="row">
              <div><label htmlFor="em-name">{t("employers.name")}</label><input id="em-name" name="contact_name" type="text" required maxLength={100} /></div>
              <div><label htmlFor="em-email">{t("employers.email")}</label><input id="em-email" name="contact_email" type="email" required maxLength={200} /></div>
            </div>
            <label className="check-line"><input type="checkbox" name="wants_proof" defaultChecked /> {t("employers.wantsProof")}</label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <button type="submit">{t("employers.submit")}</button>
            <p className="muted"><small>{t("employers.privacy")}</small></p>
          </form>
        )}
      </div>

      {roles.length > 0 && (
        <div className="card">
          <h2>{t("employers.liveTitle", { n: roles.length })}</h2>
          <ul className="role-list">{roles.slice(0, 10).map((r) => <li key={r.id}><strong>{r.role_title}</strong> · {r.company}</li>)}</ul>
        </div>
      )}
    </>
  );
}
