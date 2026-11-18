import { getT } from "@/lib/i18n-server";
import { approvedStories, pathSummary, FIELDS, MIN_FOR_SUMMARY } from "@/lib/stories";
import { StoryHead, FactsLine, unquote } from "./story-parts";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("stories.metaTitle"), description: t("stories.sub") };
}

// Stories: real paths into sports, told by the people who took them. Each card leads with the person and
// their own advice. Field "chips" appear only once stories span more than one field (no dropdowns).
export default async function Stories({ searchParams }) {
  const { field: f } = await searchParams;
  const [{ t }, all] = await Promise.all([getT(), approvedStories()]);
  const used = FIELDS.filter((x) => all.some((s) => s.field === x));
  const field = used.includes(f) ? f : "";
  const list = field ? all.filter((s) => s.field === field) : all;
  const summary = field ? pathSummary(list) : null;

  return (
    <>
      <div className="page-head stories-head">
        <p className="eyebrow">{t("stories.eyebrow")}</p>
        <h1>{t("stories.title")} <span className="gold-text">{t("stories.titleGold")}</span></h1>
        <p className="muted">{t("stories.sub")}</p>
      </div>

      {used.length > 1 && (
        <nav className="story-chips" aria-label={t("stories.field")}>
          <a href="/stories" className={!field ? "on" : ""}>{t("stories.all")}</a>
          {used.map((x) => <a key={x} href={`/stories?field=${x}`} className={field === x ? "on" : ""}>{t(`stories.fields.${x}`)}</a>)}
        </nav>
      )}

      {field && summary && (
        <div className="card story-summary">
          <h2>{t("stories.summaryTitle", { field: t(`stories.fields.${field}`) })}</h2>
          <ul className="plain-steps">
            {summary.rows.map(([k, n]) => <li key={k}>{t("stories.summaryRow", { n, total: summary.total, kind: t(`stories.kinds.${k}`) })}</li>)}
          </ul>
          <p className="muted"><small>{t("stories.summaryVouched", { n: summary.vouched, total: summary.total })}</small></p>
        </div>
      )}

      {list.length === 0 ? (
        <div className="card"><p>{t("stories.empty")}</p></div>
      ) : (
        <ul className="story-list">
          {list.map((s) => {
            const quote = unquote(s.advice) || unquote(s.helped);
            return (
              <li key={s.id} className="card story-card">
                <StoryHead s={s} t={t} link />
                {quote && <blockquote className="story-quote">{quote.length > 220 ? `${quote.slice(0, 217).trimEnd()}…` : quote}</blockquote>}
                <FactsLine s={s} t={t} />
                <a className="story-read" href={`/stories/${s.id}`}>{t("stories.readStory", { name: s.display_name })}</a>
              </li>
            );
          })}
        </ul>
      )}

      <div className="card story-invite-wide">
        <div>
          <h2>{t("stories.cardTitle")}</h2>
          <p className="muted">{t("stories.cardText")}</p>
        </div>
        <a className="cta" href="/stories/new">{t("stories.share")}</a>
      </div>
      {field && !summary && list.length > 0 && <p className="muted center"><small>{t("stories.summaryWait", { n: MIN_FOR_SUMMARY })}</small></p>}
    </>
  );
}
