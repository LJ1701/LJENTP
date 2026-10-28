"use client";
import { useState } from "react";
import { detectSkills, detectInterests } from "@/lib/detect";

// Paste a résumé or LinkedIn "About": the same keyword tables used for matching tick the skills and interests
// it mentions, and its achievement-style lines are added to the achievements box. No AI, and nothing is saved
// until the user checks the form and presses "Save my Passport".
const VERB_START = /^(led|ran|managed|created|built|coached|organized|organised|wrote|edited|filmed|produced|designed|launched|grew|increased|planned|played|captained|volunteered|helped|trained|analy[sz]ed|developed|hosted|sold|coordinated|started|founded|won|mentored|taught|interned|worked|assisted|directed|published|recorded|shot|promoted|supported)\b/i;

export default function ResumeFill() {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  function fill(e) {
    const form = e.currentTarget.closest("form");
    const lines = text.split(/\n|•|•|▪|●/).map((l) => l.replace(/^[\s\-*–—◦>]+/, "").trim()).filter((l) => l.length >= 12 && l.length <= 200);
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

    setMsg(ticked || add.length
      ? `Ticked ${ticked} skills and interests and added ${add.length} achievements. Check them below, then save.`
      : "Nothing we recognise yet. Try pasting your experience section, one role or bullet per line.");
  }

  return (
    <details className="resume-fill">
      <summary>⚡ Paste your résumé to fill this in</summary>
      <label htmlFor="resume-text" className="visually-hidden">Your résumé or LinkedIn About</label>
      <textarea id="resume-text" rows={6} maxLength={12000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your résumé or LinkedIn About section here" />
      <button type="button" disabled={!text.trim()} onClick={fill}>Fill my Passport</button>
      {msg && <p className="ok">{msg}</p>}
    </details>
  );
}
