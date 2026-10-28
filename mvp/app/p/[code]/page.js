import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/public-profile";
import { CAREER_PATHS, label, topMatches } from "@/lib/careers";
import { effectiveProfile } from "@/lib/detect";

export const dynamic = "force-dynamic";
// Title and description for link previews (LinkedIn, iMessage, group chats); the image is opengraph-image.js.
export async function generateMetadata({ params }) {
  const { code } = await params;
  const p = await getPublicProfile(code);
  if (!p) return { title: "Sports Profile · LJSportMind", robots: { index: false } };
  const eff = effectiveProfile(p);
  const proofs = Object.keys(eff.evidence).length;
  const title = `${p.full_name || "Sports Profile"} · LJSportMind Sports Passport`;
  const description = `${[p.role, p.sport].filter(Boolean).join(" · ")}${proofs ? ` · ${proofs} skills backed by proof` : ""}. See the evidence.`;
  return { title, description, robots: { index: false }, openGraph: { title, description, type: "profile" }, twitter: { card: "summary_large_image", title, description } };
}

// Read-only public proof page. Works signed out: the database function returns this one profile only
// while its owner has the link switched on.
export default async function PublicProfile({ params }) {
  const { code } = await params;
  if (!/^[a-z0-9]{10}$/.test(code)) notFound();
  const p = await getPublicProfile(code);
  if (!p) notFound();

  const eff = effectiveProfile(p);
  const done = p.steps ? p.steps.filter((s) => s.done).length : 0;

  return (
    <>
      <div className="proof-hero">
        <span className="verified">LJSportMind Sports Profile</span>
        <h1>{p.full_name || "Sports Profile"}</h1>
        <p className="muted">{[p.role, p.sport].filter(Boolean).join(" · ")}</p>
        {p.goal && <p><strong>Goal:</strong> {p.goal}</p>}
      </div>

      <section>
      <h2>Skills and interests</h2>
      <ul>
        {[...eff.skills, ...eff.interests].map((t) => (
          <li key={t}>
            <strong>{label(t)}</strong>
            {eff.evidence[t] && <> · evidence: &ldquo;{eff.evidence[t]}&rdquo;</>}
          </li>
        ))}
      </ul>
      </section>

      {p.achievements && (
        <section>
          <h2>Achievements</h2>
          <ul>{p.achievements.split("\n").filter((l) => l.trim()).map((l, i) => <li key={i}>{l}</li>)}</ul>
        </section>
      )}

      {p.role_idx !== null && p.role_idx !== undefined && p.steps && (
        <section>
          <h2>Working toward: <span className="gold-text">{CAREER_PATHS[p.role_idx].name}</span></h2>
          <p>{done} of {p.steps.length} plan steps done</p>
          <div className="progress" aria-hidden="true"><span style={{ width: `${Math.round((done / p.steps.length) * 100)}%` }} /></div>
          <ul className="plan-list">
            {p.steps.map((s, i) => <li key={i}><span className={s.done ? "check done" : "check"} style={{ display: "inline-grid", placeItems: "center" }}>{s.done ? "✓" : ""}</span> <span className={s.done ? "done-text" : ""}>{s.text}</span></li>)}
          </ul>
        </section>
      )}

      <p><small>Self-reported by the profile owner; achievements are in their own words. Last updated {new Date(p.updated_at).toLocaleDateString("en-US")}.</small></p>
    </>
  );
}
