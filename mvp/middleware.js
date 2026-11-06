import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Keeps the Supabase session cookie fresh on every page request.
export async function middleware(request) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  await supabase.auth.getUser();
  // Arrived through a friend's invite link (?ref=abcd2345): remember the code for 30 days, so it counts
  // when this visitor saves their Passport (lib/referrals.js).
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref && /^[a-z0-9]{8}$/.test(ref) && !request.cookies.get("ref")) {
    response.cookies.set("ref", ref, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", httpOnly: true });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
