// Job Fit Check: which skills a job asks for, and whether this user has proof for each one.
// Uses the same keyword tables that find skills in achievements (lib/detect.js), so it is instant,
// free, and can only quote lines the user actually wrote.
import { detectSkills, effectiveProfile } from "@/lib/detect";
import { label } from "@/lib/careers";

export function fitCheck(jobText, profile) {
  const asked = Object.keys(detectSkills(String(jobText || "").replace(/[.;•]\s*/g, "\n")));
  const eff = effectiveProfile(profile);
  const rows = asked.map((tag) => {
    if (eff.evidence[tag]) return { tag, name: label(tag), status: "proof", quote: eff.evidence[tag] };
    if (eff.skills.includes(tag)) return { tag, name: label(tag), status: "claimed" };
    return { tag, name: label(tag), status: "gap" };
  });
  const order = { proof: 0, claimed: 1, gap: 2 };
  rows.sort((a, b) => order[a.status] - order[b.status]);
  const proven = rows.filter((r) => r.status === "proof").length;
  return { rows, proven, total: rows.length };
}
