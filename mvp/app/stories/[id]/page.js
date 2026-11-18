import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n-server";
import { countryName } from "@/lib/countries";
import { approvedStories } from "@/lib/stories";
import { StoryHead, StoryPath, FactsLine, unquote } from "../story-parts";
import { joinWaitlist } from "../actions";

export const dynamic = "force-dynamic";

async function find(id) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return (await approvedStories()).find((s) => s.id === id) || null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const [{ t }, s] = await Promise.all([getT(), find(id)]);
  return s ? { title: t("stories.storyTitle", { name: s.display_name }), description: s.role_title } : { title: t("stories.metaTitle") };
}

// One story, told personally: who they are, their advice up front, the turning points (when someone opened
// a door), then the full path. The "Ask for feedback" box is a waitlist that tests demand for paid feedback:
// nothing is charged and the author isn't contacted.
export default async function Story({ params, searchParams }) {
  const { id } = await params;
  const { asked } = await searchParams;
  const [{ t, lang }, s] = await Promise.all([getT(), find(id)]);
  if (!s) notFound();
  const steps = Array.isArray(s.steps) ? s.steps : [];
  const turning = steps.filter((st) => st.kind === "referral");
  const advice = unquote(s.advice);
  const helped = unquote(s.helped);

  return (
    <>
      <p className="eyebrow story-back"><a href="/stories">{t("stories.back")}</a></p>

      <div className="card story-hero">
        <StoryHead s={s} t={t} big />
        <FactsLine s={s} t={t} />
        {s.country && <p className="muted story-where"><small>{countryName(s.country, lang)}</small></p>}
        {advice && (
          <figure className="story-big-quote">
            <figcaption>{t("stories.adviceTitle", { name: s.display_name })}</figcaption>
            <blockquote>{advice}</blockquote>
          </figure>
        )}
        {s.proof_code && <p><a href={`/p/${s.proof_code}`}>{t("stories.seeProof", { name: s.display_name })}</a></p>}
      </div>

      {turning.length > 0 && (
        <div className="card story-turning">
          <h2>{t("stories.turningTitle")}</h2>
          <p className="muted">{t("stories.turningSub")}</p>
          <ul>
            {turning.map((st, i) => <li key={i}><strong>{st.year || "•"}</strong><span>{st.text}</span></li>)}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>{t("stories.fullPath", { name: s.display_name })}</h2>
        <StoryPath steps={steps} t={t} />
      </div>

      {(helped || s.vouched !== null) && (
        <div className="card">
          <h2>{t("stories.helpedTitle")}</h2>
          {helped && <blockquote className="story-quote">{helped}</blockquote>}
          {s.vouched !== null && <p className="muted">{s.vouched ? t("stories.vouchedYes") : t("stories.vouchedNo")}</p>}
        </div>
      )}

      {s.pay_range && <p className="muted center"><small>{t("stories.payShown", { range: t(`stories.pay.${s.pay_range}`) })}</small></p>}

      <div className="card story-ask" id="ask">
        <h2>{t("stories.askTitle", { name: s.display_name })}</h2>
        {asked ? <p className="ok">{t("stories.askThanks")}</p> : (
          <form action={joinWaitlist}>
            <p className="muted">{t("stories.askText", { name: s.display_name })}</p>
            <input type="hidden" name="story_id" value={s.id} />
            <label htmlFor="ask-email">{t("stories.askEmail")} <small>({t("evidence.optional")})</small></label>
            <input id="ask-email" name="email" type="email" maxLength={200} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <button type="submit">{t("stories.askBtn")}</button>
          </form>
        )}
      </div>
      <p className="muted center"><small>{t("stories.disclaimer")}</small></p>
    </>
  );
}
