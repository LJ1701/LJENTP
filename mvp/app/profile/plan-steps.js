"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeStep, undoStep } from "./actions";
import { cheer } from "./proof-builder";

// The plan checklist. Ticking a step asks what the user did; that line is saved as a new achievement, so
// finishing the plan builds proof and the matches, fit checks and proof link update straight away.
export default function PlanSteps({ steps }) {
  const router = useRouter();
  const [asking, setAsking] = useState(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const finish = (i, text) => start(async () => {
    const res = await completeStep(i, text);
    // Keep the Passport form in step with the new proof line, so saving the form later can't drop it.
    const box = document.getElementById("achievements");
    if (res.added && box && !box.value.includes(text.trim())) box.value = box.value.trim() ? `${box.value.trim()}\n${text.trim()}` : text.trim();
    setAsking(null);
    setNote("");
    setMsg(res.error || (res.added ? "Added to your proof ✓ Your matches and fit checks just got stronger." : "Step done ✓"));
    if (res.added) cheer();
    router.refresh();
  });

  const undo = (i) => start(async () => { await undoStep(i); setMsg(""); router.refresh(); });

  return (
    <>
      <ul className="plan-list">
        {steps.map((s, i) => (
          <li key={i} className={asking === i ? "asking" : ""}>
            <div className="plan-row">
              <button type="button" className={s.done ? "check done" : "check"} disabled={pending}
                aria-label={s.done ? "Mark not done" : "Mark done"}
                onClick={() => (s.done ? undo(i) : setAsking(asking === i ? null : i))}>{s.done ? "✓" : ""}</button>
              <span className={s.done ? "done-text" : ""}>{s.text}</span>
            </div>
            {asking === i && (
              <form className="proof-ask" onSubmit={(e) => { e.preventDefault(); finish(i, note); }}>
                <label htmlFor={`note-${i}`}>What did you do? It becomes proof on your Passport.</label>
                <input id={`note-${i}`} type="text" maxLength={200} autoFocus value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Edited a highlight reel for my club's U16 team" />
                <div className="job-actions">
                  <button type="submit" disabled={pending || !note.trim()}>{pending ? "Saving…" : "Add to my proof"}</button>
                  <button type="button" className="ghost" disabled={pending} onClick={() => finish(i, "")}>Just tick it</button>
                </div>
              </form>
            )}
          </li>
        ))}
      </ul>
      {msg && <p className="ok">{msg}</p>}
    </>
  );
}
