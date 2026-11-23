"use client";
import { useState } from "react";
import { useT } from "../i18n-provider";
import { referenceConfirmLink } from "./actions";
import CopyButton from "./copy-button";

// On the owner's reference card: makes the private confirm link, then helps them send it themselves
// (copy, or open their own email app with a message ready). The Assist never emails anyone.
export default function ConfirmRequest({ id, refName, contact, waiting }) {
  const { t } = useT();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const message = url ? t("trust.message", { ref: refName, url }) : "";
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact || "") ? contact : "";

  if (!url) {
    return (
      <div className="pf-confirm">
        {waiting && <p className="pf-meta"><small>{t("confirm.waiting")}</small></p>}
        <button type="button" className="mini" disabled={busy} onClick={async () => {
          setBusy(true); setError("");
          const r = await referenceConfirmLink(id);
          setBusy(false);
          if (r?.url) setUrl(r.url); else setError(r?.error || t("confirm.linkError"));
        }}>{busy ? t("evidence.saving") : waiting ? t("confirm.showLink") : t("confirm.ask")}</button>
        {error && <p className="error"><small>{error}</small></p>}
      </div>
    );
  }
  return (
    <div className="pf-confirm">
      <p className="pf-meta"><small>{t("trust.sendIt", { ref: refName })}</small></p>
      <p className="proof-url"><small>{url}</small></p>
      <div className="ref-actions">
        <CopyButton text={message} label={t("confirm.copyMessage")} />
        {email && <a className="cta small" href={`mailto:${email}?subject=${encodeURIComponent(t("confirm.subject"))}&body=${encodeURIComponent(message)}`}>{t("confirm.email")}</a>}
      </div>
    </div>
  );
}
