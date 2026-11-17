"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { addProofItem } from "./actions";
import { useT } from "../i18n-provider";

// Adds one piece of proof to one achievement: a link, a reference, a number or where it happened.
// Nobody has to approve it; the public page shows it as "added by" the user.
const KINDS = ["link", "reference", "number", "where"];

function Submit() {
  const { pending } = useFormStatus();
  const { t } = useT();
  return <button type="submit" disabled={pending}>{pending ? t("evidence.saving") : t("evidence.add")}</button>;
}

export default function EvidenceForm({ achievement, uid }) {
  const { t } = useT();
  const [kind, setKind] = useState("link");
  const id = (f) => `ev-${uid}-${f}`;
  const field = (f, opts = {}) => (
    <div>
      <label htmlFor={id(f)}>{t(`evidence.f.${f}`)}{opts.optional && <small> · {t("evidence.optional")}</small>}</label>
      <input id={id(f)} name={f} type={opts.type || "text"} maxLength={opts.max || 120} required={!opts.optional}
        placeholder={t(`evidence.ph.${f}`)} inputMode={opts.inputMode} />
    </div>
  );

  return (
    <form action={addProofItem} className="evidence-form">
      <input type="hidden" name="achievement" value={achievement} />
      <input type="hidden" name="kind" value={kind} />
      <div className="kind-tabs" role="tablist" aria-label={t("evidence.kindLabel")}>
        {KINDS.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "kind-tab on" : "kind-tab"} onClick={() => setKind(k)}>
            {t(`evidence.kind.${k}`)}
          </button>
        ))}
      </div>
      <p className="muted small-print">{t(`evidence.help.${kind}`)}</p>
      {kind === "link" && <div className="row">{field("url", { type: "url", max: 300, inputMode: "url" })}{field("title", { optional: true })}</div>}
      {kind === "reference" && (
        <>
          <div className="row">{field("ref_name", { max: 100 })}{field("ref_role", { optional: true, max: 100 })}</div>
          <div className="row">{field("ref_org", { optional: true, max: 100 })}{field("ref_relation", { optional: true, max: 100 })}</div>
          {field("ref_contact", { optional: true })}
          <label className="check-line"><input type="checkbox" name="show_contact" /> {t("evidence.showContact")}</label>
        </>
      )}
      {kind === "number" && field("stat")}
      {kind === "where" && field("place")}
      <Submit />
    </form>
  );
}
