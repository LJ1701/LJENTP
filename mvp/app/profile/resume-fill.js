"use client";
import { useRef, useState, useTransition } from "react";
import { detectSkills, detectInterests } from "@/lib/detect";
import { readResumeFile } from "./actions";

// Paste a résumé or LinkedIn "About", or upload the file: the same keyword tables used for matching tick the
// skills and interests it mentions, and its achievement-style lines are added to the achievements box.
// Word and text files are read without AI; PDFs are read by Gemini on the server. Nothing is saved until the
// user checks the form and presses "Save my Passport".
const VERB_START = /^(led|ran|managed|created|built|coached|organized|organised|wrote|edited|filmed|produced|designed|launched|grew|increased|planned|played|captained|volunteered|helped|trained|analy[sz]ed|developed|hosted|sold|coordinated|started|founded|won|mentored|taught|interned|worked|assisted|directed|published|recorded|shot|promoted|supported)\b/i;

export default function ResumeFill() {
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

    return ticked || add.length
      ? `Ticked ${ticked} skills and interests and added ${add.length} achievements. Check them below, then save.`
      : "Nothing we recognise yet. Try pasting your experience section, one role or bullet per line.";
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
      if (res.error) return setError(res.error);
      setText(res.text);
      setMsg(`Read ${file.name}${res.via === "ai" ? " (PDF read by AI)" : ""}. ${fill(res.text)}`);
    });
  }

  return (
    <details className="resume-fill" ref={ref}>
      <summary>⚡ Paste or upload your résumé to fill this in</summary>
      <div className="resume-upload">
        <label htmlFor="resume-file" className={reading ? "upload-btn busy" : "upload-btn"}>{reading ? "Reading your résumé…" : "📄 Upload résumé (PDF, Word or .txt)"}</label>
        <input id="resume-file" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={upload} disabled={reading} className="visually-hidden" />
        <small className="muted">Up to 4 MB. PDFs are read by Google&apos;s Gemini AI; Word and text files are read without AI. Nothing is saved until you press Save.</small>
      </div>
      <p className="divider"><span>or paste it</span></p>
      <label htmlFor="resume-text" className="visually-hidden">Your résumé or LinkedIn About</label>
      <textarea id="resume-text" rows={6} maxLength={12000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your résumé or LinkedIn About section here" />
      <button type="button" disabled={!text.trim() || reading} onClick={() => setMsg(fill(text))}>Fill my Passport</button>
      {error && <p className="error">{error.replace(" or see plans at /pricing", "")}{error.includes("/pricing") && <> <a href="/pricing">See plans</a></>}</p>}
      {msg && <p className="ok">{msg}</p>}
    </details>
  );
}
