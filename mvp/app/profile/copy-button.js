"use client";
import { useState } from "react";
import { useT } from "../i18n-provider";

export default function CopyButton({ text, label }) {
  const { t } = useT();
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); } catch { setDone(false); }
    }}>{done ? t("profile.copied") : label || t("profile.copy")}</button>
  );
}
