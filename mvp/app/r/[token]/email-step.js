"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "../../i18n-provider";

// Before answering, the reference proves who they are by signing in with Google or Microsoft, which have
// already checked that the email is theirs. They come straight back here signed in. A work account
// (e.g. @club.com) shows as "work email (@club.com)" on the proof page; the full address is never shown.
export default function EmailStep({ token }) {
  const { t } = useT();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function go(provider) {
    setBusy(provider); setError("");
    const { error: err } = await createClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/r/${token}`,
        ...(provider === "azure" ? { scopes: "email" } : {})
      }
    });
    if (err) { setBusy(""); setError(t("trust.signInError")); }
  }

  return (
    <div className="email-step">
      <div className="ref-actions">
        <button type="button" disabled={!!busy} onClick={() => go("google")}>{busy === "google" ? "…" : t("trust.signInGoogle")}</button>
        <button type="button" disabled={!!busy} onClick={() => go("azure")}>{busy === "azure" ? "…" : t("trust.signInMicrosoft")}</button>
      </div>
      <p className="muted"><small>{t("trust.signInWhy")}</small></p>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
