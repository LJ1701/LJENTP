"use client";
import { useEffect, useState } from "react";
import { useT } from "./i18n-provider";

// Share a link: the phone's own share sheet when there is one, plus LinkedIn, X, WhatsApp and email links
// (each opens that site's own share box; nothing is posted without the user pressing send there).
export default function ShareButtons({ url, text, compact = false }) {
  const { t } = useT();
  const [native, setNative] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setNative(typeof navigator !== "undefined" && !!navigator.share); }, []);
  const u = encodeURIComponent(url);
  const m = encodeURIComponent(text);
  const sites = [
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ["X", `https://twitter.com/intent/tweet?text=${m}&url=${u}`],
    ["WhatsApp", `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`],
    [t("share.email"), `mailto:?subject=${m}&body=${encodeURIComponent(`${text}\n\n${url}`)}`]
  ];
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* no clipboard */ }
  }
  return (
    <div className={compact ? "share-row compact" : "share-row"}>
      {native && <button type="button" className="ghost mini" onClick={() => navigator.share({ title: text, text, url }).catch(() => {})}>{t("share.share")}</button>}
      {!compact && sites.map(([name, href]) => <a key={name} className="share-link" href={href} target="_blank" rel="noopener noreferrer">{name}</a>)}
      <button type="button" className="ghost mini" onClick={copy}>{copied ? t("profile.copied") : t("share.copyLink")}</button>
    </div>
  );
}
