import { createClient } from "@/lib/supabase/server";
import SignInForm from "./sign-in-form";
import GuestButton from "./guest-button";
import HomeSearch from "./home-search";
import { HeroGoldie } from "./goldie";
import { jobStats } from "@/lib/jobs";

export const dynamic = "force-dynamic";

const HOW = [
  ["1", "Passport", "Add what you've done, in your own words, or paste your résumé."],
  ["2", "Fit", "See the sports careers and real jobs you fit, with proof for each skill."],
  ["3", "Proof", "One link and honest résumé bullets for every application."]
];

export default async function Home({ searchParams }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [{ data: { user } }, stats] = await Promise.all([supabase.auth.getUser(), jobStats()]);

  return (
    <>
      <section className="hero-x" aria-labelledby="heroTitle">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">AI sports career discovery · by LJSOCCER</p>
            <h1 id="heroTitle" className="hero-title">Find your place in the sports industry. <span className="gold-text">Prove it.</span></h1>
            <p className="hero-sub">Played, coached, created or just love the game: see the careers you fit, real jobs hiring now, and what you can already prove.</p>
            {user ? <a href="/profile" className="cta big">Open my Sports Passport →</a> : <GuestButton />}
            {!user && <p className="hero-note"><small>Free · no account needed · <a href="#start">Sign in</a></small></p>}
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-1" aria-hidden="true" />
            <div className="orbit orbit-2" aria-hidden="true" />
            <div className="orbit orbit-3" aria-hidden="true"><span className="orbit-dot" /></div>
            <svg className="hero-sig" viewBox="0 0 200 200" aria-hidden="true">
              <polygon className="hero-sig-grid" points="100,30 150,50 170,100 150,150 100,170 50,150 30,100 50,50" />
              <polygon className="hero-sig-grid" points="100,65 125,75 135,100 125,125 100,135 75,125 65,100 75,75" />
              <polygon className="hero-sig-shape" points="100,42 142,58 158,100 136,138 100,152 62,140 48,100 66,62" />
            </svg>
            <img src="/logo.svg" alt="" className="hero-logo" />
            <div className="hero-scan" aria-hidden="true" />
            <HeroGoldie />
          </div>
        </div>
        <div className="live-stats">
          <span className="live-dot" aria-hidden="true" />
          <span><strong>{stats.total.toLocaleString("en-US")}</strong> sports job postings live</span>
          <span><strong>{stats.internships}</strong> internships at sports companies</span>
          <span><strong>{stats.sources}</strong> sources · updated hourly</span>
        </div>
        <HomeSearch signedIn={!!user} />
        {stats.latest.length > 0 && (
          <div className="just-posted">
            <span className="eyebrow">Just posted</span>
            <div className="just-posted-track">
              {stats.latest.map((j) => <a key={j.id} href={j.url} target="_blank" rel="noopener noreferrer">{j.title} · <span className="muted">{j.company}</span></a>)}
            </div>
          </div>
        )}
        <ol className="how-strip">
          {HOW.map(([n, title, text]) => (
            <li key={n}><span className="step-num">{n}</span><div><strong>{title}</strong><span>{text}</span></div></li>
          ))}
        </ol>
      </section>

      <section className="who card">
        <h2>Built for everyone heading into sports</h2>
        <div className="who-grid">
          {["Students", "Athletes, any sport", "Former players", "Coaches", "Creators", "Career changers", "Fans with a plan"].map((w) => <span key={w} className="pill">{w}</span>)}
        </div>
      </section>

      <div id="start" />
      {error === "signin" && <p className="error">That confirmation link didn&apos;t work or has expired. Try signing in, or create the account again. Saving a guest Passport? Open the browser you started it in and refresh: your email may already be confirmed.</p>}
      {user ? (
        <div className="card auth-card" style={{ textAlign: "center" }}>
          <p className="ok">{user.is_anonymous ? "You're using a guest Passport on this browser." : `Signed in as ${user.email}`}</p>
          <a className="cta" href="/profile">Go to my Sports Passport →</a>
          <form action="/auth/signout" method="post">
            <button type="submit" className="ghost">{user.is_anonymous ? "Leave guest mode (you lose this Passport)" : "Sign out"}</button>
          </form>
        </div>
      ) : (
        <SignInForm />
      )}
    </>
  );
}
