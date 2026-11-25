"use client";
import { useRef, useState, useTransition } from "react";
import { detectSkills, detectInterests } from "@/lib/detect";
import { readResumeFile } from "./actions";
import { useT } from "../i18n-provider";

// Paste a résumé or LinkedIn "About", or upload the file: the same keyword tables used for matching tick the
// skills and interests it mentions, and its achievement-style lines are added to the achievements box.
// Word and text files are read without AI; PDFs and photos are read by Gemini on the server. Nothing is saved
// (not even the file) until the user checks the form and presses "Save my Passport".
// Lines that start like an achievement ("Led…", "Organicé…", "Organisé…"), in the app's Latin-script languages.
const VERB_START = /^(led|ran|managed|created|built|coached|organized|organised|wrote|edited|filmed|produced|designed|launched|grew|increased|planned|played|captained|volunteered|helped|trained|analy[sz]ed|developed|hosted|sold|coordinated|started|founded|won|mentored|taught|interned|worked|assisted|directed|published|recorded|shot|promoted|supported|organicé|organizé|dirigí|creé|entrené|gestioné|lideré|jugué|ayudé|organizei|criei|treinei|liderei|joguei|ajudei|organisé|dirigé|créé|entraîné|géré|organisiert|geleitet|trainiert|organizzato|gestito|allenato|georganiseerd|zorganizowałem|zorganizowałam)(?=\s|$|[.,;:])/iu;

const MAX_BYTES = 4 * 1024 * 1024; // same limit as the server (lib/resume-file.js)
const FILE_TYPES = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

// Phone photos are often 3–8 MB. Before sending, a photo is redrawn at most 2000 px wide or tall as a JPEG
// (plenty to read a page, usually under 1 MB). If the browser can't open it (e.g. HEIC on some browsers),
// the original is sent and the server checks the size.
async function shrinkPhoto(file) {
  if (!/^image\//.test(file.type) || typeof createImageBitmap !== "function") return file;
  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((done) => canvas.toBlob(done, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

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
    start(async () => {
      const ready = await shrinkPhoto(file);
      // Too big: say so here instead of sending it (the server would refuse it anyway).
      if (ready.size > MAX_BYTES) return setError({ error: t("upload.big") });
      const data = new FormData();
      data.append("file", ready);
      const res = await readResumeFile(data);
      if (res.error) return setError(res);
      setText(res.text);
      setMsg(`${t(res.via === "ai" ? "resume.readAi" : "resume.read", { file: file.name })} ${fill(res.text)}${res.unclear ? ` ${t("resume.unclear")}` : ""}`);
    });
  }

  return (
    <details className="resume-fill" ref={ref}>
      <summary>{t("resume.summary")}</summary>
      <div className="resume-upload">
        <label htmlFor="resume-file" className={reading ? "upload-btn busy" : "upload-btn"}>{reading ? t("resume.reading") : t("resume.upload")}</label>
        <input id="resume-file" type="file" accept={FILE_TYPES} onChange={upload} disabled={reading} className="visually-hidden" />
        {/* capture="environment" opens the back camera on phones; on a computer it opens the file picker. */}
        <label htmlFor="resume-photo" className={reading ? "upload-btn busy" : "upload-btn"}>{t("resume.photo")}</label>
        <input id="resume-photo" type="file" accept="image/*" capture="environment" onChange={upload} disabled={reading} className="visually-hidden" />
      </div>
      <p className="divider"><span>{t("resume.or")}</span></p>
      <label htmlFor="resume-text" className="visually-hidden">{t("resume.label")}</label>
      <textarea id="resume-text" rows={6} maxLength={12000} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("resume.placeholder")} />
      <button type="button" disabled={!text.trim() || reading} onClick={() => setMsg(fill(text))}>{t("resume.fill")}</button>
      {error && <p className="error">{error.error}</p>}
      {msg && <p className="ok">{msg}</p>}
    </details>
  );
}
