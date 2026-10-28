"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Guest mode: Supabase makes a real account with a unique ID for this browser, with no email or password.
// The data is protected by the same row level security as any account; adding an email later keeps it.
export async function startGuest() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return {}; // Already signed in (guest or email): never replace that account with a new one.
  const { error } = await supabase.auth.signInAnonymously();
  if (!error) return {};
  return { error: /anonymous/i.test(error.message) ? "Guest mode isn't switched on yet. Create an account with email below instead." : error.message };
}

export default function GuestButton({ className = "cta big", children = "Start now: no account needed →" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setBusy(true);
    setError("");
    const res = await startGuest();
    if (res.error) {
      setError(res.error);
      setBusy(false);
    } else {
      router.push("/profile");
      router.refresh();
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={onClick} disabled={busy}>{busy ? "Setting up your Passport…" : children}</button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
