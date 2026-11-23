import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SKILLS, INTERESTS, SPORTS, ROLES, CAREER_PATHS, topMatches, labelIn, pathName, stepText, jobLinks } from "@/lib/careers";
import { effectiveProfile } from "@/lib/detect";
import { saveProfile, setTarget, setPublic, deletePortfolioItem } from "./actions";
import PlanSteps from "./plan-steps";
import ResumeFill from "./resume-fill";
import ResumeBullets from "./resume-bullets";
import ProofBuilder from "./proof-builder";
import PortfolioForm from "./portfolio-form";
import Tabs from "./tabs";
import PortfolioCards from "../portfolio-cards";
import { signedUrls } from "@/lib/portfolio";
import ShareButtons from "../share-buttons";
import { getInvite, INVITE_BONUS } from "@/lib/referrals";
import Goldie from "../goldie";
import SaveAccount from "./save-account";
import JobSearch, { SearchFor, PendingNote } from "./job-search";
import CopyButton from "./copy-button";
import { billingStatus, FREE_ANSWERS } from "@/lib/billing";
import { joinProgram, leaveProgram } from "../billing/actions";
import { getT, getCountry } from "@/lib/i18n-server";
import { countryName, REGIONS } from "@/lib/countries";
import { CountryChips, WorkCountryNote } from "./work-countries";
import EmployerRoles from "./employer-roles";
import TrustCard from "./trust-card";
import { emailDomain } from "@/lib/trust";
import { approvedRoles } from "@/lib/employer-roles";

export const dynamic = "force-dynamic";

// The Passport has five tabs. Each one is a link (?tab=...), so it works without JavaScript and the
// browser's back button moves between tabs.
const TABS = ["profile", "portfolio", "path", "jobs", "share"];

// The saved plan for the target role: progress, then steps that turn into proof when ticked.
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

// Tab heading: a short title and one line saying what this tab is for.
const Head = ({ title, id }) => (
  <div className="tab-head" id={id}>
    <h2>{title}</h2>
  </div>
);

// Previous / next tab buttons at the bottom of each tab.
const Pager = ({ tab, t }) => {
  const i = TABS.indexOf(tab);
  return (
    <nav className="tab-pager" aria-label={t("tabs.label")}>
      {i > 0 ? <a className="ghost-link" data-tab-link={TABS[i - 1]} href={`/profile?tab=${TABS[i - 1]}`}>← {t(`tabs.${TABS[i - 1]}`)}</a> : <span />}
      {i < TABS.length - 1 && <a className="cta small" data-tab-link={TABS[i + 1]} href={`/profile?tab=${TABS[i + 1]}`}>{t(`tabs.${TABS[i + 1]}`)} →</a>}
    </nav>
  );
};

