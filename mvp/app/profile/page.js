import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SKILLS, INTERESTS, SPORTS, ROLES, CAREER_PATHS, topMatches, labelIn, pathName, stepText, jobLinks } from "@/lib/careers";
import { effectiveProfile } from "@/lib/detect";
import { saveProfile, setTarget, setPublic } from "./actions";
import PlanSteps from "./plan-steps";
import ResumeFill from "./resume-fill";
import ResumeBullets from "./resume-bullets";
import Goldie from "../goldie";
import SaveAccount from "./save-account";
import JobSearch, { SearchFor, PendingNote } from "./job-search";
import CopyButton from "./copy-button";
import { billingStatus, FREE_ANSWERS } from "@/lib/billing";
import { joinProgram, leaveProgram } from "../billing/actions";
import ProofBuilder from "./proof-builder";
import { getT, getCountry } from "@/lib/i18n-server";
import { countryName } from "@/lib/countries";

export const dynamic = "force-dynamic";

// The saved plan for the target role: progress, then steps that turn into proof when ticked.
// Steps are shown in the reader's language (stepText); the saved English text is the fallback.
const PlanBlock = ({ plan, done, t, dict }) => (
  <div className="plan-block">
    <p className="plan-head"><strong>{t("profile.plan")}</strong> · {t("profile.planDone", { done, total: plan.steps.length })}</p>
    <div className="meter" aria-hidden="true"><span style={{ width: `${Math.round((done / plan.steps.length) * 100)}%` }} /></div>
    <PlanSteps steps={plan.steps.map((s) => ({ ...s, text: stepText(dict, s, plan.role_idx) }))} />
  </div>
);

// How many AI answers are left, with the ways to get more. Hidden until billing is set up.
const AiBar = ({ s, t }) => (
  <div className="card ai-bar">
    <p><strong>{t("billing.aiAnswers")}</strong>{" "}
      {s.pro ? t("billing.unlimitedPro") : s.program ? t("billing.unlimitedProgram", { name: s.program.name }) : <>{t("billing.freeLeft", { left: s.freeLeft, n: FREE_ANSWERS })}{s.packLeft > 0 && ` · ${t("billing.bought", { n: s.packLeft })}`}</>}
      <br /><small>{t("billing.alwaysFree")}</small></p>
    {!s.unlimited && <a className="cta small" href="/pricing">{t("billing.getMore")}</a>}
    {s.program ? (
      <form action={leaveProgram}><button type="submit" className="ghost mini">{t("billing.leaveProgram")}</button></form>
    ) : (
      <details>
        <summary>{t("billing.haveCode")}</summary>
        <form action={joinProgram} className="join-form">
          <input type="text" name="code" placeholder={t("billing.codePlaceholder")} maxLength={12} aria-label={t("billing.codeLabel")} required />
          <button type="submit">{t("billing.join")}</button>
        </form>
        <p><small>{t("billing.directorSees")}</small></p>
      </details>
    )}
  </div>
);

const Step = ({ n, children, id }) => <h2 className="step-title" id={id}><span className="step-num">{n}</span> {children}</h2>;

