"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { askCoach, setTarget } from "./actions";

// Career Coach chat. The server action reads the user's saved profile, so this component only keeps the
// conversation (in memory: refreshing the page starts a new chat) and shows what comes back.
// paths: [{ name, links: [[site, url], ...] }] for the 8 career paths; targetIdx: current target role or null.
export default function CoachChat({ paths, targetIdx, starters }) {
  const [mode, setMode] = useState("ask");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef(null);
  const asked = messages.filter((m) => m.role === "user").length;

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages, pending]);

  function send(question, history = messages, chatMode = mode) {
    const q = String(question || "").trim().slice(0, 500);
    if (!q || pending) return;
    const next = [...history, { role: "user", text: q }];
    setMessages(next);
    setText("");
    setError("");
    start(async () => {
      const res = await askCoach(next.map(({ role, text }) => ({ role, text })), chatMode);
      if (res.error) setError(res.error);
      else setMessages((m) => [...m, { role: "coach", text: res.reply, ...res }]);
    });
  }

  function switchMode(m) {
    if (m === mode || pending) return;
    setMode(m);
    setMessages([]);
    setError("");
    if (m === "interview") send("I'm ready. Ask me the first interview question.", [], "interview");
  }

  return (
    <section aria-label="Career Coach" className="coach">
      <h3>Ask your Career Coach</h3>
      <p><small>It reads your saved profile, matches and plan. Every quote it uses is checked against your own achievements.</small></p>

      <div role="group" aria-label="Coach mode" className="coach-modes">
        <button type="button" aria-pressed={mode === "ask"} onClick={() => switchMode("ask")}>Ask questions</button>
        <button type="button" aria-pressed={mode === "interview"} onClick={() => switchMode("interview")} disabled={targetIdx === null} title={targetIdx === null ? "Pick a target role first" : ""}>
          Interview practice{targetIdx !== null ? `: ${paths[targetIdx].name}` : ""}
        </button>
      </div>
      {targetIdx === null && <p><small>Interview practice unlocks once you pick a target role under your matches.</small></p>}

      <div className="coach-log" aria-live="polite">
        {!messages.length && mode === "ask" && (
          <div className="chips">
            {starters.map((s) => <button type="button" key={s} onClick={() => send(s)}>{s}</button>)}
          </div>
        )}
        {messages.map((m, i) => (m.role === "user" ? (
          <p key={i} className="msg msg-user">{m.text}</p>
        ) : (
          <div key={i} className="msg msg-coach">
            <p>{m.reply}</p>
            {m.evidence?.length > 0 && (
              <div className="proof">
                <strong>Proof from your profile</strong>
                <ul>{m.evidence.map((e) => <li key={e}>&ldquo;{e}&rdquo;</li>)}</ul>
              </div>
            )}
            {m.nextStep && <p><strong>This week:</strong> {m.nextStep}</p>}
            {m.suggestRole >= 0 && (
              <div className="coach-action">
                <strong>{paths[m.suggestRole].name}</strong>{" "}
                {targetIdx === m.suggestRole ? (
                  <small>(already your target role)</small>
                ) : (
                  <form action={setTarget} style={{ display: "inline" }}>
                    <input type="hidden" name="role_idx" value={m.suggestRole} />
                    <button type="submit">Make this my target role</button>
                  </form>
                )}
                <p><small>Find openings:{" "}
                  {paths[m.suggestRole].links.map(([site, url], j) => (
                    <span key={site}>{j > 0 && " · "}<a href={url} target="_blank" rel="noopener noreferrer">{site}</a></span>
                  ))}
                </small></p>
              </div>
            )}
            {m.unverified?.length > 0 && <p className="warn"><small>Check this: {m.unverified.join(", ")} {m.unverified.length === 1 ? "isn't" : "aren't"} in your profile, so the coach can&apos;t back {m.unverified.length === 1 ? "it" : "them"} up.</small></p>}
            {m.droppedEvidence > 0 && <p><small>{m.droppedEvidence} quote(s) removed because they weren&apos;t in your achievements.</small></p>}
            {i === messages.length - 1 && m.followUps?.length > 0 && (
              <div className="chips">
                {m.followUps.map((f) => <button type="button" key={f} onClick={() => send(f)} disabled={pending}>{f}</button>)}
              </div>
            )}
          </div>
        )))}
        {pending && <p className="msg msg-coach"><em>Coach is thinking…</em></p>}
        {error && <p className="error">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <label htmlFor="coach-input">{mode === "interview" ? "Your answer" : "Your question"}</label>
        <textarea id="coach-input" rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
          placeholder={mode === "interview" ? "Answer like you would in the interview…" : "e.g. Which match fits me best, and why?"} />
        <button type="submit" disabled={pending || !text.trim() || asked >= 10}>{pending ? "Sending…" : "Send"}</button>{" "}
        <small>{asked}/10 messages this visit</small>
      </form>
      <p><small>Written by Google Gemini from your saved profile. It can still be wrong: check advice before acting on it.</small></p>
    </section>
  );
}
