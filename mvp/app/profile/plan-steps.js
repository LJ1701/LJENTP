"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeStep, undoStep } from "./actions";
import { cheer } from "./proof-builder";
import { useT } from "../i18n-provider";

// The plan checklist. Ticking a step asks what the user did; that line is saved as a new achievement, so
// finishing the plan builds proof and the matches, fit checks and proof link update straight away.
export default function PlanSteps({ steps }) {
  const router = useRouter();
  const { t } = useT();
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
    setMsg(res.error || (res.added ? t("plan.addedProof") : t("plan.stepDone")));
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
                aria-label={s.done ? t("plan.untick") : t("plan.tick")}
                onClick={() => (s.done ? undo(i) : setAsking(asking === i ? null : i))}>{s.done ? "✓" : ""}</button>
              <span className={s.done ? "done-text" : ""}>{s.text}</span>
            </div>
            {asking === i && (
              <form className="proof-ask" onSubmit={(e) => { e.preventDefault(); finish(i, note); }}>
                <label htmlFor={`note-${i}`}>{t("plan.whatDid")}</label>
                <input id={`note-${i}`} type="text" maxLength={200} autoFocus value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder={t("plan.whatDidPh")} />
                <div className="job-actions">
                  <button type="submit" disabled={pending || !note.trim()}>{pending ? t("plan.saving") : t("plan.addProof")}</button>
                  <button type="button" className="ghost" disabled={pending} onClick={() => finish(i, "")}>{t("plan.justTick")}</button>
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
