import { createClient } from "@/lib/supabase/server";
import SignInForm from "./sign-in-form";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <h1>LJSportMind MVP</h1>
      {error === "signin" && <p className="error">That confirmation link didn&apos;t work or has expired. Try signing in, or create the account again.</p>}
      {user ? (
        <>
          <p className="ok">Signed in as {user.email}</p>
          <p><a href="/profile">Go to my Sports Profile, matches and plan →</a></p>
          <form action="/auth/signout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </>
      ) : (
        <>
          <p>Step 2: sign in with your email and password.</p>
          <SignInForm />
        </>
      )}
    </>
  );
}
