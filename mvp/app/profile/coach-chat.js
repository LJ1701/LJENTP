"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { askCoach, setTarget } from "./actions";
import { JobResults } from "./job-search";
import { useT } from "../i18n-provider";

// Career Coach chat. The server action reads the user's saved profile, so this component only keeps the
// conversation (in memory: refreshing the page starts a new chat) and shows what comes back.
// paths: [{ name, links: [[site, url], ...] }] for the 8 career paths; targetIdx: current target role or null.
// Inside Goldie (compact): onAction runs page actions from a reply, onBusy animates Goldie while she thinks,
// and modeRequest ({ mode, at }) switches mode when a button elsewhere asks for interview practice.
export default function CoachChat({ paths, targetIdx, starters, compact = false, onAction, onBusy, modeRequest }) {
  const { t, dict } = useT();
  const DID = dict.coach.did;
  const [mode, setMode] = useState("ask");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [pending, start] = useTransition();
  const endRef = useRef(null);
  const lastRef = useRef(null);
  const asked = messages.filter((m) => m.role === "user").length;

  // A new answer is shown from its first line (job postings sit near the top); otherwise keep the end in view.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === "coach") {
      // Twice: once now, once after the postings and chips have laid out.
      lastRef.current?.scrollIntoView({ block: "start" });
      const t = setTimeout(() => lastRef.current?.scrollIntoView({ block: "start" }), 150);
      return () => clearTimeout(t);
    }
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, pending]);
  useEffect(() => { onBusy?.(pending); }, [pending, onBusy]);
  useEffect(() => { if (modeRequest) switchMode(modeRequest.mode); }, [modeRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  function send(question, history = messages, chatMode = mode) {
    const q = String(question || "").trim().slice(0, 500);
    if (!q || pending) return;
    const next = [...history, { role: "user", text: q }];
    setMessages(next);
    setText("");
    setError("");
    start(async () => {
      const res = await askCoach(next.map(({ role, text }) => ({ role, text })), chatMode);
      setOffline(!!res.offline);
      setUpgrade(!!res.upgrade);
      if (res.error) setError(res.offline ? t("coach.busy") : res.error);
      else {
        setMessages((m) => [...m, { role: "coach", text: res.reply, ...res }]);
        if (res.action && res.action !== "none") onAction?.(res.action, res.actionQuery);
      }
    });
  }

  function switchMode(m) {
    if (m === mode || pending) return;
    setMode(m);
    setMessages([]);
    setError("");
    if (m === "interview") send(t("coach.ready"), [], "interview");
  }

  return (
    <section aria-label={t("goldie.dialog")} className={compact ? "coach coach-compact" : "coach"}>
      {!compact && <h3>{t("coach.title")}</h3>}

      <div role="group" aria-label="Coach mode" className="coach-modes">
        <button type="button" aria-pressed={mode === "ask"} onClick={() => switchMode("ask")}>{t("coach.ask")}</button>
        <button type="button" aria-pressed={mode === "interview"} onClick={() => switchMode("interview")} disabled={targetIdx === null} title={targetIdx === null ? t("coach.pickTargetFirst") : ""}>
          {t("coach.interview")}{targetIdx !== null ? `: ${paths[targetIdx].name}` : ""}
        </button>
      </div>

      <div className="coach-log" aria-live="polite">
        {!messages.length && mode === "ask" && (
          <div className="chips">
            {starters.map((s) => <button type="button" key={s} onClick={() => send(s)}>{s}</button>)}
          </div>
        )}
        {messages.map((m, i) => (m.role === "user" ? (
          <p key={i} className="msg msg-user">{m.text}</p>
        ) : (
          <div key={i} className="msg msg-coach" ref={i === messages.length - 1 ? lastRef : null}>
            <p>{m.reply}</p>
            {m.instant && <p className="did"><small>{t("coach.instant")}</small></p>}
            {m.action && m.action !== "none" && m.action !== "search_jobs" && DID[m.action] && <p className="did"><small>↳ {DID[m.action]}</small></p>}
            {m.jobs && <JobResults result={m.jobs} compact />}
            {m.evidence?.length > 0 && (
              <div className="proof">
                <strong>{t("coach.proofFrom")}</strong>
                <ul>{m.evidence.map((e) => <li key={e}>&ldquo;{e}&rdquo;</li>)}</ul>
              </div>
            )}
            {m.nextStep && <p><strong>{t("coach.thisWeek")}</strong> {m.nextStep}</p>}
            {m.suggestRole >= 0 && (
              <div className="coach-action">
                <strong>{paths[m.suggestRole].name}</strong>{" "}
                {targetIdx === m.suggestRole ? (
                  <small>{t("coach.alreadyTarget")}</small>
                ) : (
                  <form action={setTarget} style={{ display: "inline" }}>
                    <input type="hidden" name="role_idx" value={m.suggestRole} />
                    <button type="submit">{t("coach.makeTargetRole")}</button>
                  </form>
                )}
                <p><small>{t("coach.findOpenings")}{" "}
                  {paths[m.suggestRole].links.map(([site, url], j) => (
                    <span key={site}>{j > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{site}</a></span>
                  ))}
                </small></p>
              </div>
            )}
            {m.unverified?.length > 0 && <p className="warn"><small>{t("coach.unverified", { nums: m.unverified.join(", ") })}</small></p>}
            {m.droppedEvidence > 0 && <p><small>{t("coach.dropped", { n: m.droppedEvidence })}</small></p>}
            {i === messages.length - 1 && m.followUps?.length > 0 && (
              <div className="chips">
                {m.followUps.map((f) => <button type="button" key={f} onClick={() => send(f)} disabled={pending}>{f}</button>)}
              </div>
            )}
          </div>
        )))}
        {pending && <p className="msg msg-coach"><em>{t("coach.thinking")}</em></p>}
        {error && <p className={offline || upgrade ? "warn" : "error"}>{error}</p>}
        {error && upgrade && <p><a className="cta small" href="/pricing">{t("billing.seePlans")}</a> <small>{t("billing.stayFree")}</small></p>}
        {error && offline && (
          <div className="chips">
            <button type="button" onClick={() => send(t("coach.msgInterns"))} disabled={pending}>{t("coach.findInterns")}</button>
            <button type="button" onClick={() => send(t("coach.msgJobs"))} disabled={pending}>{t("coach.findJobs")}</button>
            {onAction && <button type="button" onClick={() => onAction("start_tour")}>{t("coach.takeTour")}</button>}
            {onAction && <button type="button" onClick={() => onAction("go_plan")}>{t("coach.goPlan")}</button>}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <label htmlFor="coach-input">{mode === "interview" ? t("coach.yourAnswer") : t("coach.yourQuestion")}</label>
        <textarea id="coach-input" rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
          placeholder={mode === "interview" ? t("coach.answerPh") : t("coach.questionPh")} />
        <button type="submit" disabled={pending || !text.trim() || asked >= 10}>{pending ? t("coach.sending") : t("coach.send")}</button>{" "}
        <small>{t("coach.count", { n: asked })}</small>
      </form>
      <p><small>{t("coach.aiWrong")}</small></p>
    </section>
  );
}
