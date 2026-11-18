import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n-server";
import { countryList } from "@/lib/countries";
import { FIELDS, STEP_KINDS, PAY_RANGES, MAX_STEPS } from "@/lib/stories";
import { saveStory, deleteStory } from "../actions";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("stories.formMeta") };
}

// Write or edit your own story. Needs a saved account (guests can't post). The author publishes it themselves,
// or keeps it as a draft only they can see.
export default async function NewStory({ searchParams }) {
  const { saved, deleted, error } = await searchParams;
  const { t, lang } = await getT();
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();

  if (!user || user.is_anonymous) {
    return (
      <div className="card auth-card" id="form">
        <h1>{t("stories.formTitle")}</h1>
        <p>{user ? t("stories.saveFirst") : t("stories.signInFirst")}</p>
        <a className="cta" href={user ? "/profile?tab=profile" : "/#start"}>{user ? t("stories.goSave") : t("stories.goSignIn")}</a>
      </div>
    );
  }

  const { data: mine } = await db.from("stories").select("*").eq("user_id", user.id).maybeSingle();
  const s = mine || {};
  const steps = Array.isArray(s.steps) ? s.steps : [];
  const rows = Math.min(MAX_STEPS, Math.max(6, steps.length + 2));
  const vouched = s.vouched === true ? "yes" : s.vouched === false ? "no" : "";

  return (
    <>
      <div className="page-head">
        <p className="eyebrow"><a href="/stories">{t("stories.back")}</a></p>
        <h1>{t("stories.formTitle")}</h1>
        <p className="muted">{t("stories.formSub")}</p>
      </div>

      <div className="card" id="form">
        {saved === "live" && <p className="ok">{t("stories.published")} <a href="/stories">{t("stories.seeIt")}</a></p>}
        {saved === "draft" && <p className="ok">{t("stories.drafted")}</p>}
        {deleted && <p className="ok">{t("stories.deleted")}</p>}
        {mine && !saved && <p className="muted">{t(`stories.status.${mine.status}`)}</p>}
        {error && <p className="error">{error}</p>}
        <form action={saveStory}>
          <div className="row">
            <div><label htmlFor="sf-name">{t("stories.name")}</label><input id="sf-name" name="display_name" type="text" required maxLength={60} defaultValue={s.display_name || ""} placeholder={t("stories.namePh")} /></div>
            <div><label htmlFor="sf-role">{t("stories.role")}</label><input id="sf-role" name="role_title" type="text" required maxLength={120} defaultValue={s.role_title || ""} placeholder={t("stories.rolePh")} /></div>
          </div>
          <div className="row">
            <div>
              <label htmlFor="sf-field">{t("stories.field")}</label>
              <select id="sf-field" name="field" defaultValue={s.field || "other"}>
                {FIELDS.map((x) => <option key={x} value={x}>{t(`stories.fields.${x}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sf-country">{t("stories.country")} <small>({t("evidence.optional")})</small></label>
              <select id="sf-country" name="country" defaultValue={s.country || ""}>
                <option value="">—</option>
                {countryList(lang).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </div>
          </div>

          <fieldset className="story-steps-form">
            <legend>{t("stories.stepsTitle")}</legend>
            <p className="muted"><small>{t("stories.stepsHint")}</small></p>
            {Array.from({ length: rows }, (_, i) => {
              const st = steps[i] || {};
              return (
                <div className="story-step-row" key={i}>
                  <select name="step_kind" defaultValue={st.kind || "other"} aria-label={t("stories.stepKind", { n: i + 1 })}>
                    {STEP_KINDS.map((k) => <option key={k} value={k}>{t(`stories.kinds.${k}`)}</option>)}
                  </select>
                  <input name="step_year" type="number" min="1950" max="2100" defaultValue={st.year || ""} placeholder={t("stories.year")} aria-label={t("stories.stepYear", { n: i + 1 })} />
                  <input name="step_text" type="text" maxLength={200} defaultValue={st.text || ""} placeholder={i === 0 ? t("stories.stepPh") : ""} aria-label={t("stories.stepText", { n: i + 1 })} />
                </div>
              );
            })}
          </fieldset>

          <label htmlFor="sf-helped">{t("stories.helped")} <small>({t("evidence.optional")})</small></label>
          <textarea id="sf-helped" name="helped" rows={3} maxLength={500} defaultValue={s.helped || ""} />
          <label htmlFor="sf-vouched">{t("stories.vouched")}</label>
          <select id="sf-vouched" name="vouched" defaultValue={vouched}>
            <option value="">{t("stories.skip")}</option>
            <option value="yes">{t("stories.yes")}</option>
            <option value="no">{t("stories.no")}</option>
          </select>
          <label htmlFor="sf-advice">{t("stories.advice")} <small>({t("evidence.optional")})</small></label>
          <textarea id="sf-advice" name="advice" rows={4} maxLength={1000} defaultValue={s.advice || ""} />
          <label htmlFor="sf-pay">{t("stories.payLabel")} <small>({t("evidence.optional")})</small></label>
          <select id="sf-pay" name="pay_range" defaultValue={s.pay_range || ""}>
            <option value="">{t("stories.skip")}</option>
            {PAY_RANGES.map((p) => <option key={p} value={p}>{t(`stories.pay.${p}`)}</option>)}
          </select>
          <label className="check-line"><input type="checkbox" name="link_proof" defaultChecked={!!s.link_proof} /> {t("stories.linkProof")}</label>
          {mine && mine.status === "rejected" ? <p className="error">{t("stories.status.rejected")}</p> : (
            <div className="job-actions">
              <button type="submit" name="publish" value="1">{t("stories.publish")}</button>
              <button type="submit" name="publish" value="0" className="ghost">{t("stories.saveDraft")}</button>
            </div>
          )}
          <p className="muted"><small>{t("stories.privacy")}</small></p>
        </form>
        {mine && (
          <form action={deleteStory}>
            <button type="submit" className="ghost">{t("stories.delete")}</button>
          </form>
        )}
      </div>
    </>
  );
}
