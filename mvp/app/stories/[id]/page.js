import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n-server";
import { approvedStories } from "@/lib/stories";
import { StoryMeta, StoryPath } from "../story-parts";
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

// One story: the path as a timeline, what helped, the advice, and (only if the author linked it and their
// public link is on) their proof page. The "Ask for feedback" box is a waitlist that tests demand for paid
// feedback: nothing is charged and the author isn't contacted.
export default async function Story({ params, searchParams }) {
  const { id } = await params;
  const { asked } = await searchParams;
  const [{ t, lang }, s] = await Promise.all([getT(), find(id)]);
  if (!s) notFound();
  return (
    <>
      <div className="page-head">
        <p className="eyebrow"><a href="/stories">{t("stories.back")}</a></p>
        <h1>{s.display_name}</h1>
        <StoryMeta s={s} t={t} lang={lang} />
        {s.proof_code && <p><a href={`/p/${s.proof_code}`}>{t("stories.seeProof", { name: s.display_name })}</a></p>}
      </div>

      <div className="card">
        <h2>{t("stories.pathTitle")}</h2>
        <StoryPath steps={s.steps} t={t} />
      </div>

      {(s.helped || s.vouched !== null) && (
        <div className="card">
          <h2>{t("stories.helpedTitle")}</h2>
          {s.helped && <p className="story-text">{s.helped}</p>}
          {s.vouched !== null && <p className="muted">{s.vouched ? t("stories.vouchedYes") : t("stories.vouchedNo")}</p>}
        </div>
      )}

      {s.advice && (
        <div className="card">
          <h2>{t("stories.adviceTitle", { name: s.display_name })}</h2>
          <p className="story-text">{s.advice}</p>
        </div>
      )}

      {s.pay_range && <p className="muted center"><small>{t("stories.payShown", { range: t(`stories.pay.${s.pay_range}`) })}</small></p>}

      <div className="card" id="ask">
        <h2>{t("stories.askTitle", { name: s.display_name })}</h2>
        {asked ? <p className="ok">{t("stories.askThanks")}</p> : (
          <form action={joinWaitlist}>
            <p className="muted">{t("stories.askText")}</p>
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
