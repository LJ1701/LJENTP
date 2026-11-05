import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { CAREER_PATHS } from "@/lib/careers";
import { startPilot } from "../billing/actions";
import CopyButton from "../profile/copy-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Program dashboard · LJSportMind" };

const day = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "–");
const lines = (t) => String(t || "").split("\n").map((l) => l.trim()).filter(Boolean).length;

// Totals across the program's students. Only counts leave the server: never names, Passports or chats.
async function outcomes(db, code) {
  const { data: members } = await db.from("billing").select("user_id").eq("program_code", code);
  const ids = (members || []).map((m) => m.user_id);
  if (!ids.length) return { students: 0 };
  const [{ data: profiles }, { data: plans }] = await Promise.all([
    db.from("sports_profiles").select("user_id, achievements, is_public").in("user_id", ids),
    db.from("plans").select("user_id, role_idx, steps").in("user_id", ids)
  ]);
  const P = profiles || [], L = plans || [];
  const steps = L.flatMap((p) => p.steps || []);
  const roles = {};
  L.forEach((p) => { const n = CAREER_PATHS[p.role_idx]?.name; if (n) roles[n] = (roles[n] || 0) + 1; });
  return {
    students: ids.length,
    passports: P.length,
    withProof: P.filter((p) => lines(p.achievements) > 0).length,
    proofLines: P.reduce((a, p) => a + lines(p.achievements), 0),
    targets: L.length,
    stepsDone: steps.filter((s) => s.done).length,
    stepsTotal: steps.length,
    activePlans: L.filter((p) => (p.steps || []).some((s) => s.done)).length,
    publicLinks: P.filter((p) => p.is_public).length,
    roles: Object.entries(roles).sort((a, b) => b[1] - a[1])
  };
}

export default async function ProgramPage({ searchParams }) {
  const { error, started } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/#start");
  const db = adminClient();
  const { data: program } = db ? await db.from("programs").select("*").eq("director", user.id).maybeSingle() : { data: null };

  if (!program) {
    return (
      <>
        <div className="page-head">
          <p className="eyebrow">For schools, clubs and programs</p>
          <h1>Start a <span className="gold-text">free 30-day pilot</span></h1>
          <p className="muted">Your students get unlimited AI answers with one join code. You see how they&apos;re building proof: totals only, never their names or answers.</p>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="card">
          {user.is_anonymous ? (
            <p>You&apos;re in guest mode. <a href="/profile">Save your account with your email</a> first, then come back here to start a pilot.</p>
          ) : (
            <form action={startPilot}>
              <label htmlFor="pg-name">Program name</label>
              <input id="pg-name" name="name" type="text" required minLength={2} maxLength={100} placeholder="e.g. Sport Management, Class of 2027" />
              <button type="submit">Start my pilot (30 seats, 30 days)</button>
              <p><small>Free, no card. After the pilot, programs are licensed from $1,500 a year and invoiced to the school. <a href="/pricing#schools">Details</a></small></p>
            </form>
          )}
        </div>
      </>
    );
  }

  const o = await outcomes(db, program.code);
  const active = new Date(program.active_until) > new Date();
  const joinUrl = "https://ljsportmind-mvp.vercel.app/pricing#schools";

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Program dashboard · {program.plan === "pilot" ? "Free pilot" : "Licence"}</p>
        <h1>{program.name}</h1>
        <p className={active ? "muted" : "error"}>{active ? `Active until ${day(program.active_until)}` : `Ended ${day(program.active_until)}. Request a licence to switch it back on.`} · {o.students} of {program.seats} seats used</p>
      </div>
      {started && <p className="ok">Your pilot is live. Share the join code with your students.</p>}

      <div className="card join-code">
        <h2>Join code</h2>
        <p className="code-big">{program.code}</p>
        <p>Students: open LJSportMind, start a Passport, then enter this code under <strong>AI answers</strong> on their Passport page (or at <a href="/pricing#schools">/pricing</a>).</p>
        <CopyButton label="Copy invite for students" text={`Join our LJSportMind program: go to ${joinUrl}, start your free Sports Passport, then enter code ${program.code} for unlimited AI answers.`} />
      </div>

      <h2 className="step-title">Outcomes</h2>
      <div className="card">
        {!o.students ? <p>No students yet. Share the join code; numbers appear here as they build their Passports.</p> : (
          <>
            <div className="stat-grid">
              <div><strong>{o.students}</strong><span>students joined</span></div>
              <div><strong>{pct(o.passports, o.students)}</strong><span>saved a Passport ({o.passports})</span></div>
              <div><strong>{pct(o.withProof, o.students)}</strong><span>wrote at least one achievement</span></div>
              <div><strong>{o.proofLines}</strong><span>achievement lines in total</span></div>
              <div><strong>{pct(o.targets, o.students)}</strong><span>chose a target career</span></div>
              <div><strong>{o.stepsDone} / {o.stepsTotal}</strong><span>plan steps completed</span></div>
              <div><strong>{pct(o.activePlans, o.students)}</strong><span>finished at least one plan step</span></div>
              <div><strong>{pct(o.publicLinks, o.students)}</strong><span>shared a public proof link</span></div>
            </div>
            {o.students >= 5 && o.roles.length > 0 && (
              <>
                <h3>Target careers</h3>
                <ul>{o.roles.map(([n, c]) => <li key={n}>{n}: {c}</li>)}</ul>
              </>
            )}
            <p><small>Totals only. Target careers appear once 5 or more students have joined, so no one can be singled out. Counted live from students&apos; saved data.</small></p>
          </>
        )}
      </div>
    </>
  );
}
