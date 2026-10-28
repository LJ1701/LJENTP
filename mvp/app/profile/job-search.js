"use client";
import { useState, useTransition } from "react";
import { findJobs, checkFit, addGapToPlan } from "./actions";

const ERRORS = {
  off: "Live job listings aren't switched on yet. These searches open real listings for the same request:",
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
  if (!fit.total) return <p><small>This listing&apos;s summary doesn&apos;t name skills we can check. Open it to read the full requirements.</small></p>;
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

export default function JobSearch({ starters }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(null);
  const [posting, setPosting] = useState("");
  const [pasted, setPasted] = useState(null);
  const [pending, start] = useTransition();
  const [checking, startCheck] = useTransition();

  const search = (q) => {
    setText(q);
    setOpen(null);
    start(async () => setResult(await findJobs(q)));
  };

  return (
    <div>
      <form className="job-form" onSubmit={(e) => { e.preventDefault(); search(text); }}>
        <label htmlFor="job-q" className="visually-hidden">What jobs are you looking for?</label>
        <input id="job-q" type="text" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder='Try "sports jobs" or "ticket sales jobs in Chicago"' />
        <button type="submit" disabled={pending}>{pending ? "Searching…" : "Search"}</button>
      </form>
      <div className="chips">
        {starters.map((s) => <button type="button" key={s} disabled={pending} onClick={() => search(s)}>{s}</button>)}
      </div>

      {pending && <div className="job-skeleton" aria-label="Searching live jobs"><span /><span /><span /></div>}

      {result && !pending && (
        <div className="job-results" aria-live="polite">
          <p className="job-summary"><span className="live-dot" aria-hidden="true" /> {result.query.summary}</p>
          {result.error ? (
            <>
              <p className="warn">{ERRORS[result.error] || ERRORS.down}</p>
              <p>{result.links.map(([site, url], i) => <span key={site}>{i > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{site}</a></span>)}</p>
            </>
          ) : !result.jobs.length ? (
            <>
              <p>No sports listings matched that in the last 45 days. Try fewer words or a bigger city, or search these sites:</p>
              <p>{result.links.map(([site, url], i) => <span key={site}>{i > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{site}</a></span>)}</p>
            </>
          ) : (
            <>
              {result.jobs.map((j) => (
                <article key={j.id} className="job">
                  <div className="job-head">
                    <div>
                      <h3>{j.title}</h3>
                      <p className="muted">{j.company}{j.location && ` · ${j.location}`} · posted {ago(j.created)}</p>
                      {j.salary && <p><small>{j.salary}</small></p>}
                    </div>
                    {j.fit.total > 0 && <span className={`badge ${j.fit.proven === j.fit.total ? "badge-full" : ""}`}>Proof {j.fit.proven}/{j.fit.total}</span>}
                  </div>
                  <div className="job-actions">
                    <a className="cta small" href={j.url} target="_blank" rel="noopener noreferrer">Apply on the listing ↗</a>
                    <button type="button" className="ghost" aria-expanded={open === j.id} onClick={() => setOpen(open === j.id ? null : j.id)}>{open === j.id ? "Hide fit check" : "Fit check"}</button>
                  </div>
                  {open === j.id && (
                    <div className="fit-box">
                      <p><small>From the listing: &ldquo;{j.snippet}&rdquo;</small></p>
                      <FitRows fit={j.fit} />
                    </div>
                  )}
                </article>
              ))}
              <p><small>{result.total > result.jobs.length ? `Showing ${result.jobs.length} sports listings of ${result.total.toLocaleString("en-US")} matches. ` : ""}Listings are real and link to the original posting. <a href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer">Jobs by Adzuna</a>. More: {result.links.slice(2).map(([site, url], i) => <span key={site}>{i > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{site}</a></span>)}</small></p>
            </>
          )}
        </div>
      )}

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
