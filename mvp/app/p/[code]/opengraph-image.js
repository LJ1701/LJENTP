import { ImageResponse } from "next/og";
import { getPublicProfile } from "@/lib/public-profile";
import { effectiveProfile } from "@/lib/detect";
import { CAREER_PATHS, topMatches } from "@/lib/careers";

// The gold card people see when a proof link is pasted into LinkedIn, iMessage or a group chat.
export const alt = "LJSportMind Sports Passport";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same file as public/logo.svg, embedded so the image works on the server without reading files.
const LOGO = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjIwIDIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZFJpbmciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2U5Yzc3YiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iI2M5OTc0YSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM5YzZmMmYiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgoKICA8Y2lyY2xlIGN4PSIxMTAiIGN5PSIxMTAiIHI9Ijk0IiBmaWxsPSIjMTYyMTNhIiBzdHJva2U9InVybCgjZ29sZFJpbmcpIiBzdHJva2Utd2lkdGg9IjYiLz4KCiAgPCEtLSBGcmFtZXMgYW5kIGxldHRlcnMgYXJlIG1pcnJvciBpbWFnZXMgYXJvdW5kIHggPSAxMTAgYW5kIGNlbnRyZWQgb24geSA9IDExMC4gLS0+CiAgPHJlY3QgeD0iNTQiIHk9IjU4IiB3aWR0aD0iMTEyIiBoZWlnaHQ9IjEwNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjRmNGY0IiBzdHJva2Utd2lkdGg9IjIuNSIvPgogIDxyZWN0IHg9IjYxIiB5PSI2NSIgd2lkdGg9Ijk4IiBoZWlnaHQ9IjkwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmNGY0ZjQiIHN0cm9rZS13aWR0aD0iMS41Ii8+CgogIDxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y3ZjdmNyIgc3Ryb2tlLXdpZHRoPSIxNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICAgIDxwYXRoIGQ9Ik03Niw3OSBMNzYsMTQxIEwxMDEsMTQxIi8+CiAgICA8cGF0aCBkPSJNMTQ0LDc5IEwxNDQsMTE3IFExNDQsMTQxIDExOSwxNDEiLz4KICA8L2c+Cjwvc3ZnPgo=";

export default async function Image({ params }) {
  const { code } = await params;
  const p = await getPublicProfile(code);
  const eff = p ? effectiveProfile(p) : null;
  const proofs = eff ? Object.keys(eff.evidence).length : 0;
  const career = p ? (p.role_idx !== null && p.role_idx !== undefined ? CAREER_PATHS[p.role_idx].name : (topMatches(eff)[0] || {}).name) : "";
  const done = p && p.steps ? p.steps.filter((s) => s.done).length : 0;
  const gold = "linear-gradient(135deg, #f6e1a6, #e9c77b, #c9974a, #9c6f2f)";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, color: "#f3f1ea", background: "radial-gradient(circle at 80% 20%, #2a2010 0%, #050608 60%)", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={LOGO} width={84} height={84} />
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700 }}>LJSport<span style={{ color: "#e9c77b" }}>Mind</span></div>
          <div style={{ marginLeft: "auto", display: "flex", padding: "10px 22px", borderRadius: 999, background: gold, color: "#1a1206", fontSize: 24, fontWeight: 700 }}>SPORTS PASSPORT</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{p ? p.full_name || "Sports Profile" : "Sports Profile"}</div>
          <div style={{ fontSize: 32, color: "#9da1ab", marginTop: 12 }}>{p ? [p.role, p.sport].filter(Boolean).join(" · ") : "Find your place in the sports industry"}</div>
          {career && <div style={{ display: "flex", fontSize: 36, marginTop: 22 }}>Working toward:&nbsp;<span style={{ color: "#e9c77b" }}>{career}</span></div>}
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {p && <div style={{ display: "flex", padding: "14px 24px", borderRadius: 18, border: "2px solid #c9974a", fontSize: 28 }}>{proofs ? `${proofs} skills backed by proof` : `${eff.skills.length + eff.interests.length} skills and interests`}</div>}
          {p && p.steps && <div style={{ display: "flex", padding: "14px 24px", borderRadius: 18, border: "2px solid rgba(233,199,123,0.35)", fontSize: 28 }}>{done}/{p.steps.length} plan steps done</div>}
          <div style={{ marginLeft: "auto", fontSize: 26, color: "#e9c77b" }}>Advice is everywhere. Proof isn&apos;t.</div>
        </div>
      </div>
    ),
    size
  );
}
