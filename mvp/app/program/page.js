import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { CAREER_PATHS, pathName } from "@/lib/careers";
import { getT } from "@/lib/i18n-server";
import { startPilot } from "../billing/actions";
import CopyButton from "../profile/copy-button";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("program.metaTitle") };
}

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
  L.forEach((p) => { if (CAREER_PATHS[p.role_idx]) roles[p.role_idx] = (roles[p.role_idx] || 0) + 1; });
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
  const { t, lang, dict } = await getT();
  const day = (iso) => new Date(iso).toLocaleDateString(lang, { month: "short", day: "numeric", year: "numeric" });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/#start");
  const db = adminClient();
  const { data: program } = db ? await db.from("programs").select("*").eq("director", user.id).maybeSingle() : { data: null };

  if (!program) {
    return (
      <>
        <div className="page-head">
          <p className="eyebrow">{t("program.eyebrow")}</p>
          <h1>{t("program.title")} <span className="gold-text">{t("program.titleGold")}</span></h1>
          <p className="muted">{t("program.sub")}</p>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="card">
          {user.is_anonymous ? (
            <p>{t("program.guest")} <a href="/profile">{t("program.guestLink")}</a></p>
          ) : (
            <form action={startPilot}>
              <label htmlFor="pg-name">{t("program.nameLabel")}</label>
              <input id="pg-name" name="name" type="text" required minLength={2} maxLength={100} placeholder={t("program.namePlaceholder")} />
              <button type="submit">{t("program.start")}</button>
              <p><small>{t("program.startNote")} <a href="/pricing#schools">{t("program.details")}</a></small></p>
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
        <p className="eyebrow">{t("program.dashboard")} · {program.plan === "pilot" ? t("program.pilot") : t("program.licence")}</p>
        <h1>{program.name}</h1>
        <p className={active ? "muted" : "error"}>{active ? t("program.activeUntil", { date: day(program.active_until) }) : t("program.ended", { date: day(program.active_until) })} · {t("program.seats", { used: o.students, seats: program.seats })}</p>
      </div>
      {started && <p className="ok">{t("program.started")}</p>}

      <div className="card join-code">
        <h2>{t("program.joinCode")}</h2>
        <p className="code-big">{program.code}</p>
        <p>{t("program.howToJoin")}</p>
        <CopyButton label={t("program.copyInvite")} text={t("program.invite", { url: joinUrl, code: program.code })} />
      </div>

      <h2 className="step-title">{t("program.outcomes")}</h2>
      <div className="card">
        {!o.students ? <p>{t("program.none")}</p> : (
          <>
            <div className="stat-grid">
              <div><strong>{o.students}</strong><span>{t("program.statStudents")}</span></div>
              <div><strong>{pct(o.passports, o.students)}</strong><span>{t("program.statPassports", { n: o.passports })}</span></div>
              <div><strong>{pct(o.withProof, o.students)}</strong><span>{t("program.statProof")}</span></div>
              <div><strong>{o.proofLines}</strong><span>{t("program.statLines")}</span></div>
              <div><strong>{pct(o.targets, o.students)}</strong><span>{t("program.statTargets")}</span></div>
              <div><strong>{o.stepsDone} / {o.stepsTotal}</strong><span>{t("program.statSteps")}</span></div>
              <div><strong>{pct(o.activePlans, o.students)}</strong><span>{t("program.statActive")}</span></div>
              <div><strong>{pct(o.publicLinks, o.students)}</strong><span>{t("program.statLinks")}</span></div>
            </div>
            {o.students >= 5 && o.roles.length > 0 && (
              <>
                <h3>{t("program.targetCareers")}</h3>
                <ul>{o.roles.map(([i, c]) => <li key={i}>{pathName(dict, Number(i))}: {c}</li>)}</ul>
              </>
            )}
            <p><small>{t("program.totalsNote")}</small></p>
          </>
        )}
      </div>
    </>
  );
}
