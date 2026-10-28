import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Sign-up and "save my guest Passport" emails link here with a one-time code; swap it for a session and open the Passport.
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/profile", url.origin));
  }
  return NextResponse.redirect(new URL("/?error=signin", url.origin));
}