export default async function ProfilePage({ searchParams }) {
  const { saved, error, ok, invited, added, tab: askedTab } = await searchParams;
  const supabase = await createClient();
  const [{ t, lang, dict }, country] = await Promise.all([getT(), getCountry()]);
  const L = (tag) => labelIn(dict, tag);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile, error: profileError }, { data: plan }, portfolioRes, billing, roles] = await Promise.all([
    supabase.from("sports_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("plans").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("portfolio_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    billingStatus(user.id),
    approvedRoles()
  ]);
  // portfolio_items only exists once supabase/006_portfolio.sql has been run; until then the tab says so.
  const portfolioReady = !portfolioRes.error;
  const items = portfolioReady ? portfolioRes.data || [] : [];
  const urls = await signedUrls(supabase, items);
  const invite = await getInvite(user.id);
  const inviteUrl = invite ? `https://theassist.vercel.app/?ref=${invite.code}` : "";
  const p = profile || {};
  const eff = effectiveProfile(profile);
  const matches = profile ? topMatches(eff) : [];
  const done = plan ? plan.steps.filter((s) => s.done).length : 0;
  // Trust: a public link needs a confirmed email; school emails and LinkedIn add badges (supabase/013_trust.sql).
  const emailOk = !!(user && !user.is_anonymous && user.email && user.email_confirmed_at);
  const schoolDomain = emailOk && /(\.edu|\.edu\.[a-z]{2}|\.ac\.[a-z]{2})$/.test(emailDomain(user.email)) ? emailDomain(user.email) : "";
  const hasLinkedin = (user?.identities || []).some((i) => i.provider === "linkedin_oidc" || i.provider === "linkedin");
  const proofUrl = p.public_code ? `https://theassist.vercel.app/p/${p.public_code}` : "";
  const firstName = (p.full_name || "").split(" ")[0];
  const saveStage = user.is_anonymous ? (user.new_email ? "pending" : "guest") : user.user_metadata?.needs_password ? "password" : null;
  const lines = String(p.achievements || "").split("\n").map((l) => l.trim()).filter(Boolean);

  // Progress across the five tabs: what counts as "done" for each.
  const doneTabs = {
    profile: !!(profile && (p.full_name || p.role) && (p.skills?.length || p.interests?.length)),
    portfolio: items.length > 0 || lines.length > 0,
    path: !!plan,
    jobs: false,
    share: !!(p.is_public && p.public_code)
  };
  const countable = ["profile", "portfolio", "path", "share"];
  const progress = countable.filter((k) => doneTabs[k]).length;
  // Old links (?tab=proof) open the Portfolio, where achievements now live.
  const tab = askedTab === "proof" ? "portfolio" : TABS.includes(askedTab) ? askedTab : profile ? "portfolio" : "profile";
  const href = (k) => `/profile?tab=${k}`;

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">{t("profile.eyebrow")}</p>
        <h1>{firstName ? <>{t("profile.welcome")} <span className="gold-text">{firstName}</span></> : <>{t("profile.build")} <span className="gold-text">{t("profile.passportWord")}</span></>}</h1>
        <div className="progress-line">
          <div className="meter" aria-hidden="true"><span style={{ width: `${(progress / countable.length) * 100}%` }} /></div>
          <small>{t("tabs.progress", { n: progress, total: countable.length })}</small>
        </div>
        <nav className="tabs" aria-label={t("tabs.label")}>
          {TABS.map((k, i) => (
            <a key={k} href={href(k)} data-tab-link={k} className={k === tab ? "tab on" : "tab"} aria-current={k === tab ? "page" : undefined}>
              <span className={doneTabs[k] ? "tab-num done" : "tab-num"}>{doneTabs[k] ? "✓" : i + 1}</span> {t(`tabs.${k}`)}
            </a>
          ))}
        </nav>
      </div>
      {saveStage && <SaveAccount stage={saveStage} pendingEmail={user.new_email} />}
      {profileError && <p className="error">{t("profile.dbMissing")}</p>}
      {saved && <p className="ok flash">{t(saved === "portfolio" ? "tabs.savedAchievements" : "tabs.saved")}</p>}
      {added && <p className="ok flash">{t("evidence.added")}</p>}
      {error && <p className="error flash">{error}</p>}
      {ok && <p className="ok flash">{ok}</p>}
      {invited && <p className="ok flash">{t("invite.welcome", { n: INVITE_BONUS })}</p>}
      {/* Billing messages (joined a program, bought answers) come back without a tab, so the AI bar shows with them. */}
      {billing.ready && ok && <AiBar s={billing} t={t} />}

      <div className="tab-panel" data-tab-panel="profile" hidden={tab !== "profile"}>
          <Head id="passport" title={t("profile.step1")} />
          <form action={saveProfile} className="card" key={p.updated_at || "new"}>
            <input type="hidden" name="tab" value="profile" />
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
            {/* Where they can already work (self-stated) and where they'd like to. No visa or legal advice. */}
            <fieldset className="work-countries">
              <legend>{t("work.title")}</legend>
              <CountryChips name="work_countries" label={t("work.canLabel")} hint={t("work.canHint")} initial={p.work_countries || []} />
              <CountryChips name="target_countries" label={t("work.wantLabel")} initial={p.target_countries || []} />
            </fieldset>
            {/* New users have no Proof tab content yet, so the achievements box stays here until the first save. */}
            {!profile && (
              <>
                <label htmlFor="achievements">{t("profile.achievements")}</label>
                <textarea id="achievements" name="achievements" rows={4} placeholder={t("profile.achievementsPh")} />
              </>
            )}
            <button type="submit">{profile ? t("tabs.saveNext") : t("profile.savePassport")}</button>
          </form>
          <Pager tab="profile" t={t} />
        </div>

      {/* Portfolio: files, links and references that back up what you've done, plus the achievements list itself. */}
      <div className="tab-panel" data-tab-panel="portfolio" hidden={tab !== "portfolio"}>
        <Head id="portfolio" title={t("tabs.portfolioTitle")} />
        {!profile ? <div className="card"><p>{t("profile.proofFirst")}</p><a className="cta small" data-tab-link="profile" href={href("profile")}>{t("tabs.goProfile")}</a></div> : (
          <>
            {!portfolioReady ? <div className="card"><p className="error">{t("evidence.notReady")}</p></div> : (
              <>
                <div className="card">
                  <h3>{t("evidence.addTitle")}</h3>
                  <PortfolioForm lines={lines} />
                </div>
                <div className="card" id="portfolio-list">
                  <h3>{t("evidence.yours")} <small>· {t("evidence.count", { n: items.length, files: items.filter((i) => i.kind === "file").length, max: 20 })}</small></h3>
                  {items.length ? <PortfolioCards items={items} urls={urls} t={t} lang={lang} removeAction={deletePortfolioItem} ownerName={p.full_name || ""} /> : <p className="muted">{t("evidence.empty")}</p>}
                </div>
              </>
            )}
            <form action={saveProfile} className="card" key={p.updated_at || "new"} id="achievements-card">
              <input type="hidden" name="tab" value="portfolio" />
              <h3>{t("tabs.proofTitle")}</h3>
              <ProofBuilder hasProfile />
              <label htmlFor="achievements">{t("profile.achievements")}</label>
              <textarea id="achievements" name="achievements" rows={5} placeholder={t("profile.achievementsPh")} defaultValue={p.achievements} />
              <button type="submit">{t("tabs.saveAchievements")}</button>
            </form>
            {eff.auto.size > 0 && (
              <div className="card found">
                <h3>{t("profile.found")}</h3>
                <ul>
                  {[...eff.auto].map((tag) => <li key={tag}><strong>{L(tag)}</strong> · {t("profile.from")} &ldquo;{eff.evidence[tag]}&rdquo;</li>)}
                </ul>
              </div>
            )}
            <ResumeBullets />
          </>
        )}
        <Pager tab="portfolio" t={t} />
      </div>

      <div className="tab-panel" data-tab-panel="path" hidden={tab !== "path"}>
          <Head id="path" title={t("profile.step2")} />
          <div className="card">
            {!profile && <p>{t("profile.saveFirstMatches")}</p>}
            {profile && !matches.length && <p>{t("profile.tickSome")}</p>}
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
          <Pager tab="path" t={t} />
        </div>

      <div className="tab-panel" data-tab-panel="jobs" hidden={tab !== "jobs"}>
        <Head id="jobs" title={t("profile.step3")} />
        {billing.ready && !ok && <AiBar s={billing} t={t} />}
        {profile && <EmployerRoles roles={roles} proofUrl={p.is_public ? proofUrl : ""} t={t} lang={lang} />}
        <div className="card">
          {profile && <WorkCountryNote work={p.work_countries || []} regions={Object.fromEntries(Object.entries(REGIONS).map(([k, r]) => [k, r.codes]))} />}
          {profile ? (
            <JobSearch starters={[
              dict.profile.starterInterns,
              dict.profile.starterNear,
              matches[0] ? [t("profile.starterRole", { role: pathName(dict, matches[0].idx) }), `${CAREER_PATHS[matches[0].idx].search} jobs`] : dict.profile.starterEntry,
              dict.profile.starterRemote
            ]} />
          ) : <p>{t("profile.jobsFirst")}</p>}
        </div>
        <Pager tab="jobs" t={t} />
      </div>

      <div className="tab-panel" data-tab-panel="share" hidden={tab !== "share"}>
          <Head id="share" title={t("tabs.shareTitle")} />
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
                <ShareButtons url={proofUrl} text={t("share.proofText")} />
              </>
            ) : (
              <>
                {portfolioReady && !items.length && <p className="muted">{t("tabs.shareTip")}</p>}
                {emailOk ? (
                  <form action={setPublic}><input type="hidden" name="on" value="1" /><button type="submit">{t("profile.createLink")}</button></form>
                ) : <p className="warn">{t("trust.needEmail")}</p>}
              </>
            )}
          </div>
          {profile && <TrustCard emailOk={emailOk} school={schoolDomain} linkedin={hasLinkedin} />}
          {user && !user.is_anonymous && (
            <div className="card story-invite">
              <h3>{t("stories.cardTitle")}</h3>
              <p className="muted">{t("stories.cardText")}</p>
              <a className="cta small" href="/stories/new">{t("stories.cardBtn")}</a>
            </div>
          )}
          {invite && (
            <div className="card invite-card" aria-label={t("invite.title")}>
              <h3>{t("invite.title")}</h3>
              <p>{t("invite.text", { n: INVITE_BONUS })}</p>
              <p className="proof-url"><small>{inviteUrl}</small></p>
              <div className="job-actions"><CopyButton text={inviteUrl} label={t("invite.copy")} /></div>
              <ShareButtons url={inviteUrl} text={t("share.inviteText")} />
              <p><small>{invite.count ? t("invite.count", { n: invite.count }) : t("invite.none")} {t("invite.cap")}</small></p>
            </div>
          )}
          <Pager tab="share" t={t} />
        </div>

      <Tabs fallback={profile ? "portfolio" : "profile"} />

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
