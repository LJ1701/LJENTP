import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SKILLS, INTERESTS, SPORTS, ROLES, CAREER_PATHS, topMatches, label, jobLinks } from "@/lib/careers";
import { effectiveProfile } from "@/lib/detect";
import { saveProfile, setTarget, toggleStep, setPublic } from "./actions";
import ResumeBullets from "./resume-bullets";
import CoachChat from "./coach-chat";

export const dynamic = "force-dynamic";

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

  return (
    <>
      <p><small><a href="/">← Home</a> · Signed in as {user.email}</small></p>
      <h1>My Sports <span className="gold-text">Profile</span></h1>
      {profileError && <p className="error">The database isn&apos;t set up yet (run the SQL in mvp/supabase/schema.sql).</p>}
      {saved && <p className="ok">Saved.</p>}
      {error && <p className="error">{error}</p>}

      <form action={saveProfile} className="card">
        <h2>Your details</h2>
        <label htmlFor="full_name">Name</label>
        <input id="full_name" name="full_name" type="text" defaultValue={p.full_name} />
        <label htmlFor="location">City</label>
        <input id="location" name="location" type="text" placeholder="Dallas, TX" defaultValue={p.location} />
        <label htmlFor="role">Role</label>
        <select id="role" name="role" defaultValue={p.role || ""}>
          <option value="">Choose…</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <label htmlFor="sport">Main sport</label>
        <select id="sport" name="sport" defaultValue={p.sport || ""}>
          <option value="">Choose…</option>
          {SPORTS.map((s) => <option key={s}>{s}</option>)}
        </select>
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
        <input id="goal" name="goal" type="text" defaultValue={p.goal} />
        <label htmlFor="achievements">Achievements (one per line)</label>
        <textarea id="achievements" name="achievements" rows={5} defaultValue={p.achievements} />
        <button type="submit">Save my profile</button>
      </form>

      {eff.auto.size > 0 && (
        <section aria-label="Found in your achievements">
          <h2>Found in your achievements</h2>
          <p>These count toward your matches even though you didn&apos;t tick them:</p>
          <ul>
            {[...eff.auto].map((t) => <li key={t}><strong>{label(t)}</strong> · from &ldquo;{eff.evidence[t]}&rdquo;</li>)}
          </ul>
        </section>
      )}

      {profile && <ResumeBullets />}

      <section aria-label="Career matches">
      <h2>My career matches</h2>
      {!profile && <p>Save your profile to see matches.</p>}
      {profile && !matches.length && <p>Tick a few skills or interests to see matches.</p>}
      {matches.map((m) => (
        <div key={m.idx} className="match">
          <div className="match-head"><strong>{m.name}</strong><span className="badge">{m.strength}</span></div>
          <p>You have: {m.matched.map(label).join(", ")}</p>
          {m.matched.some((t) => eff.evidence[t]) && (
            <ul>
              {m.matched.filter((t) => eff.evidence[t]).map((t) => <li key={t}><small>{label(t)}: &ldquo;{eff.evidence[t]}&rdquo;</small></li>)}
            </ul>
          )}
          <p>Missing: {m.gaps.length ? m.gaps.map(label).join(", ") : "nothing from the core skills"}</p>
          <p>
            Find openings:{" "}
            {jobLinks(m.idx, p.location).map(([name, url], i) => (
              <span key={name}>{i > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{name}</a></span>
            ))}
          </p>
          <form action={setTarget}>
            <input type="hidden" name="role_idx" value={m.idx} />
            <button type="submit" disabled={plan?.role_idx === m.idx}>{plan?.role_idx === m.idx ? "My target role" : "Make this my target role"}</button>
          </form>
        </div>
      ))}
      </section>

      {profile && (
        <CoachChat
          paths={CAREER_PATHS.map((c, i) => ({ name: c.name, links: jobLinks(i, p.location) }))}
          targetIdx={plan ? plan.role_idx : null}
          starters={[
            matches[0] ? `Why is ${matches[0].name} my best match?` : "Which sports career fits me best?",
            plan ? "What should I do first on my plan?" : "Which match should I pick as my target?",
            "Which of my achievements would impress an employer most?"
          ]}
        />
      )}

      <section aria-label="Public proof link">
      <h2 id="proof">Public proof link</h2>
      {!profile ? (
        <p>Save your profile first.</p>
      ) : p.is_public && p.public_code ? (
        <>
          <p className="ok">On. Anyone with this link can see your profile, evidence and plan progress (not your email):</p>
          <p className="proof-url"><a href={`/p/${p.public_code}`}>{`https://ljsportmind-mvp.vercel.app/p/${p.public_code}`}</a></p>
          <form action={setPublic}><input type="hidden" name="on" value="0" /><button type="submit" className="ghost">Turn the link off</button></form>
        </>
      ) : (
        <>
          <p>Off. Turn it on to get a link you can paste into a job application. You can turn it off any time.</p>
          <form action={setPublic}><input type="hidden" name="on" value="1" /><button type="submit">Turn on my public proof link</button></form>
        </>
      )}
      </section>

      <section aria-label="My plan">
      <h2 id="plan">My plan</h2>
      {!plan ? (
        <p>Pick a target role above to get a saved plan.</p>
      ) : (
        <>
          <p><strong>{CAREER_PATHS[plan.role_idx].name}</strong> · {done} of {plan.steps.length} steps done</p>
          <div className="progress" aria-hidden="true"><span style={{ width: `${Math.round((done / plan.steps.length) * 100)}%` }} /></div>
          <ul className="plan-list">
            {plan.steps.map((s, i) => (
              <li key={i}>
                <form action={toggleStep}>
                  <input type="hidden" name="step" value={i} />
                  <button type="submit" className={s.done ? "check done" : "check"} aria-label={s.done ? "Mark not done" : "Mark done"}>{s.done ? "✓" : ""}</button>
                </form>
                <span className={s.done ? "done-text" : ""}>{s.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      </section>
    </>
  );
}
