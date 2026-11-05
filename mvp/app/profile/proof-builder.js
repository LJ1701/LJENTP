"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProof } from "./actions";
import { detectSkills } from "@/lib/detect";
import { labelIn } from "@/lib/careers";
import { GoldieBall } from "../goldie";
import { useT } from "../i18n-provider";

// Goldie's proof builder: the user names one thing they did, Goldie asks three short questions, and the
// answers become one achievement line with numbers an employer can check. Plain rules, no AI.
// The questions and the "for" joining word come from locales/<lang>.js (proof.q, proof.forWho).
const FIELDS = ["count", "who", "result"];

const tidy = (s) => String(s || "").trim().replace(/\s+/g, " ").replace(/[.;,。]+$/, "");

export function composeProof({ what, count, who, result }, forWho = " for {who}") {
  const base = tidy(what);
  if (!base) return "";
  const parts = [base.charAt(0).toUpperCase() + base.slice(1)];
  if (tidy(who)) parts.push(forWho.replace("{who}", tidy(who)));
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
  const { t, dict } = useT();
  const questions = dict.proof.q; // [[question, example], ...] for count, who, result
  const [step, setStep] = useState(-1); // -1: what did you do, 0–2: questions, 3: preview
  const [a, setA] = useState({ what: "", count: "", who: "", result: "" });
  const [line, setLine] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const compose = (answers) => composeProof(answers, dict.proof.forWho);

  const next = () => {
    if (step === -1 && !tidy(a.what)) return;
    if (step < 2) return setStep(step + 1);
    setLine(compose(a));
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
    setMsg(hasProfile ? (res.added ? t("proof.added") : t("proof.already")) : t("proof.addedForm"));
    if (!hasProfile || res.added) cheer();
    reset();
    if (res.added) router.refresh();
  });

  const field = step === -1 ? "what" : step < 3 ? FIELDS[step] : null;
  const skills = step === 3 ? Object.keys(detectSkills(line)) : [];

  return (
    <div className="proof-builder">
      <div className="proof-builder-head">
        <GoldieBall size={34} />
        <p>
          <strong>{t("proof.title")}</strong>
          <small>{step === -1 ? t("proof.intro") : step < 3 ? t("proof.question", { n: step + 1 }) : t("proof.preview")}</small>
        </p>
      </div>

      {field && (
        <>
          <label htmlFor="pb-input" className="visually-hidden">{step === -1 ? t("proof.whatLabel") : questions[step][0]}</label>
          {step >= 0 && <p className="pb-q">{questions[step][0]}</p>}
          <input id="pb-input" key={field} type="text" maxLength={120} autoFocus={step >= 0} value={a[field]} onKeyDown={onKey}
            onChange={(e) => setA({ ...a, [field]: e.target.value })}
            placeholder={step === -1 ? t("proof.whatPh") : questions[step][1]} />
          <div className="job-actions">
            <button type="button" onClick={next} disabled={step === -1 && !tidy(a.what)}>{step === -1 ? t("proof.start") : step < 2 ? t("proof.next") : t("proof.make")}</button>
            {step >= 0 && <button type="button" className="ghost" onClick={() => { setA({ ...a, [field]: "" }); if (step < 2) setStep(step + 1); else { setLine(compose({ ...a, [field]: "" })); setStep(3); } }}>{t("proof.skip")}</button>}
            {step >= 0 && <button type="button" className="ghost" onClick={reset}>{t("proof.startOver")}</button>}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <label htmlFor="pb-line" className="visually-hidden">{t("proof.lineLabel")}</label>
          <textarea id="pb-line" rows={3} maxLength={200} value={line} onChange={(e) => setLine(e.target.value)} />
          {!/\d/.test(line) && <p className="pb-tip">{t("proof.tipNumber")}</p>}
          {skills.length > 0 && <p className="pb-tip">{t("proof.shows", { skills: skills.map((tag) => labelIn(dict, tag)).join(", ") })}</p>}
          <div className="job-actions">
            <button type="button" onClick={save} disabled={pending || !tidy(line)}>{pending ? t("proof.saving") : t("proof.add")}</button>
            <button type="button" className="ghost" onClick={reset}>{t("proof.startOver")}</button>
          </div>
        </>
      )}
      {msg && step === -1 && <p className="ok">{msg}</p>}
    </div>
  );
}
