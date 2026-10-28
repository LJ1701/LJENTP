"use client";
import { useState, useTransition, useEffect } from "react";
import { findJobs, checkFit, addGapToPlan } from "./actions";

const ERRORS = {
  off: "Job listings aren't switched on yet. These searches open real listings for the same request:",
  keys: "The job service rejected our keys, so live listings are paused. These searches open real listings:",
  limit: "The job service's free daily limit is used up. Try again tomorrow, or use these searches:",
  down: "The job service isn't answering right now. Try again in a minute, or use these searches:"
};

const ago = (iso) => {
  const days = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
};

// Shows which skills a job asks for: proof (quoted from the user's achievements), ticked only, or a gap.
function FitRows({ fit }) {
  const [added, setAdded] = useState({});
  const [pending, start] = useTransition();
  if (!fit.total) return <p><small>This posting&apos;s summary doesn&apos;t name skills we can check. Open it to read the full requirements.</small></p>;
  return (
    <ul className="fit-list">
      {fit.rows.map((r) => (
        <li key={r.tag} className={`fit-${r.status}`}>
          <span className="fit-icon" aria-hidden="true">{r.status === "proof" ? "✓" : r.status === "claimed" ? "~" : "✕"}</span>
          <span>
            <strong>{r.name}</strong>{" "}
            {r.status === "proof" && <small>proof: &ldquo;{r.quote}&rdquo;</small>}
            {r.status === "claimed" && <small>ticked, but no achievement shows it yet</small>}
            {r.status === "gap" && (
              added[r.tag] ? <small>{added[r.tag]}</small> : (
                <button type="button" className="mini" disabled={pending} onClick={() => start(async () => {
                  const res = await addGapToPlan(r.tag);
                  setAdded((a) => ({ ...a, [r.tag]: res.error || (res.already ? "Already in your plan" : "Added to your plan ✓") }));
                })}>Add to my plan</button>
              )
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

// The postings for one search, each with a fit check. In Goldie's chat (compact) the first 5 show, then "Show more".
export function JobResults({ result, compact = false }) {
  const [open, setOpen] = useState(null);
  const [shown, setShown] = useState(compact ? 5 : 15);
  const links = (list) => list.map(([site, url], i) => <span key={site}>{i > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{site}</a></span>);
  return (
    <div className={compact ? "job-results compact" : "job-results"} aria-live="polite">
      <p className="job-summary"><span className="live-dot" aria-hidden="true" /> {result.query.summary}{result.jobs && result.jobs.length ? ` · ${result.total} found` : ""}</p>
      {result.error ? (
        <>
          <p className="warn">{ERRORS[result.error] || ERRORS.down}</p>
          <p>{links(result.links)}</p>
        </>
      ) : !result.jobs.length ? (
        <>
          <p>No sports postings matched that right now. Try fewer words, or search these sites:</p>
          <p>{links(result.links)}</p>
        </>
      ) : (
        <>
          {result.jobs.slice(0, shown).map((j) => (
            <article key={j.id} className="job">
              <div className="job-head">
                <div>
                  <h3>{j.title}</h3>
                  <p className="muted">{j.company}{j.location && ` · ${j.location}`}{j.created && ` · posted ${ago(j.created)}`}</p>
                  {j.salary && <p><small>{j.salary}</small></p>}
                </div>
                {j.fit.total > 0 && <span className={`badge ${j.fit.proven === j.fit.total ? "badge-full" : ""}`}>Proof {j.fit.proven}/{j.fit.total}</span>}
              </div>
              <div className="job-actions">
                <a className="cta small" href={j.url} target="_blank" rel="noopener noreferrer">Apply ↗</a>
                <button type="button" className="ghost" aria-expanded={open === j.id} onClick={() => setOpen(open === j.id ? null : j.id)}>{open === j.id ? "Hide fit check" : "Fit check"}</button>
                <small className="job-source">via {j.source}</small>
              </div>
              {open === j.id && (
                <div className="fit-box">
                  {j.snippet && <p><small>From the listing: &ldquo;{j.snippet}&rdquo;</small></p>}
                  <FitRows fit={j.fit} />
                </div>
              )}
            </article>
          ))}
          {result.jobs.length > shown && (
            <button type="button" className="ghost" onClick={() => setShown(shown + (compact ? 10 : 15))}>Show {Math.min(compact ? 10 : 15, result.jobs.length - shown)} more</button>
          )}
          <p><small>Real postings from <a href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer">Adzuna</a> and the career pages of sports employers; each link opens the original. More: {links(result.links.slice(2))}</small></p>
        </>
      )}
    </div>
  );
}

export default function JobSearch({ starters }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [posting, setPosting] = useState("");
  const [pasted, setPasted] = useState(null);
  const [pending, start] = useTransition();
  const [checking, startCheck] = useTransition();

  const search = (q) => {
    setText(q);
    start(async () => setResult(await findJobs(q)));
  };

  // Goldie can run a search for the user ("find me NBA jobs").
  useEffect(() => {
    const onSearch = (e) => search(String((e.detail && e.detail.query) || "").slice(0, 200));
    window.addEventListener("goldie:search", onSearch);
    return () => window.removeEventListener("goldie:search", onSearch);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <form className="job-form" onSubmit={(e) => { e.preventDefault(); search(text); }}>
        <label htmlFor="job-q" className="visually-hidden">What jobs are you looking for?</label>
        <input id="job-q" type="text" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder='Try "sports internships" or "ticket sales jobs in Chicago"' />
        <button type="submit" disabled={pending}>{pending ? "Searching…" : "Search"}</button>
      </form>
      <div className="chips">
        {starters.map((s) => <button type="button" key={s} disabled={pending} onClick={() => search(s)}>{s}</button>)}
      </div>

      {pending && <div className="job-skeleton" aria-label="Searching jobs"><span /><span /><span /></div>}

      {result && !pending && <JobResults result={result} />}

      <details className="paste-fit">
        <summary>Have a job posting already? Check your fit</summary>
        <label htmlFor="posting">Paste the job posting (requirements section is enough)</label>
        <textarea id="posting" rows={5} maxLength={8000} value={posting} onChange={(e) => setPosting(e.target.value)} />
        <button type="button" disabled={checking || !posting.trim()} onClick={() => startCheck(async () => setPasted(await checkFit(posting)))}>{checking ? "Checking…" : "Check my fit"}</button>
        {pasted && pasted.error && <p className="error">{pasted.error}</p>}
        {pasted && pasted.fit && (
          <div className="fit-box">
            <p><strong>You have proof for {pasted.fit.proven} of {pasted.fit.total} skills this job asks for.</strong></p>
            <FitRows fit={pasted.fit} />
          </div>
        )}
      </details>
    </div>
  );
}
