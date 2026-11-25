import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Sign-up, "save my guest Passport", reference-confirmation and LinkedIn emails/links come back here with a
// one-time code; swap it for a session. `next` may only point to a reference page (/r/...) or the Passport.
const safeNext = (n) => (/^\/r\/[0-9a-f]{64}$/.test(n) || /^\/profile(\?tab=[a-z]+)?$/.test(n) ? n : "/profile");

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next") || "");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  if (next.startsWith("/r/")) return NextResponse.redirect(new URL(`${next}?result=link`, url.origin));
  return NextResponse.redirect(new URL("/?error=signin", url.origin));
}
