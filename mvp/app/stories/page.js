import { getT } from "@/lib/i18n-server";
import { countryList } from "@/lib/countries";
import { approvedStories, pathSummary, FIELDS, MIN_FOR_SUMMARY } from "@/lib/stories";
import { StoryMeta, StoryPath } from "./story-parts";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("stories.metaTitle"), description: t("stories.sub") };
}

// Stories: real paths into sports, step by step, so job seekers can work backwards from what actually worked.
// Filters are a plain form (works without JavaScript). The "paths into this field" summary only appears
// once a field has enough stories, so one person's path is never shown as a pattern.
export default async function Stories({ searchParams }) {
  const { field: f, country: c } = await searchParams;
  const [{ t, lang }, all] = await Promise.all([getT(), approvedStories()]);
  const field = FIELDS.includes(f) ? f : "";
  const country = /^[A-Z]{2}$/.test(c || "") ? c : "";
  const list = all.filter((s) => (!field || s.field === field) && (!country || s.country === country));
  const summary = field ? pathSummary(all.filter((s) => s.field === field)) : null;
  const usedCountries = new Set(all.map((s) => s.country).filter(Boolean));

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">{t("stories.eyebrow")}</p>
        <h1>{t("stories.title")} <span className="gold-text">{t("stories.titleGold")}</span></h1>
        <p className="muted">{t("stories.sub")}</p>
        <p><a className="cta" href="/stories/new">{t("stories.share")}</a></p>
      </div>

      {all.length > 0 && (
        <form className="card story-filters" method="get" action="/stories">
          <div className="row">
            <div>
              <label htmlFor="st-field">{t("stories.field")}</label>
              <select id="st-field" name="field" defaultValue={field}>
                <option value="">{t("stories.allFields")}</option>
                {FIELDS.map((x) => <option key={x} value={x}>{t(`stories.fields.${x}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="st-country">{t("stories.country")}</label>
              <select id="st-country" name="country" defaultValue={country}>
                <option value="">{t("stories.allCountries")}</option>
                {countryList(lang).filter(([code]) => usedCountries.has(code)).map(([code, n]) => <option key={code} value={code}>{n}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="ghost">{t("stories.filter")}</button>
        </form>
      )}

      {field && (
        <div className="card story-summary">
          <h2>{t("stories.summaryTitle", { field: t(`stories.fields.${field}`) })}</h2>
          {summary ? (
            <>
              <ul className="plain-steps">
                {summary.rows.map(([k, n]) => <li key={k}>{t("stories.summaryRow", { n, total: summary.total, kind: t(`stories.kinds.${k}`) })}</li>)}
              </ul>
              <p className="muted"><small>{t("stories.summaryVouched", { n: summary.vouched, total: summary.total })}</small></p>
            </>
          ) : (
            <p className="muted">{t("stories.summaryWait", { n: MIN_FOR_SUMMARY })}</p>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <div className="card">
          <p>{all.length ? t("stories.noneMatch") : t("stories.empty")}</p>
          <p><a href="/stories/new">{t("stories.beFirst")}</a></p>
        </div>
      ) : (
        <ul className="story-list">
          {list.map((s) => (
            <li key={s.id} className="card story-card">
              <h2><a href={`/stories/${s.id}`}>{s.display_name}</a></h2>
              <StoryMeta s={s} t={t} lang={lang} />
              <StoryPath steps={(s.steps || []).slice(0, 4)} t={t} />
              {(s.steps || []).length > 4 && <p className="muted"><small>{t("stories.more", { n: s.steps.length - 4 })}</small></p>}
              <p><a href={`/stories/${s.id}`}>{t("stories.read")}</a></p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
