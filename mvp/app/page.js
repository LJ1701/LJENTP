import { createClient } from "@/lib/supabase/server";
import SignInForm from "./sign-in-form";
import GuestButton from "./guest-button";
import HomeSearch from "./home-search";
import { HeroGoldie } from "./goldie";
import { jobStats } from "@/lib/jobs";
import { getT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [{ data: { user } }, stats, { t, lang, dict }] = await Promise.all([supabase.auth.getUser(), jobStats(), getT()]);

  return (
    <>
      <section className="hero-x" aria-labelledby="heroTitle">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{t("home.eyebrow")}</p>
            <h1 id="heroTitle" className="hero-title">{t("home.title")} <span className="gold-text">{t("home.titleGold")}</span></h1>
            <p className="hero-sub">{t("home.sub")}</p>
            {user ? <a href="/profile" className="cta big">{t("home.openPassport")}</a> : <GuestButton />}
            {!user && <p className="hero-note"><small>{t("home.free")} <a href="#start">{t("home.signIn")}</a></small></p>}
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-1" aria-hidden="true" />
            <div className="orbit orbit-2" aria-hidden="true" />
            <div className="orbit orbit-3" aria-hidden="true"><span className="orbit-dot" /></div>
            <svg className="hero-sig" viewBox="0 0 200 200" aria-hidden="true">
              <polygon className="hero-sig-grid" points="100,30 150,50 170,100 150,150 100,170 50,150 30,100 50,50" />
              <polygon className="hero-sig-grid" points="100,65 125,75 135,100 125,125 100,135 75,125 65,100 75,75" />
              <polygon className="hero-sig-shape" points="100,44 140,60 156,100 140,140 100,156 60,140 44,100 60,60" />
            </svg>
            <img src="/logo.svg" alt="" className="hero-logo" />
            <div className="hero-scan" aria-hidden="true" />
            <HeroGoldie />
          </div>
        </div>
        <div className="live-stats">
          <span className="live-dot" aria-hidden="true" />
          <span><strong>{stats.total.toLocaleString(lang)}</strong> {t("home.statsJobs")}</span>
          <span><strong>{stats.internships.toLocaleString(lang)}</strong> {t("home.statsInterns")}</span>
          <span><strong>{stats.employers}</strong> {t("home.statsEmployers")}</span>
        </div>
        <HomeSearch signedIn={!!user} />
        {stats.latest.length > 0 && (
          <div className="just-posted">
            <span className="eyebrow">{t("home.justPosted")}</span>
            <div className="just-posted-track">
              {stats.latest.map((j) => <a key={j.id} href={j.url} target="_blank" rel="noopener noreferrer">{j.title} · <span className="muted">{j.company}</span></a>)}
            </div>
          </div>
        )}
        <ol className="how-strip">
          {dict.home.how.map(([title, text], i) => (
            <li key={title}><span className="step-num">{i + 1}</span><div><strong>{title}</strong><span>{text}</span></div></li>
          ))}
        </ol>
      </section>

      <section className="who card">
        <h2>{t("home.whoTitle")}</h2>
        <div className="who-grid">
          {dict.home.who.map((w) => <span key={w} className="pill">{w}</span>)}
        </div>
      </section>

      <div id="start" />
      {error === "signin" && <p className="error">{t("home.errorSignin")}</p>}
      {user ? (
        <div className="card auth-card" style={{ textAlign: "center" }}>
          <p className="ok">{user.is_anonymous ? t("home.guestUsing") : t("home.signedInAs", { email: user.email })}</p>
          <a className="cta" href="/profile">{t("home.goPassport")}</a>
          <form action="/auth/signout" method="post">
            <button type="submit" className="ghost">{user.is_anonymous ? t("home.leaveGuest") : t("home.signOut")}</button>
          </form>
        </div>
      ) : (
        <SignInForm />
      )}
    </>
  );
}
