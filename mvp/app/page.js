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
            {/* No sub line: the 3 steps below already say how it works. */}
            {user ? <a href="/profile" className="cta big">{t("home.openPassport")}</a> : <GuestButton />}
            {!user && <p className="hero-note"><small>{t("home.free")} <a href="#start">{t("home.signIn")}</a></small></p>}
            <p className="hero-note"><small><a href="/employers">{t("home.employers")}</a></small></p>
          </div>
          <div className="hero-visual">
            <img src="/logo.svg" alt="" className="hero-logo" />
            <HeroGoldie />
          </div>
        </div>
        <ol className="how-strip">
          {dict.home.how.map(([title, text], i) => (
            <li key={title}><span className="step-num">{i + 1}</span><div><strong>{title}</strong><span>{text}</span></div></li>
          ))}
        </ol>
        {/* Jobs come second: somewhere to use the proof, not the product itself. */}
        <h2 className="home-jobs-title">{t("home.jobsTitle")}</h2>
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
      </section>

      {/* Who it's for is said once, in the hero line. A tester (person-2, 17 Nov 2026) noticed it was repeated
          here in a "Built for everyone" box, so that box was removed. */}

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
