import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SKILLS, INTERESTS, SPORTS, ROLES, CAREER_PATHS, topMatches, label } from "@/lib/careers";
import { gameDayWeather } from "@/lib/weather";
import { saveProfile, setTarget, toggleStep } from "./actions";

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
  const matches = profile ? topMatches(profile) : [];
  const weather = await gameDayWeather(p.location);
  const done = plan ? plan.steps.filter((s) => s.done).length : 0;

  return (
    <>
      <p><a href="/">← Home</a> · Signed in as {user.email}</p>
      <h1>My Sports Profile</h1>
      {profileError && <p className="error">The database isn&apos;t set up yet (run the SQL in mvp/supabase/schema.sql).</p>}
      {saved && <p className="ok">Saved.</p>}
      {error && <p className="error">{error}</p>}

      <section aria-label="Game-day weather">
        <h2>Game-day weather</h2>
        {weather.error ? (
          <p>{weather.error}</p>
        ) : (
          <p>
            {weather.place}: <strong>{weather.tempF}°F</strong> now
            {weather.rainChance !== null && <> · {weather.rainChance}% chance of rain today</>}
          </p>
        )}
        <p><small>Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a></small></p>
      </section>

      <form action={saveProfile}>
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

      <h2>My career matches</h2>
      {!profile && <p>Save your profile to see matches.</p>}
      {profile && !matches.length && <p>Tick a few skills or interests to see matches.</p>}
      {matches.map((m) => (
        <div key={m.idx} style={{ border: "1px solid #ccc", padding: 12, marginTop: 12 }}>
          <strong>{m.name}</strong> · {m.strength}
          <p>You have: {m.matched.map(label).join(", ")}</p>
          <p>Missing: {m.gaps.length ? m.gaps.map(label).join(", ") : "nothing from the core skills"}</p>
          <form action={setTarget}>
            <input type="hidden" name="role_idx" value={m.idx} />
            <button type="submit" disabled={plan?.role_idx === m.idx}>{plan?.role_idx === m.idx ? "My target role" : "Make this my target role"}</button>
          </form>
        </div>
      ))}

      <h2 id="plan">My plan</h2>
      {!plan ? (
        <p>Pick a target role above to get a saved plan.</p>
      ) : (
        <>
          <p><strong>{CAREER_PATHS[plan.role_idx].name}</strong> · {done} of {plan.steps.length} steps done</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {plan.steps.map((s, i) => (
              <li key={i}>
                <form action={toggleStep} style={{ display: "inline" }}>
                  <input type="hidden" name="step" value={i} />
                  <button type="submit" aria-label={s.done ? "Mark not done" : "Mark done"}>{s.done ? "☑" : "☐"}</button>
                </form>{" "}
                <span style={{ textDecoration: s.done ? "line-through" : "none" }}>{s.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
