import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SKILLS, INTERESTS, SPORTS, ROLES, CAREER_PATHS, topMatches, label, jobLinks } from "@/lib/careers";
import { effectiveProfile } from "@/lib/detect";
import { saveProfile, setTarget, setPublic } from "./actions";
import PlanSteps from "./plan-steps";
import ResumeFill from "./resume-fill";
import ResumeBullets from "./resume-bullets";
import Goldie from "../goldie";
import SaveAccount from "./save-account";
import JobSearch, { SearchFor, PendingNote } from "./job-search";
import CopyButton from "./copy-button";
import ProofBuilder from "./proof-builder";

export const dynamic = "force-dynamic";

// The saved plan for the target role: progress, then steps that turn into proof when ticked.
const PlanBlock = ({ plan, done }) => (
  <div className="plan-block">
    <p className="plan-head"><strong>Your plan</strong> · {done} of {plan.steps.length} done</p>
    <div className="meter" aria-hidden="true"><span style={{ width: `${Math.round((done / plan.steps.length) * 100)}%` }} /></div>
    <PlanSteps steps={plan.steps} />
  </div>
);

const Step = ({ n, children, id }) => <h2 className="step-title" id={id}><span className="step-num">{n}</span> {children}</h2>;

export default async function ProfilePage({ searchParams }) {
  const { saved, error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile, error: profileError }, { data: plan }] = await Promise.all([
    supabase.from("sports_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("plans").select("*").eq("user_id", user.id).maybeSingle()
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
        <p className="eyebrow">Your sports career workspace</p>
        <h1>{firstName ? <>Welcome back, <span className="gold-text">{firstName}</span></> : <>Build your <span className="gold-text">Sports Passport</span></>}</h1>
        <nav className="step-nav" aria-label="Sections">
          <a href="#passport">1 Passport</a><a href="#path">2 Your path</a><a href="#jobs">3 Jobs &amp; internships</a><a href="#proof">4 Proof</a>
        </nav>
      </div>
      {saveStage && <SaveAccount stage={saveStage} pendingEmail={user.new_email} />}
      {profileError && <p className="error">The database isn&apos;t set up yet (run the SQL in mvp/supabase/schema.sql).</p>}
      {saved && <p className="ok">Saved. Your matches below are updated.</p>}
      {error && <p className="error">{error}</p>}

      <Step n="1" id="passport">Your Sports Passport</Step>
      {/* key: when a plan step adds proof, the form reloads with the new achievements instead of the old text. */}
      <form action={saveProfile} className="card" key={p.updated_at || "new"}>
        {!profile && <PendingNote />}
        <ResumeFill />
        <div className="row">
          <div><label htmlFor="full_name">Name</label><input id="full_name" name="full_name" type="text" defaultValue={p.full_name} /></div>
          <div><label htmlFor="location">City</label><input id="location" name="location" type="text" placeholder="Dallas, TX" defaultValue={p.location} /></div>
        </div>
        <div className="row">
          <div>
            <label htmlFor="role">Where you are now</label>
            <select id="role" name="role" defaultValue={p.role || ""}>
              <option value="">Choose…</option>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sport">Main sport (optional)</label>
            <select id="sport" name="sport" defaultValue={p.sport || ""}>
              <option value="">Choose…</option>
              {SPORTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <fieldset>
          <legend>Skills</legend>
          {Object.entries(SKILLS).map(([v, l]) => (
            <label key={v}><input type="checkbox" name="skills" value={v} defaultChecked={(p.skills || []).includes(v)} /> {l}</label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Interests</legend>
          {Object.entries(INTERESTS).map(([v, l]) => (
            <label key={v}><input type="checkbox" name="interests" value={v} defaultChecked={(p.interests || []).includes(v)} /> {l}</label>
          ))}
        </fieldset>
        <label htmlFor="goal">Career goal</label>
        <input id="goal" name="goal" type="text" placeholder="e.g. Work in a college athletic department" defaultValue={p.goal} />
        <ProofBuilder hasProfile={!!profile} />
        <label htmlFor="achievements">Achievements: your proof (one per line)</label>
        <textarea id="achievements" name="achievements" rows={5} placeholder={"Ran social media for my school's basketball team\nVolunteered at a city marathon\nWrote game recaps for the student paper"} defaultValue={p.achievements} />
        <button type="submit">Save my Passport</button>
      </form>

      {eff.auto.size > 0 && (
        <div className="card found">
          <h3>Found in your achievements</h3>
          <ul>
            {[...eff.auto].map((t) => <li key={t}><strong>{label(t)}</strong> · from &ldquo;{eff.evidence[t]}&rdquo;</li>)}
          </ul>
        </div>
      )}

      <Step n="2" id="path">Your path</Step>
      <div className="card">
        {!profile && <p>Save your Passport to see the sports careers you fit.</p>}
        {profile && !matches.length && <p>Tick a few skills or interests, or add achievements, to see matches.</p>}
        {/* The target role comes first, with its plan inside; it may be a path outside the top matches. */}
        {plan && !matches.some((m) => m.idx === plan.role_idx) && (
          <div className="match target">
            <div className="match-head"><strong>{CAREER_PATHS[plan.role_idx].name}</strong><span className="badge badge-full">Your target</span></div>
            <PlanBlock plan={plan} done={done} />
          </div>
        )}
        {[...matches].sort((x, y) => (y.idx === plan?.role_idx) - (x.idx === plan?.role_idx)).map((m) => {
          const isTarget = plan?.role_idx === m.idx;
          return (
            <div key={m.idx} className={isTarget ? "match target" : "match"}>
              <div className="match-head"><strong>{m.name}</strong><span className={isTarget ? "badge badge-full" : "badge"}>{isTarget ? "Your target" : m.strength}</span></div>
              <div className="meter" aria-label={`${Math.round(m.ratio * 100)}% of this role's skills`}><span style={{ width: `${Math.round(m.ratio * 100)}%` }} /></div>
              <p>You have: {m.matched.map(label).join(", ")}</p>
              {m.matched.some((t) => eff.evidence[t]) && (
                <ul className="evidence">
                  {m.matched.filter((t) => eff.evidence[t]).map((t) => <li key={t}><small>{label(t)}: &ldquo;{eff.evidence[t]}&rdquo;</small></li>)}
                </ul>
              )}
              <p>Missing: {m.gaps.length ? m.gaps.map(label).join(", ") : "nothing from the core skills"}</p>
              {isTarget && <PlanBlock plan={plan} done={done} />}
              <div className="job-actions">
                {!isTarget && (
                  <form action={setTarget}>
                    <input type="hidden" name="role_idx" value={m.idx} />
                    <button type="submit">Make this my target</button>
                  </form>
                )}
                <SearchFor query={`${CAREER_PATHS[m.idx].search} jobs`}>See jobs for this role</SearchFor>
              </div>
            </div>
          );
        })}
      </div>

      <Step n="3" id="jobs">Sports jobs &amp; internships</Step>
      <div className="card">
        {profile ? (
          <JobSearch starters={[
            "Sports internships",
            "Sports jobs near me",
            matches[0] ? `${CAREER_PATHS[matches[0].idx].search.replace(/^./, (c) => c.toUpperCase())} jobs` : "Entry-level sports jobs",
            "Remote sports marketing jobs"
          ]} />
        ) : <p>Save your Passport first so results can be checked against your proof.</p>}
      </div>

      <Step n="4" id="proof">Your proof</Step>
      <div className="card">
        {!profile ? (
          <p>Save your Passport first.</p>
        ) : p.is_public && p.public_code ? (
          <>
            <p className="ok">Your proof link is live. Your email is never shown.</p>
            <p className="proof-url"><a href={`/p/${p.public_code}`}>{proofUrl}</a></p>
            <div className="job-actions">
              <CopyButton text={proofUrl} />
              <form action={setPublic}><input type="hidden" name="on" value="0" /><button type="submit" className="ghost">Turn the link off</button></form>
            </div>
          </>
        ) : (
          <form action={setPublic}><input type="hidden" name="on" value="1" /><button type="submit">Create my public proof link</button></form>
        )}
      </div>
      {profile && <ResumeBullets />}
      <Goldie coach={{
        firstName,
        hasProfile: !!profile,
        paths: CAREER_PATHS.map((c, i) => ({ name: c.name, links: jobLinks(i, p.location) })),
        targetIdx: plan ? plan.role_idx : null,
        starters: [
          !profile ? "How do I fill in my Passport?" : matches[0] ? `Why is ${matches[0].name} my best match?` : "Which sports career fits me best?",
          "Find me sports internships",
          plan ? "What should I do first on my plan?" : "Which match should I pick as my target?"
        ]
      }} />
    </>
  );
}
