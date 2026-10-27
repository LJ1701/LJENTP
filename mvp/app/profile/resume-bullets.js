"use client";
import { useState, useTransition } from "react";
import { writeBullets } from "./actions";

// Button + result for the AI résumé bullets. The work happens in the server action; this only shows it.
export default function ResumeBullets() {
  const [result, setResult] = useState(null);
  const [pending, start] = useTransition();

  return (
    <section aria-label="AI résumé bullets">
      <h3>Honest résumé bullets</h3>
      <p>Turns your saved achievements into 3 résumé bullets. It only uses what you wrote; any bullet with a number you didn&apos;t write is thrown away.</p>
      <button type="button" disabled={pending} onClick={() => start(async () => setResult(await writeBullets()))}>
        {pending ? "Writing…" : "Write my résumé bullets"}
      </button>
      {result && result.error && <p className="error">{result.error}</p>}
      {result && result.bullets && (
        <>
          <ul>{result.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
          {result.dropped > 0 && <p><small>{result.dropped} bullet(s) removed because they added numbers you didn&apos;t write.</small></p>}
          <p><small>Check every word before using it. Written by Google Gemini from your own achievements.</small></p>
        </>
      )}
    </section>
  );
}
