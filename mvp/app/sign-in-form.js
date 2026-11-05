"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GuestButton from "./guest-button";
import { useT } from "./i18n-provider";

// Guest mode on top (one click), then email + password. "Create account" signs up; "Sign in" checks the password with Supabase.
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

  return (
    <form onSubmit={onSubmit} className="card auth-card">
      <h2>{t("signin.title")}</h2>
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
