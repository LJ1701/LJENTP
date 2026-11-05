"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewJobs } from "./home-actions";
import { startGuest } from "./guest-button";
import { useT, CountryPicker } from "./i18n-provider";

export const PENDING_KEY = "ljsm-pending-search";

// "today", "1 day ago", "5 days ago" in the visitor's language.
export const agoText = (t, iso) => {
  const days = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  return days === 0 ? t("time.today") : days === 1 ? t("time.oneDay") : t("time.days", { n: days });
};

// Homepage job search: real postings before signing up. "See your fit" remembers the search, starts a guest
// Passport (or opens yours) and runs the same search there with a fit check against your proof.
export default function HomeSearch({ signedIn }) {
  const router = useRouter();
  const { t, dict } = useT();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [pending, start] = useTransition();
  const [going, setGoing] = useState(false);
  const [error, setError] = useState("");

  const search = (q) => {
    setText(q);
    start(async () => setResult(await previewJobs(q)));
  };

  async function seeFit() {
    setGoing(true);
    try { window.localStorage.setItem(PENDING_KEY, text || "sports jobs"); } catch {}
    if (!signedIn) {
      const res = await startGuest();
      if (res.error) { setError(res.error === "notOn" ? t("guest.notOn") : res.error); setGoing(false); return; }
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="home-search">
      <CountryPicker onChange={() => { if (result) search(text || "sports jobs"); }} />
      <form className="home-search-bar" onSubmit={(e) => { e.preventDefault(); search(text); }}>
        <label htmlFor="home-q" className="visually-hidden">{t("search.label")}</label>
        <input id="home-q" type="text" maxLength={120} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("search.placeholder")} />
        <button type="submit" disabled={pending}>{pending ? t("search.searching") : t("search.search")}</button>
      </form>
      <div className="chips">
        {dict.search.starters.map(([label, q]) => <button type="button" key={label} disabled={pending} onClick={() => { setText(label); start(async () => setResult(await previewJobs(q))); }}>{label}</button>)}
      </div>

      {pending && <div className="job-skeleton" aria-label={t("search.searching")}><span /><span /></div>}

      {result && !pending && (
        <div className="job-results" aria-live="polite">
          <p className="job-summary"><span className="live-dot" aria-hidden="true" /> {result.query.summary}{result.jobs.length ? ` · ${t("search.found", { n: result.total })}` : ""}</p>
          {!result.jobs.length ? (
            <p>{t("search.noAnswer")}</p>
          ) : (
            <>
              <div className="home-jobs">
                {result.jobs.map((j) => (
                  <a key={j.id} className="home-job" href={j.url} target="_blank" rel="noopener noreferrer">
                    <strong>{j.title}</strong>
                    <span className="muted">{j.company}{j.location && ` · ${j.location}`}</span>
                    <small>{j.created ? `${t("search.posted", { ago: agoText(t, j.created) })} · ` : ""}{t("search.via", { source: j.source })} ↗</small>
                  </a>
                ))}
              </div>
              <div className="fit-cta">
                <div>
                  <strong>{t("search.fitTitle")}</strong>
                  <span className="muted"> {t("search.fitText")}</span>
                </div>
                <button type="button" onClick={seeFit} disabled={going}>{going ? t("search.opening") : t("search.seeFit")}</button>
              </div>
              {error && <p className="error">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
