"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "../i18n-provider";

// Turns a guest Passport into a normal account without losing anything: the same user ID gets an email
// (confirmed by link), then a password. "needs_password" in the user's metadata remembers the second step.
// stage: "guest" (no email yet), "pending" (link sent to pendingEmail), "password" (email confirmed, no password yet)
export default function SaveAccount({ stage, pendingEmail }) {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(false);

  async function saveEmail(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await createClient().auth.updateUser(
      { email, data: { needs_password: true } },
      { emailRedirectTo: `${window.location.origin}/auth/callback` }
    );
    if (err) setError(/already/i.test(err.message) ? t("save.emailTaken") : err.message);
    else { setMessage(t("save.checkEmail", { email })); setRetry(false); router.refresh(); }
    setBusy(false);
  }

  async function savePassword(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await createClient().auth.updateUser({ password, data: { needs_password: false } });
    if (err) setError(err.message);
    else router.refresh();
    setBusy(false);
  }

  if (stage === "password") {
    return (
      <form onSubmit={savePassword} className="card save-account">
        <strong>{t("save.lastStep")}</strong>
        <p className="muted">{t("save.confirmed")}</p>
        <label htmlFor="new-password">{t("signin.password")}</label>
        <input id="new-password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={busy}>{busy ? t("save.saving") : t("save.savePassword")}</button>
        {error && <p className="error">{error}</p>}
      </form>
    );
  }

  return (
    <div className="card save-account">
      <strong>{t("save.guestTitle")}</strong>
      {stage === "pending" && !retry ? (
        <>
          <p className="muted">{message || t("save.sentLink", { email: pendingEmail })}</p>
          <button type="button" className="link-button" onClick={() => { setRetry(true); setMessage(""); }}>{t("save.different")}</button>
        </>
      ) : (
        <form onSubmit={saveEmail}>
          <p className="muted">{t("save.keepIt")}</p>
          <div className="save-row">
            <label htmlFor="save-email" className="visually-hidden">{t("signin.email")}</label>
            <input id="save-email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" disabled={busy}>{busy ? t("save.sending") : t("save.savePassport")}</button>
          </div>
          {message && <p className="ok">{message}</p>}
        </form>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