export default async function ProfilePage({ searchParams }) {
  const { saved, error, ok } = await searchParams;
  const supabase = await createClient();
  const [{ t, lang, dict }, country] = await Promise.all([getT(), getCountry()]);
  const L = (tag) => labelIn(dict, tag);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile, error: profileError }, { data: plan }, billing] = await Promise.all([
    supabase.from("sports_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("plans").select("*").eq("user_id", user.id).maybeSingle(),
    billingStatus(user.id)
  ]);
  const p = profile || {};
  // Matches use ticked skills plus those found in the achievements text.
  const eff = effectiveProfile(profile);
  const matches = profile ? topMatches(eff) : [];
  const done = plan ? plan.steps.filter((s) => s.done).length : 0;
  const proofUrl = p.public_code ? `https://ljsportmind-mvp.vercel.app/p/${p.public_code}` : "";
  const firstName = (p.full_name || "").split(" ")[0];
  // Guest accounts: no email yet, link sent (new_email), or email confirmed but no password chosen yet.
  const saveStage = user.is_anonymous ? (user.new_email ? "pending" : "guest") : user.user_metadata?.needs_password ? "password" : null;

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">{t("profile.eyebrow")}</p>
        <h1>{firstName ? <>{t("profile.welcome")} <span className="gold-text">{firstName}</span></> : <>{t("profile.build")} <span className="gold-text">{t("profile.passportWord")}</span></>}</h1>
        <nav className="step-nav" aria-label="Sections">
          {["passport", "path", "jobs", "proof"].map((id, i) => <a key={id} href={`#${id}`}>{dict.profile.nav[i]}</a>)}
        </nav>
      </div>
      {saveStage && <SaveAccount stage={saveStage} pendingEmail={user.new_email} />}
      {profileError && <p className="error">{t("profile.dbMissing")}</p>}
      {saved && <p className="ok">{t("profile.saved")}</p>}
      {error && <p className="error">{error}</p>}
      {ok && <p className="ok">{ok}</p>}
      {billing.ready && <AiBar s={billing} t={t} />}

      <Step n="1" id="passport">{t("profile.step1")}</Step>
      {/* key: when a plan step adds proof, the form reloads with the new achievements instead of the old text. */}
      <form action={saveProfile} className="card" key={p.updated_at || "new"}>
        {!profile && <PendingNote />}
        <ResumeFill />
        <div className="row">
          <div><label htmlFor="full_name">{t("profile.name")}</label><input id="full_name" name="full_name" type="text" defaultValue={p.full_name} /></div>
          <div><label htmlFor="location">{t("profile.city")}</label><input id="location" name="location" type="text" placeholder={t("profile.cityPh")} defaultValue={p.location} /></div>
        </div>
        <div className="row">
          <div>
            <label htmlFor="role">{t("profile.whereNow")}</label>
            <select id="role" name="role" defaultValue={p.role || ""}>
              <option value="">{t("profile.choose")}</option>
              {ROLES.map((r) => <option key={r} value={r}>{dict.roles[r] || r}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sport">{t("profile.mainSport")}</label>
            <select id="sport" name="sport" defaultValue={p.sport || ""}>
              <option value="">{t("profile.choose")}</option>
              {SPORTS.map((s) => <option key={s} value={s}>{dict.sports[s] || s}</option>)}
            </select>
          </div>
        </div>
        <fieldset>
          <legend>{t("profile.skills")}</legend>
          {Object.keys(SKILLS).map((v) => (
            <label key={v}><input type="checkbox" name="skills" value={v} defaultChecked={(p.skills || []).includes(v)} /> {L(v)}</label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{t("profile.interests")}</legend>
          {Object.keys(INTERESTS).map((v) => (
            <label key={v}><input type="checkbox" name="interests" value={v} defaultChecked={(p.interests || []).includes(v)} /> {L(v)}</label>
          ))}
        </fieldset>
        <label htmlFor="goal">{t("profile.goal")}</label>
        <input id="goal" name="goal" type="text" placeholder={t("profile.goalPh")} defaultValue={p.goal} />
        <ProofBuilder hasProfile={!!profile} />
        <label htmlFor="achievements">{t("profile.achievements")}</label>
        <textarea id="achievements" name="achievements" rows={5} placeholder={t("profile.achievementsPh")} defaultValue={p.achievements} />
        <button type="submit">{t("profile.savePassport")}</button>
      </form>

      {eff.auto.size > 0 && (
        <div className="card found">
          <h3>{t("profile.found")}</h3>
          <ul>
            {[...eff.auto].map((tag) => <li key={tag}><strong>{L(tag)}</strong> · {t("profile.from")} &ldquo;{eff.evidence[tag]}&rdquo;</li>)}
          </ul>
        </div>
      )}

      <Step n="2" id="path">{t("profile.step2")}</Step>
      <div className="card">
        {!profile && <p>{t("profile.saveFirstMatches")}</p>}
        {profile && !matches.length && <p>{t("profile.tickSome")}</p>}
        {/* The target role comes first, with its plan inside; it may be a path outside the top matches. */}
        {plan && !matches.some((m) => m.idx === plan.role_idx) && (
          <div className="match target">
            <div className="match-head"><strong>{pathName(dict, plan.role_idx)}</strong><span className="badge badge-full">{t("profile.target")}</span></div>
            <PlanBlock plan={plan} done={done} t={t} dict={dict} />
          </div>
        )}
        {[...matches].sort((x, y) => (y.idx === plan?.role_idx) - (x.idx === plan?.role_idx)).map((m) => {
          const isTarget = plan?.role_idx === m.idx;
          return (
            <div key={m.idx} className={isTarget ? "match target" : "match"}>
              <div className="match-head"><strong>{pathName(dict, m.idx)}</strong><span className={isTarget ? "badge badge-full" : "badge"}>{isTarget ? t("profile.target") : dict.profile.strength[m.level]}</span></div>
              <div className="meter" aria-label={`${Math.round(m.ratio * 100)}% of this role's skills`}><span style={{ width: `${Math.round(m.ratio * 100)}%` }} /></div>
              <p>{t("profile.youHave")} {m.matched.map(L).join(", ")}</p>
              {m.matched.some((tag) => eff.evidence[tag]) && (
                <ul className="evidence">
                  {m.matched.filter((tag) => eff.evidence[tag]).map((tag) => <li key={tag}><small>{L(tag)}: &ldquo;{eff.evidence[tag]}&rdquo;</small></li>)}
                </ul>
              )}
              <p>{t("profile.missing")} {m.gaps.length ? m.gaps.map(L).join(", ") : t("profile.nothingCore")}</p>
              {isTarget && <PlanBlock plan={plan} done={done} t={t} dict={dict} />}
              <div className="job-actions">
                {!isTarget && (
                  <form action={setTarget}>
                    <input type="hidden" name="role_idx" value={m.idx} />
                    <button type="submit">{t("profile.makeTarget")}</button>
                  </form>
                )}
                <SearchFor query={`${CAREER_PATHS[m.idx].search} jobs`}>{t("profile.seeJobs")}</SearchFor>
              </div>
            </div>
          );
        })}
      </div>

      <Step n="3" id="jobs">{t("profile.step3")}</Step>
      <div className="card">
        {profile ? (
          // Each starter is [what the chip says, what it searches for].
          <JobSearch starters={[
            dict.profile.starterInterns,
            dict.profile.starterNear,
            matches[0] ? [t("profile.starterRole", { role: pathName(dict, matches[0].idx) }), `${CAREER_PATHS[matches[0].idx].search} jobs`] : dict.profile.starterEntry,
            dict.profile.starterRemote
          ]} />
        ) : <p>{t("profile.jobsFirst")}</p>}
      </div>

      <Step n="4" id="proof">{t("profile.step4")}</Step>
      <div className="card">
        {!profile ? (
          <p>{t("profile.proofFirst")}</p>
        ) : p.is_public && p.public_code ? (
          <>
            <p className="ok">{t("profile.proofLive")}</p>
            <p className="proof-url"><a href={`/p/${p.public_code}`}>{proofUrl}</a></p>
            <div className="job-actions">
              <CopyButton text={proofUrl} />
              <form action={setPublic}><input type="hidden" name="on" value="0" /><button type="submit" className="ghost">{t("profile.linkOff")}</button></form>
            </div>
          </>
        ) : (
          <form action={setPublic}><input type="hidden" name="on" value="1" /><button type="submit">{t("profile.createLink")}</button></form>
        )}
      </div>
      {profile && <ResumeBullets />}
      <Goldie coach={{
        firstName,
        hasProfile: !!profile,
        paths: CAREER_PATHS.map((c, i) => ({ name: pathName(dict, i), links: jobLinks(i, p.location, country, country === "ANY" ? "" : countryName(country, lang)) })),
        targetIdx: plan ? plan.role_idx : null,
        starters: [
          !profile ? t("coach.fuFill") : matches[0] ? t("coach.fuWhyBest", { role: pathName(dict, matches[0].idx) }) : t("coach.fuWhichCareer"),
          t("coach.fuFindInterns"),
          plan ? t("coach.fuFirst") : t("coach.fuTarget")
        ]
      }} />
    </>
  );
}
