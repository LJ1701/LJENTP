import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CAREER_PATHS, label } from "@/lib/careers";
import { effectiveProfile } from "@/lib/detect";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sports Profile · LJSportMind", robots: { index: false } };

// Read-only public proof page. Works signed out: the database function returns this one profile only
// while its owner has the link switched on.
export default async function PublicProfile({ params }) {
  const { code } = await params;
  if (!/^[a-z0-9]{10}$/.test(code)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_profile", { code });
  const p = data && data[0];
  if (!p) notFound();

  const eff = effectiveProfile(p);
  const done = p.steps ? p.steps.filter((s) => s.done).length : 0;

  return (
    <>
      <p><small>LJSportMind · Sports Profile</small></p>
      <h1>{p.full_name || "Sports Profile"}</h1>
      <p>{[p.role, p.sport].filter(Boolean).join(" · ")}</p>
      {p.goal && <p><strong>Goal:</strong> {p.goal}</p>}

      <h2>Skills and interests</h2>
      <ul>
        {[...eff.skills, ...eff.interests].map((t) => (
          <li key={t}>
            <strong>{label(t)}</strong>
            {eff.evidence[t] && <> · evidence: &ldquo;{eff.evidence[t]}&rdquo;</>}
          </li>
        ))}
      </ul>

      {p.achievements && (
        <>
          <h2>Achievements</h2>
          <ul>{p.achievements.split("\n").filter((l) => l.trim()).map((l, i) => <li key={i}>{l}</li>)}</ul>
        </>
      )}

      {p.role_idx !== null && p.role_idx !== undefined && p.steps && (
        <>
          <h2>Working toward: {CAREER_PATHS[p.role_idx].name}</h2>
          <p>{done} of {p.steps.length} plan steps done</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {p.steps.map((s, i) => <li key={i}>{s.done ? "☑" : "☐"} {s.text}</li>)}
          </ul>
        </>
      )}

      <p><small>Self-reported by the profile owner; achievements are in their own words. Last updated {new Date(p.updated_at).toLocaleDateString("en-US")}.</small></p>
    </>
  );
}
