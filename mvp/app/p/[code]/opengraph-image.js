import { ImageResponse } from "next/og";
import { getPublicProfile } from "@/lib/public-profile";
import { effectiveProfile } from "@/lib/detect";
import { CAREER_PATHS, topMatches } from "@/lib/careers";

// The gold card people see when a proof link is pasted into LinkedIn, iMessage or a group chat.
export const alt = "LJSportMind Sports Passport";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same file as public/logo.svg, embedded so the image works on the server without reading files.
const LOGO = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjIwIDIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZFJpbmciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZTljNzdiIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjYzk5NzRhIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzljNmYyZiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CgogIDxjaXJjbGUgY3g9IjExMCIgY3k9IjExMCIgcj0iOTQiIGZpbGw9IiMxNjIxM2EiIHN0cm9rZT0idXJsKCNnb2xkUmluZykiIHN0cm9rZS13aWR0aD0iNiIvPgoKICA8cmVjdCB4PSI3MCIgeT0iNTQiIHdpZHRoPSI4MCIgaGVpZ2h0PSIxMTIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y0ZjRmNCIgc3Ryb2tlLXdpZHRoPSIyLjUiLz4KICA8cmVjdCB4PSI3NiIgeT0iNjAiIHdpZHRoPSI2OCIgaGVpZ2h0PSIxMDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y0ZjRmNCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KCiAgPGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjdmN2Y3IiBzdHJva2Utd2lkdGg9IjEyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPgogICAgPHBhdGggZD0iTTg4LDcwIEw4OCwxNTAgTDEwMCwxNTAiLz4KICAgIDxwYXRoIGQ9Ik0xMzYsNzAgTDEzNiwxMTIgUTEzNiwxNTAgMTIyLDE1MCIvPgogIDwvZz4KPC9zdmc+Cg==";

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
