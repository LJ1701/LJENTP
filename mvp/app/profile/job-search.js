"use client";
import { useState, useTransition, useEffect } from "react";
import { findJobs, checkFit, addGapToPlan } from "./actions";
import { PENDING_KEY, agoText } from "../home-search";
import { useT, CountryPicker } from "../i18n-provider";
import { labelIn } from "@/lib/careers";

// Shows which skills a job asks for: proof (quoted from the user's achievements), ticked only, or a gap.
function FitRows({ fit }) {
  const { t, dict } = useT();
  const [added, setAdded] = useState({});
  const [pending, start] = useTransition();
  if (!fit.total) return <p><small>{t("fit.noSkills")}</small></p>;
  return (
    <ul className="fit-list">
      {fit.rows.map((r) => (
        <li key={r.tag} className={`fit-${r.status}`}>
          <span className="fit-icon" aria-hidden="true">{r.status === "proof" ? "✓" : r.status === "claimed" ? "~" : "✕"}</span>
          <span>
            <strong>{labelIn(dict, r.tag)}</strong>{" "}
            {r.status === "proof" && <small>{t("fit.proof")} &ldquo;{r.quote}&rdquo;</small>}
            {r.status === "claimed" && <small>{t("fit.claimed")}</small>}
            {/* Close the gap: a 1-week step that ends in proof, one tap into the plan. */}
            {r.status !== "proof" && dict.gapSteps[r.tag] && (
              <span className="gap-step">
                <small><strong>{r.status === "gap" ? t("fit.closeGap") : t("fit.proveIt")}</strong> {dict.gapSteps[r.tag]}</small>
                {added[r.tag] ? <small className="gap-done">{added[r.tag]}</small> : (
                  <button type="button" className="mini" disabled={pending} onClick={() => start(async () => {
                    const res = await addGapToPlan(r.tag);
                    setAdded((a) => ({ ...a, [r.tag]: res.error || (res.already ? t("fit.already") : t("fit.added")) }));
                  })}>{t("fit.addToPlan")}</button>
                )}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

// A search started on the homepage ("See my fit"), waiting until the Passport is saved.
export function PendingNote() {
  const { t } = useT();
  const [q, setQ] = useState("");
  useEffect(() => { try { setQ(window.localStorage.getItem(PENDING_KEY) || ""); } catch {} }, []);
  if (!q) return null;
  return <p className="pending-note">{t("jobs.pending", { q })}</p>;
}

// A button anywhere on the page that runs a search in the jobs step and scrolls there.
export function SearchFor({ query, children }) {
  return (
    <button type="button" className="ghost" onClick={() => {
      window.dispatchEvent(new CustomEvent("goldie:search", { detail: { query } }));
      document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }}>{children}</button>
  );
}

// The postings for one search, each with a fit check. In Goldie's chat (compact) the first 5 show, then "Show more".
export function JobResults({ result, compact = false }) {
  const { t } = useT();
  const [open, setOpen] = useState(null);
  const [shown, setShown] = useState(compact ? 5 : 15);
  const links = (list) => list.map(([site, url], i) => <span key={site}>{i > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{site}</a></span>);
  return (
    <div className={compact ? "job-results compact" : "job-results"} aria-live="polite">
      <p className="job-summary"><span className="live-dot" aria-hidden="true" /> {result.query.summary}{result.jobs && result.jobs.length ? ` · ${t("jobs.found", { n: result.total })}` : ""}</p>
      {result.error ? (
        <>
          <p className="warn">{t(`jobs.errors.${["off", "keys", "limit"].includes(result.error) ? result.error : "down"}`)}</p>
          <p>{links(result.links)}</p>
        </>
      ) : !result.jobs.length ? (
        <>
          <p>{t("jobs.noneMatched")}</p>
          <p>{links(result.links)}</p>
        </>
      ) : (
        <>
          {result.jobs.slice(0, shown).map((j) => (
            <article key={j.id} className="job">
              <div className="job-head">
                <div>
                  <h3>{j.title}</h3>
                  <p className="muted">{j.company}{j.location && ` · ${j.location}`}{j.created && ` · ${t("jobs.posted", { ago: agoText(t, j.created) })}`}</p>
                  {j.salary && <p><small>{j.salary}</small></p>}
                </div>
                {j.fit.total > 0 && <span className={`badge ${j.fit.proven === j.fit.total ? "badge-full" : ""}`}>{t("jobs.proofBadge")} {j.fit.proven}/{j.fit.total}</span>}
              </div>
              <div className="job-actions">
                <a className="cta small" href={j.url} target="_blank" rel="noopener noreferrer">{t("jobs.apply")}</a>
                <button type="button" className="ghost" aria-expanded={open === j.id} onClick={() => setOpen(open === j.id ? null : j.id)}>{open === j.id ? t("jobs.hideFit") : t("jobs.fitCheck")}</button>
                <small className="job-source">{t("jobs.via", { source: j.source })}</small>
              </div>
              {open === j.id && (
                <div className="fit-box">
                  {j.snippet && <p><small>{t("jobs.fromListing")} &ldquo;{j.snippet}&rdquo;</small></p>}
                  <FitRows fit={j.fit} />
                </div>
              )}
            </article>
          ))}
          {result.jobs.length > shown && (
            <button type="button" className="ghost" onClick={() => setShown(shown + (compact ? 10 : 15))}>{t("jobs.showMore", { n: Math.min(compact ? 10 : 15, result.jobs.length - shown) })}</button>
          )}
          {result.boardsOnly
            ? <p><small>{t("jobs.boardsOnly", { country: result.boardsOnly })} {links(result.links)}</small></p>
            : <p><small>{t("jobs.realFrom")} <a href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer">Adzuna</a> {t("jobs.realRest")} {links(result.links)}</small></p>}
        </>
      )}
    </div>
  );
}

// starters: [[what the chip says, what it searches for], ...]
export default function JobSearch({ starters }) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [posting, setPosting] = useState("");
  const [pasted, setPasted] = useState(null);
  const [pending, start] = useTransition();
  const [checking, startCheck] = useTransition();

  const search = (q, shown = q) => {
    setText(shown);
    start(async () => setResult(await findJobs(q)));
  };

  // A search started on the homepage runs here once, now with fit checks.
  useEffect(() => {
    let q = null;
    try { q = window.localStorage.getItem(PENDING_KEY); window.localStorage.removeItem(PENDING_KEY); } catch {}
    if (q) { search(q); setTimeout(() => document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Goldie can run a search for the user ("find me NBA jobs").
  useEffect(() => {
    const onSearch = (e) => search(String((e.detail && e.detail.query) || "").slice(0, 200));
    window.addEventListener("goldie:search", onSearch);
    return () => window.removeEventListener("goldie:search", onSearch);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <CountryPicker onChange={() => { if (result) search(text || "sports jobs"); }} />
      <form className="job-form" onSubmit={(e) => { e.preventDefault(); search(text); }}>
        <label htmlFor="job-q" className="visually-hidden">{t("jobs.label")}</label>
        <input id="job-q" type="text" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("jobs.placeholder")} />
        <button type="submit" disabled={pending}>{pending ? t("jobs.searching") : t("jobs.search")}</button>
      </form>
      <div className="chips">
        {starters.map(([label, q]) => <button type="button" key={label} disabled={pending} onClick={() => search(q, label)}>{label}</button>)}
      </div>

      {pending && <div className="job-skeleton" aria-label={t("jobs.searching")}><span /><span /><span /></div>}

      {result && !pending && <JobResults result={result} />}

      <details className="paste-fit">
        <summary>{t("jobs.pasteSummary")}</summary>
        <label htmlFor="posting">{t("jobs.pasteLabel")}</label>
        <textarea id="posting" rows={5} maxLength={8000} value={posting} onChange={(e) => setPosting(e.target.value)} />
        <button type="button" disabled={checking || !posting.trim()} onClick={() => startCheck(async () => setPasted(await checkFit(posting)))}>{checking ? t("jobs.checking") : t("jobs.checkFit")}</button>
        {pasted && pasted.error && <p className="error">{pasted.error}</p>}
        {pasted && pasted.fit && (
          <div className="fit-box">
            <p><strong>{t("jobs.proofFor", { proven: pasted.fit.proven, total: pasted.fit.total })}</strong></p>
            <FitRows fit={pasted.fit} />
          </div>
        )}
      </details>
    </div>
  );
}
