import { createClient } from "@/lib/supabase/server";
import SignInForm from "./sign-in-form";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <div className="hero">
        <img src="/logo.svg" alt="LJSportMind logo" width={96} height={96} />
        <h1>Find your sports career. <span className="gold-text">Prove it.</span></h1>
        <p className="tagline">Build your Sports Profile, see the careers it fits with the evidence behind each match, and keep a plan you can show employers.</p>
        <ol className="steps">
          <li><b>1. Profile</b>Your skills, interests and achievements</li>
          <li><b>2. Matches</b>Careers that fit, with proof from your own words</li>
          <li><b>3. Plan</b>Saved steps, an AI coach and a public proof link</li>
        </ol>
      </div>

      {error === "signin" && <p className="error">That confirmation link didn&apos;t work or has expired. Try signing in, or create the account again.</p>}
      {user ? (
        <div className="card auth-card" style={{ textAlign: "center" }}>
          <p className="ok">Signed in as {user.email}</p>
          <a className="cta" href="/profile">Go to my Sports Profile →</a>
          <form action="/auth/signout" method="post">
            <button type="submit" className="ghost">Sign out</button>
          </form>
        </div>
      ) : (
        <SignInForm />
      )}
    </>
  );
}
