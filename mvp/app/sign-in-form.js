"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GuestButton from "./guest-button";
import { useT } from "./i18n-provider";

// Google (one click, email already checked by Google), guest mode, then email + password. "Create account" signs up; "Sign in" checks the password with Supabase.
// The password goes straight to Supabase Auth over HTTPS; this app never stores or sees it again.
export default function SignInForm() {
  const router = useRouter();
  const { t } = useT();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const supabase = createClient();
    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      if (err) setError(err.message);
      else if (data.session) router.refresh();
      else setMessage(t("signin.created", { email }));
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message === "Invalid login credentials" ? t("signin.wrong") : err.message);
      else router.refresh();
    }
    setBusy(false);
  }

  async function google() {
    setBusy(true); setError("");
    const { error: err } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/profile` }
    });
    if (err) { setBusy(false); setError(t("signin.googleError")); }
  }

  return (
    <form onSubmit={onSubmit} className="card auth-card">
      <h2>{t("signin.title")}</h2>
      <button type="button" className="google-btn" disabled={busy} onClick={google}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        {t("signin.google")}
      </button>
      <GuestButton className="guest-btn">{t("guest.tryGuest")}</GuestButton>
      <p className="divider"><span>{t("signin.or")}</span></p>
      <h3>{mode === "signup" ? t("signin.create") : t("signin.signin")}</h3>
      <label htmlFor="email">{t("signin.email")}</label>
      <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="password">{t("signin.password")}</label>
      <input
        id="password"
        type="password"
        minLength={8}
        required
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={busy}>{busy ? t("signin.wait") : mode === "signup" ? t("signin.create") : t("signin.signin")}</button>
      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}
      <p>
        {mode === "signup" ? t("signin.already") : t("signin.newHere")}{" "}
        <button type="button" className="link-button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); setError(""); }}>
          {mode === "signup" ? t("signin.signInInstead") : t("signin.createAccount")}
        </button>
      </p>
    </form>
  );
}
