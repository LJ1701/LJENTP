import { CAREER_PATHS, CAREER_SLUGS, pathName, labelIn, SKILLS } from "@/lib/careers";
import { getT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("careers.indexTitle"), description: t("careers.indexDescription"), alternates: { canonical: "/careers" } };
}

// Public guide to the 8 sports career paths: open to everyone, no account needed, so search engines can find it.
export default async function Careers() {
  const { t, dict } = await getT();
  return (
    <>
      <div className="page-head">
        <p className="eyebrow">{t("careers.eyebrow")}</p>
        <h1>{t("careers.indexH1")} <span className="gold-text">{t("careers.indexH1Gold")}</span></h1>
        <p className="muted">{t("careers.indexSub")}</p>
      </div>
      <div className="career-grid">
        {CAREER_PATHS.map((c, i) => (
          <a key={i} href={`/careers/${CAREER_SLUGS[i]}`} className="card career-tile">
            <h2>{pathName(dict, i)}</h2>
            <p className="muted"><small>{c.tags.filter((tag) => SKILLS[tag]).map((tag) => labelIn(dict, tag)).join(" · ")}</small></p>
            <span>{t("careers.read")} →</span>
          </a>
        ))}
      </div>
      <p className="center"><a className="cta" href="/">{t("careers.cta")}</a></p>
    </>
  );
}
