import { createClient } from "@/lib/supabase/server";
import SignInForm from "./sign-in-form";

export const dynamic = "force-dynamic";

const FEATURES = [
  ["🧭", "Career matches", "Sports roles that fit what you've actually done, with the proof behind each one."],
  ["📡", "Live sports jobs", "Ask in your own words. Real listings come back, each with a fit check."],
  ["🏅", "Proof link", "One link with your evidence and progress, ready for any application."]
];

export default async function Home({ searchParams }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <section className="hero-x" aria-labelledby="heroTitle">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">AI sports career discovery · by LJSOCCER</p>
            <h1 id="heroTitle" className="hero-title">Find your place in the sports industry. <span className="gold-text">Prove it.</span></h1>
            <p className="hero-sub">Whether you played, coached, created, organized or just love the game: see the sports careers you fit, the live jobs hiring now, and exactly what you can prove.</p>
            <a href={user ? "/profile" : "#start"} className="cta big">{user ? "Open my Sports Passport →" : "Get started free →"}</a>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orbit orbit-1" />
            <div className="orbit orbit-2" />
            <div className="orbit orbit-3"><span className="orbit-dot" /></div>
            <svg className="hero-sig" viewBox="0 0 200 200">
              <polygon className="hero-sig-grid" points="100,30 150,50 170,100 150,150 100,170 50,150 30,100 50,50" />
              <polygon className="hero-sig-grid" points="100,65 125,75 135,100 125,125 100,135 75,125 65,100 75,75" />
              <polygon className="hero-sig-shape" points="100,42 142,58 158,100 136,138 100,152 62,140 48,100 66,62" />
            </svg>
            <img src="/logo.svg" alt="" className="hero-logo" />
            <div className="hero-scan" />
          </div>
        </div>
        <div className="hero-features">
          {FEATURES.map(([icon, title, text]) => (
            <div key={title} className="hero-feature">
              <span className="hero-feature-icon" aria-hidden="true">{icon}</span>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="who card">
        <h2>Built for everyone heading into sports</h2>
        <div className="who-grid">
          {["Students", "Athletes, any sport", "Former players", "Coaches", "Creators", "Career changers", "Fans with a plan"].map((w) => <span key={w} className="pill">{w}</span>)}
        </div>
      </section>

      <div id="start" />
      {error === "signin" && <p className="error">That confirmation link didn&apos;t work or has expired. Try signing in, or create the account again.</p>}
      {user ? (
        <div className="card auth-card" style={{ textAlign: "center" }}>
          <p className="ok">Signed in as {user.email}</p>
          <a className="cta" href="/profile">Go to my Sports Passport →</a>
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
