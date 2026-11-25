"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "../i18n-provider";

// Share tab: optional badges that show employers who you are. LinkedIn needs the owner to switch on
// "LinkedIn (OIDC)" and "manual linking" in Supabase first; until then the button says it isn't available.
export default function TrustCard({ linkedin, school, emailOk }) {
  const { t } = useT();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true); setError("");
    const next = encodeURIComponent("/profile?tab=share");
    const { error: err } = await createClient().auth.linkIdentity({
      provider: "linkedin_oidc",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` }
    });
    if (err) { setError(t("trust.linkedinOff")); setBusy(false); }
  }

  return (
    <div className="card trust-card">
      <h3>{t("trust.cardTitle")}</h3>
      <p className="muted"><small>{t("trust.cardSub")}</small></p>
      <ul className="trust-list">
        <li>{emailOk ? `✓ ${t("trust.badgeEmail")}` : `○ ${t("trust.badgeEmailMissing")}`}</li>
        <li>{school ? `✓ ${t("trust.badgeSchool", { domain: school })}` : `○ ${t("trust.schoolTip")}`}</li>
        <li>{linkedin ? `✓ ${t("trust.badgeLinkedin")}` : (
          <>○ <button type="button" className="link-button" disabled={busy || !emailOk} onClick={connect}>{t("trust.connectLinkedin")}</button>{!emailOk && <small className="muted"> ({t("trust.needEmailShort")})</small>}</>
        )}</li>
      </ul>
      {error && <p className="error"><small>{error}</small></p>}
    </div>
  );
}
