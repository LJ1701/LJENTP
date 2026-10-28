"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewJobs } from "./home-actions";
import { startGuest } from "./guest-button";

const STARTERS = ["Sports internships", "Marketing jobs", "NBA jobs", "Data analyst jobs", "Event jobs in New York"];
export const PENDING_KEY = "ljsm-pending-search";

const ago = (iso) => {
  const days = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
};

// Homepage job search: real postings before signing up. "See your fit" remembers the search, starts a guest
// Passport (or opens yours) and runs the same search there with a fit check against your proof.
export default function HomeSearch({ signedIn }) {
  const router = useRouter();
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
    try { window.localStorage.setItem(PENDING_KEY, text || "Sports jobs"); } catch {}
    if (!signedIn) {
      const res = await startGuest();
      if (res.error) { setError(res.error); setGoing(false); return; }
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="home-search">
      <form className="home-search-bar" onSubmit={(e) => { e.preventDefault(); search(text); }}>
        <label htmlFor="home-q" className="visually-hidden">What sports job do you want?</label>
        <input id="home-q" type="text" maxLength={120} value={text} onChange={(e) => setText(e.target.value)} placeholder="What sports job do you want? Try “marketing internships”" />
        <button type="submit" disabled={pending}>{pending ? "Searching…" : "Search"}</button>
      </form>
      <div className="chips">
        {STARTERS.map((s) => <button type="button" key={s} disabled={pending} onClick={() => search(s)}>{s}</button>)}
      </div>

      {pending && <div className="job-skeleton" aria-label="Searching jobs"><span /><span /></div>}

      {result && !pending && (
        <div className="job-results" aria-live="polite">
          <p className="job-summary"><span className="live-dot" aria-hidden="true" /> {result.query.summary}{result.jobs.length ? ` · ${result.total} found` : ""}</p>
          {!result.jobs.length ? (
            <p>The job sources didn&apos;t answer just now. Try again in a minute.</p>
          ) : (
            <>
              <div className="home-jobs">
                {result.jobs.map((j) => (
                  <a key={j.id} className="home-job" href={j.url} target="_blank" rel="noopener noreferrer">
                    <strong>{j.title}</strong>
                    <span className="muted">{j.company}{j.location && ` · ${j.location}`}</span>
                    <small>{j.created ? `Posted ${ago(j.created)} · ` : ""}via {j.source} ↗</small>
                  </a>
                ))}
              </div>
              <div className="fit-cta">
                <div>
                  <strong>Which of these can you already prove?</strong>
                  <span className="muted"> Build a free Passport and every posting gets a fit check.</span>
                </div>
                <button type="button" onClick={seeFit} disabled={going}>{going ? "Opening…" : "See my fit →"}</button>
              </div>
              {error && <p className="error">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
