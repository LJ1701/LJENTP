import { notFound } from "next/navigation";
import { CAREER_PATHS, CAREER_SLUGS, pathName, labelIn, gapStepIn, SKILLS, INTERESTS } from "@/lib/careers";
import { getT, getCountry } from "@/lib/i18n-server";
import { searchJobs } from "@/lib/jobs";
import { countryName } from "@/lib/countries";

export const dynamic = "force-dynamic";

const indexOf = (slug) => CAREER_SLUGS.indexOf(slug);
// "today" / "3 days ago" (the same wording as the job search; that helper lives in a browser-only file).
const agoText = (t, iso) => {
  const days = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  return days === 0 ? t("time.today") : days === 1 ? t("time.oneDay") : t("time.days", { n: days });
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const i = indexOf(slug);
  if (i < 0) return {};
  const { t, dict } = await getT();
  const role = pathName(dict, i);
  return { title: t("careers.metaTitle", { role }), description: t("careers.metaDescription", { role }), alternates: { canonical: `/careers/${slug}` } };
}

// One sports career path: the skills employers look for, how to show each one this week, a first step, and
// live open jobs (the same sources as the job search). Everything comes from the app's career data and real postings.
export default async function CareerPage({ params }) {
  const { slug } = await params;
  const i = indexOf(slug);
  if (i < 0) notFound();
  const [{ t, lang, dict }, country] = await Promise.all([getT(), getCountry()]);
  const path = CAREER_PATHS[i];
  const role = pathName(dict, i);
  const skills = path.tags.filter((tag) => SKILLS[tag]);
  const interests = path.tags.filter((tag) => INTERESTS[tag]);
  const res = await searchJobs({ keywords: path.search, location: "", country });
  const jobs = res.error ? [] : res.jobs.slice(0, 6);
  const place = country === "ANY" ? t("search.everywhere") : countryName(country, lang);

  return (
    <>
      <div className="page-head">
        <p className="eyebrow"><a href="/careers">{t("careers.eyebrow")}</a></p>
        <h1>{role}</h1>
        <p className="muted">{t("careers.intro", { role })}</p>
      </div>

      <div className="card">
        <h2>{t("careers.skillsTitle")}</h2>
        <ul className="career-skills">
          {skills.map((tag) => <li key={tag}><strong>{labelIn(dict, tag)}</strong><br /><small>{t("careers.showIt")} {gapStepIn(dict, tag).replace(`${labelIn(dict, tag)}: `, "")}</small></li>)}
        </ul>
        {interests.length > 0 && <p><small>{t("careers.goodFit")} {interests.map((tag) => labelIn(dict, tag)).join(" · ")}</small></p>}
        <h3>{t("careers.firstStep")}</h3>
        <p>{(dict.paths && dict.paths[i] && dict.paths[i].nextStep) || path.nextStep}</p>
      </div>

      <div className="card">
        <h2>{t("careers.jobsTitle", { place })}</h2>
        {jobs.length ? (
          <>
            <p className="muted"><small>{t("careers.jobsCount", { n: res.total })}</small></p>
            <ul className="career-jobs">
              {jobs.map((j) => (
                <li key={j.id}><a href={j.url} target="_blank" rel="noopener noreferrer">{j.title}</a><br /><small className="muted">{j.company}{j.location && ` · ${j.location}`}{j.created && ` · ${t("jobs.posted", { ago: agoText(t, j.created) })}`}</small></li>
              ))}
            </ul>
          </>
        ) : <p>{t("careers.noJobs")}</p>}
        <p><small>{t("careers.jobsNote")}</small></p>
      </div>

      <div className="card center">
        <h2>{t("careers.ctaTitle", { role })}</h2>
        <p>{t("careers.ctaText")}</p>
        <a className="cta" href="/">{t("careers.cta")}</a>
      </div>

      <p className="center"><small>{t("careers.others")} {CAREER_PATHS.map((_, k) => k !== i && <span key={k}><a href={`/careers/${CAREER_SLUGS[k]}`}>{pathName(dict, k)}</a>{" · "}</span>)}</small></p>
    </>
  );
}
