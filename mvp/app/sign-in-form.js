"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Email + password. "Create account" signs up; "Sign in" checks the password with Supabase.
// The password goes straight to Supabase Auth over HTTPS; this app never stores or sees it again.
export default function SignInForm() {
  const router = useRouter();
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
      else setMessage(`Account created. Check ${email} for a confirmation link, then come back and sign in.`);
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message === "Invalid login credentials" ? "Wrong email or password." : err.message);
      else router.refresh();
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit}>
      <h2>{mode === "signup" ? "Create account" : "Sign in"}</h2>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="password">Password (at least 8 characters)</label>
      <input
        id="password"
        type="password"
        minLength={8}
        required
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
      {message && <p className="ok">{message}</p>}
      {error && <p className="error">{error}</p>}
      <p>
        {mode === "signup" ? "Already have an account? " : "New here? "}
        <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); setError(""); }}>
          {mode === "signup" ? "Sign in instead" : "Create an account"}
        </button>
      </p>
    </form>
  );
}
