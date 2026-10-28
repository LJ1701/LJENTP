"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Turns a guest Passport into a normal account without losing anything: the same user ID gets an email
// (confirmed by link), then a password. "needs_password" in the user's metadata remembers the second step.
// stage: "guest" (no email yet), "pending" (link sent to pendingEmail), "password" (email confirmed, no password yet)
export default function SaveAccount({ stage, pendingEmail }) {
  const router = useRouter();
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
    if (err) setError(/already/i.test(err.message) ? "That email already has an account. Sign out of guest mode and sign in with it instead." : err.message);
    else { setMessage(`Check ${email} and click the confirmation link. Open it in this browser.`); setRetry(false); router.refresh(); }
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
        <strong>Last step: choose a password</strong>
        <p className="muted">Your email is confirmed. Add a password so you can sign in on any device.</p>
        <label htmlFor="new-password">Password (at least 8 characters)</label>
        <input id="new-password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
        {error && <p className="error">{error}</p>}
      </form>
    );
  }

  return (
    <div className="card save-account">
      <strong>You&apos;re using a guest Passport</strong>
      {stage === "pending" && !retry ? (
        <>
          <p className="muted">{message || `We sent a confirmation link to ${pendingEmail}. Click it (in this browser) and your Passport is saved to that email.`}</p>
          <button type="button" className="link-button" onClick={() => { setRetry(true); setMessage(""); }}>Use a different email or resend</button>
        </>
      ) : (
        <form onSubmit={saveEmail}>
          <p className="muted">It&apos;s saved on this browser only. Add your email to keep it and sign in anywhere: nothing you&apos;ve entered is lost.</p>
          <div className="save-row">
            <label htmlFor="save-email" className="visually-hidden">Email</label>
            <input id="save-email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" disabled={busy}>{busy ? "Sending…" : "Save my Passport"}</button>
          </div>
          {message && <p className="ok">{message}</p>}
        </form>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
