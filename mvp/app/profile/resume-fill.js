"use client";
import { useRef, useState, useTransition } from "react";
import { detectSkills, detectInterests } from "@/lib/detect";
import { readResumeFile } from "./actions";
import { useT } from "../i18n-provider";

// Paste a résumé or LinkedIn "About", or upload the file: the same keyword tables used for matching tick the
// skills and interests it mentions, and its achievement-style lines are added to the achievements box.
// Word and text files are read without AI; PDFs are read by Gemini on the server. Nothing is saved until the
// user checks the form and presses "Save my Passport".
// Lines that start like an achievement ("Led…", "Organicé…", "Organisé…"), in the app's Latin-script languages.
const VERB_START = /^(led|ran|managed|created|built|coached|organized|organised|wrote|edited|filmed|produced|designed|launched|grew|increased|planned|played|captained|volunteered|helped|trained|analy[sz]ed|developed|hosted|sold|coordinated|started|founded|won|mentored|taught|interned|worked|assisted|directed|published|recorded|shot|promoted|supported|organicé|organizé|dirigí|creé|entrené|gestioné|lideré|jugué|ayudé|organizei|criei|treinei|liderei|joguei|ajudei|organisé|dirigé|créé|entraîné|géré|organisiert|geleitet|trainiert|organizzato|gestito|allenato|georganiseerd|zorganizowałem|zorganizowałam)(?=\s|$|[.,;:])/iu;

export default function ResumeFill() {
  const { t } = useT();
  const ref = useRef(null);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [reading, start] = useTransition();

  // Fills the Passport form this sits in from résumé text; returns a short summary of what changed.
  function fill(source) {
    const form = ref.current.closest("form");
    const lines = source.split(/\n|•|•|▪|●/).map((l) => l.replace(/^[\s\-*–—◦>]+/, "").trim()).filter((l) => l.length >= 12 && l.length <= 200);
    const joined = lines.join("\n");
    const skills = detectSkills(joined);
    const interests = detectInterests(joined);

    let ticked = 0;
    for (const [name, found] of [["skills", skills], ["interests", interests]]) {
      form.querySelectorAll(`input[name="${name}"]`).forEach((box) => {
        if (found[box.value] && !box.checked) { box.checked = true; ticked++; }
      });
    }

    const box = form.querySelector("#achievements");
    const have = new Set(box.value.split("\n").map((l) => l.trim().toLowerCase()).filter(Boolean));
    const evidence = new Set([...Object.values(skills), ...Object.values(interests)]);
    const add = lines.filter((l) => (evidence.has(l) || VERB_START.test(l)) && !have.has(l.toLowerCase())).slice(0, 12);
    let next = box.value.trim();
    for (const l of add) { if ((next + "\n" + l).length > 4000) break; next = next ? `${next}\n${l}` : l; }
    box.value = next;

    return ticked || add.length ? t("resume.result", { ticked, added: add.length }) : t("resume.nothing");
  }

  function upload(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // lets the same file be picked again
    if (!file) return;
    setMsg("");
    setError("");
    const data = new FormData();
    data.append("file", file);
    start(async () => {
      const res = await readResumeFile(data);
      if (res.error) return setError(res);
      setText(res.text);
      setMsg(`${t(res.via === "ai" ? "resume.readAi" : "resume.read", { file: file.name })} ${fill(res.text)}`);
    });
  }

  return (
    <details className="resume-fill" ref={ref}>
      <summary>{t("resume.summary")}</summary>
      <div className="resume-upload">
        <label htmlFor="resume-file" className={reading ? "upload-btn busy" : "upload-btn"}>{reading ? t("resume.reading") : t("resume.upload")}</label>
        <input id="resume-file" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={upload} disabled={reading} className="visually-hidden" />
        <small className="muted">{t("resume.uploadNote")}</small>
      </div>
      <p className="divider"><span>{t("resume.or")}</span></p>
      <label htmlFor="resume-text" className="visually-hidden">{t("resume.label")}</label>
      <textarea id="resume-text" rows={6} maxLength={12000} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("resume.placeholder")} />
      <button type="button" disabled={!text.trim() || reading} onClick={() => setMsg(fill(text))}>{t("resume.fill")}</button>
      {error && <p className="error">{error.error}{error.upgrade && <> <a href="/pricing">{t("billing.seePlans")}</a></>}</p>}
      {msg && <p className="ok">{msg}</p>}
    </details>
  );
}
