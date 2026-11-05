"use client";
import { useState, useTransition } from "react";
import { writeBullets } from "./actions";
import { useT } from "../i18n-provider";

// Button + result for the AI résumé bullets. The work happens in the server action; this only shows it.
export default function ResumeBullets() {
  const { t } = useT();
  const [result, setResult] = useState(null);
  const [pending, start] = useTransition();

  return (
    <section aria-label={t("bullets.title")}>
      <h3>{t("bullets.title")}</h3>
      <button type="button" disabled={pending} onClick={() => start(async () => setResult(await writeBullets()))}>
        {pending ? t("bullets.writing") : t("bullets.write")}
      </button>
      {result && result.error && <p className={result.upgrade ? "warn" : "error"}>{result.error}</p>}
      {result && result.upgrade && <p><a className="cta small" href="/pricing">{t("billing.seePlans")}</a></p>}
      {result && result.bullets && (
        <>
          <ul>{result.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
          {result.dropped > 0 && <p><small>{t("bullets.dropped", { n: result.dropped })}</small></p>}
          <p><small>{t("bullets.note")}</small></p>
        </>
      )}
    </section>
  );
}
