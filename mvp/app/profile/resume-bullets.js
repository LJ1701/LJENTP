"use client";
import { useState, useTransition } from "react";
import { writeBullets } from "./actions";

// Button + result for the AI résumé bullets. The work happens in the server action; this only shows it.
export default function ResumeBullets() {
  const [result, setResult] = useState(null);
  const [pending, start] = useTransition();

  return (
    <section aria-label="AI résumé bullets">
      <h3>Résumé bullets</h3>
      <button type="button" disabled={pending} onClick={() => start(async () => setResult(await writeBullets()))}>
        {pending ? "Writing…" : "Write my résumé bullets"}
      </button>
      {result && result.error && <p className={result.upgrade ? "warn" : "error"}>{result.error}</p>}
      {result && result.upgrade && <p><a className="cta small" href="/pricing">See plans</a></p>}
      {result && result.bullets && (
        <>
          <ul>{result.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
          {result.dropped > 0 && <p><small>{result.dropped} bullet(s) removed because they added numbers you didn&apos;t write.</small></p>}
          <p><small>Written by AI from your own achievements only. Check every word before using it.</small></p>
        </>
      )}
    </section>
  );
}
