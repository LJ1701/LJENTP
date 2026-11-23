"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "../../i18n-provider";

// Before answering, the reference proves who they are: we email them a one-time sign-in link, and opening it
// brings them back here signed in. A work email shows as "work email (@club.com)" on the proof page.
export default function EmailStep({ token }) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");

  async function send(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const { error: err } = await createClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback?next=/r/${token}` }
    });
    setBusy(false);
    if (err) setError(/rate|limit|seconds/i.test(err.message) ? t("trust.emailWait") : t("confirm.error"));
    else setSent(email);
  }

  if (sent) return <p className="ok">{t("trust.emailSent", { email: sent })}</p>;
  return (
    <form onSubmit={send} className="email-step">
      <label htmlFor="ref-email">{t("trust.emailLabel")}</label>
      <div className="save-row">
        <input id="ref-email" type="email" required autoComplete="email" placeholder="you@club.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={busy}>{busy ? t("save.sending") : t("trust.emailSend")}</button>
      </div>
      <p className="muted"><small>{t("trust.emailWhy")}</small></p>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
