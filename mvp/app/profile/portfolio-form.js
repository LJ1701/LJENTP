"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addPortfolioItem } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { useT } from "../i18n-provider";

// Adds one portfolio item: a file (uploaded straight to Supabase Storage), a link, or a reference.
// Nobody has to approve it; the public page shows it as "added by" the user.
const KINDS = ["file", "link", "reference"];
const MAX_MB = 10;
const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"];
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm";

export default function PortfolioForm({ lines }) {
  const { t } = useT();
  const router = useRouter();
  const form = useRef(null);
  const [kind, setKind] = useState("file");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null); // { ok, text }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const input = Object.fromEntries([...fd.entries()].filter(([, val]) => typeof val === "string"));
    input.kind = kind;
    input.show_contact = fd.get("show_contact") === "on";
    try {
      if (kind === "file") {
        const file = fd.get("file");
        if (!file || !file.size) return setMsg({ text: t("evidence.needFile") });
        if (!TYPES.includes(file.type)) return setMsg({ text: t("evidence.fileType") });
        if (file.size > MAX_MB * 1024 * 1024) return setMsg({ text: t("evidence.fileTooBig", { mb: MAX_MB }) });
        setBusy(t("evidence.uploading"));
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return setMsg({ text: t("evidence.uploadError") });
        const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-80);
        const path = `${user.id}/${crypto.randomUUID()}-${safe}`;
        const { error } = await supabase.storage.from("portfolio").upload(path, file, { contentType: file.type, upsert: false });
        if (error) return setMsg({ text: /bucket/i.test(error.message) ? t("evidence.notReady") : t("evidence.uploadError") });
        Object.assign(input, { file_path: path, file_name: file.name, file_type: file.type, file_size: file.size });
      }
      setBusy(t("evidence.saving"));
      const res = await addPortfolioItem(input);
      if (res.error) return setMsg({ text: res.error });
      form.current?.reset();
      setMsg({ ok: true, text: t("evidence.added") });
      router.refresh();
    } catch {
      setMsg({ text: t("evidence.uploadError") });
    } finally {
      setBusy("");
    }
  }

  const field = (name, opts = {}) => (
    <div>
      <label htmlFor={`pf-${name}`}>{t(`evidence.f.${name}`)}{opts.optional && <small> · {t("evidence.optional")}</small>}</label>
      <input id={`pf-${name}`} name={name} type={opts.type || "text"} maxLength={opts.max || 120} required={!opts.optional}
        placeholder={t(`evidence.ph.${name}`)} inputMode={opts.inputMode} />
    </div>
  );

  return (
    <form ref={form} onSubmit={submit} className="evidence-form">
      <div className="kind-tabs" role="tablist" aria-label={t("evidence.kindLabel")}>
        {KINDS.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "kind-tab on" : "kind-tab"} onClick={() => { setKind(k); setMsg(null); }}>
            {t(`evidence.kind.${k}`)}
          </button>
        ))}
      </div>
      <p className="muted small-print">{t(`evidence.help.${kind}`)}</p>

      {kind === "file" && (
        <>
          <label htmlFor="pf-file">{t("evidence.f.file")}</label>
          <input id="pf-file" name="file" type="file" accept={ACCEPT} required className="file-input" />
          <small>{t("evidence.fileRules", { mb: MAX_MB })}</small>
          {field("title", { optional: true })}
        </>
      )}
      {kind === "link" && <div className="row">{field("url", { type: "url", max: 300, inputMode: "url" })}{field("title", { optional: true })}</div>}
      {kind === "reference" && (
        <>
          <div className="row">{field("ref_name", { max: 100 })}{field("ref_role", { optional: true, max: 100 })}</div>
          <div className="row">{field("ref_org", { optional: true, max: 100 })}{field("ref_relation", { optional: true, max: 100 })}</div>
          {field("ref_contact", { optional: true })}
          <label className="check-line"><input type="checkbox" name="show_contact" /> {t("evidence.showContact")}</label>
        </>
      )}

      {field("description", { optional: true, max: 200 })}
      {lines.length > 0 && (
        <>
          <label htmlFor="pf-achievement">{t("evidence.f.achievement")}<small> · {t("evidence.optional")}</small></label>
          <select id="pf-achievement" name="achievement" defaultValue="">
            <option value="">{t("evidence.noAchievement")}</option>
            {lines.map((l) => <option key={l} value={l}>{l.length > 90 ? `${l.slice(0, 88)}…` : l}</option>)}
          </select>
        </>
      )}
      <button type="submit" disabled={!!busy}>{busy || t("evidence.add")}</button>
      {msg && <p className={msg.ok ? "ok" : "error"} role="status">{msg.text}</p>}
    </form>
  );
}
