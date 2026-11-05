"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProof } from "./actions";
import { detectSkills } from "@/lib/detect";
import { label } from "@/lib/careers";
import { GoldieBall } from "../goldie";

// Goldie's proof builder: the user names one thing they did, Goldie asks three short questions, and the
// answers become one achievement line with numbers an employer can check. Plain rules, no AI.
const QUESTIONS = [
  ["count", "How many, or how often?", "e.g. 14 games over 2 seasons"],
  ["who", "Who was it for, or where?", "e.g. Lincoln High varsity basketball"],
  ["result", "What happened because of you?", "e.g. trained 2 new volunteers"]
];

const tidy = (s) => String(s || "").trim().replace(/\s+/g, " ").replace(/[.;,]+$/, "");

export function composeProof({ what, count, who, result }) {
  const base = tidy(what);
  if (!base) return "";
  const parts = [base.charAt(0).toUpperCase() + base.slice(1)];
  if (tidy(who)) parts.push(` for ${tidy(who).replace(/^(for|at)\s+/i, "")}`);
  if (tidy(count)) parts.push(` (${tidy(count)})`);
  if (tidy(result)) parts.push(`; ${tidy(result).charAt(0).toLowerCase()}${tidy(result).slice(1)}`);
  return parts.join("").slice(0, 200);
}

// Counts the lines in the Passport's achievements box, so Goldie can cheer "proof #N".
export function cheer() {
  const box = document.getElementById("achievements");
  const count = box ? box.value.split("\n").filter((l) => l.trim()).length : 0;
  window.dispatchEvent(new CustomEvent("goldie:cheer", { detail: { count } }));
}

export default function ProofBuilder({ hasProfile }) {
  const router = useRouter();
  const [step, setStep] = useState(-1); // -1: what did you do, 0–2: questions, 3: preview
  const [a, setA] = useState({ what: "", count: "", who: "", result: "" });
  const [line, setLine] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const next = () => {
    if (step === -1 && !tidy(a.what)) return;
    if (step < 2) return setStep(step + 1);
    setLine(composeProof(a));
    setStep(3);
  };
  const reset = () => { setStep(-1); setA({ what: "", count: "", who: "", result: "" }); setLine(""); };
  // Enter moves on instead of submitting the Passport form this sits in.
  const onKey = (e) => { if (e.key === "Enter") { e.preventDefault(); next(); } };

  const save = () => start(async () => {
    const text = tidy(line);
    if (!text) return;
    const box = document.getElementById("achievements");
    if (box && !box.value.toLowerCase().includes(text.toLowerCase())) box.value = box.value.trim() ? `${box.value.trim()}\n${text}` : text;
    const res = hasProfile ? await addProof(text) : { added: false };
    setMsg(hasProfile ? (res.added ? "Added to your proof ✓" : "That line is already in your achievements.") : "Added below. Press Save my Passport to keep it.");
    if (!hasProfile || res.added) cheer();
    reset();
    if (res.added) router.refresh();
  });

  const field = step === -1 ? "what" : step < 3 ? QUESTIONS[step][0] : null;
  const skills = step === 3 ? Object.keys(detectSkills(line)) : [];

  return (
    <div className="proof-builder">
      <div className="proof-builder-head">
        <GoldieBall size={34} />
        <p>
          <strong>Turn something you did into proof</strong>
          <small>{step === -1 ? "Tell me one thing you've done, even if it feels small." : step < 3 ? `Question ${step + 1} of 3 · skip any you can't answer` : "Here's your proof line. Edit it if you like."}</small>
        </p>
      </div>

      {field && (
        <>
          <label htmlFor="pb-input" className="visually-hidden">{step === -1 ? "What did you do?" : QUESTIONS[step][1]}</label>
          {step >= 0 && <p className="pb-q">{QUESTIONS[step][1]}</p>}
          <input id="pb-input" key={field} type="text" maxLength={120} autoFocus={step >= 0} value={a[field]} onKeyDown={onKey}
            onChange={(e) => setA({ ...a, [field]: e.target.value })}
            placeholder={step === -1 ? "e.g. Ran the scoreboard at home games" : QUESTIONS[step][2]} />
          <div className="job-actions">
            <button type="button" onClick={next} disabled={step === -1 && !tidy(a.what)}>{step === -1 ? "Start" : step < 2 ? "Next" : "Make my proof line"}</button>
            {step >= 0 && <button type="button" className="ghost" onClick={() => { setA({ ...a, [field]: "" }); if (step < 2) setStep(step + 1); else { setLine(composeProof({ ...a, [field]: "" })); setStep(3); } }}>Skip</button>}
            {step >= 0 && <button type="button" className="ghost" onClick={reset}>Start over</button>}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <label htmlFor="pb-line" className="visually-hidden">Your proof line</label>
          <textarea id="pb-line" rows={3} maxLength={200} value={line} onChange={(e) => setLine(e.target.value)} />
          {!/\d/.test(line) && <p className="pb-tip">Tip: add a number if you can. Employers check numbers.</p>}
          {skills.length > 0 && <p className="pb-tip">This shows: {skills.map(label).join(", ")}</p>}
          <div className="job-actions">
            <button type="button" onClick={save} disabled={pending || !tidy(line)}>{pending ? "Saving…" : "Add to my proof"}</button>
            <button type="button" className="ghost" onClick={reset}>Start over</button>
          </div>
        </>
      )}
      {msg && step === -1 && <p className="ok">{msg}</p>}
    </div>
  );
}
