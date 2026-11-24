"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../i18n-provider";
import { linkProofCode, checkLinkProof } from "./actions";
import CopyButton from "./copy-button";

// On the owner's link card: prove the link is theirs. The owner pastes a short code into the page they linked
// to (a video description, a bio, a post), then the server opens the page and looks for it.
export default function LinkProof({ id }) {
  const { t } = useT();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!code) {
    return (
      <div className="pf-confirm">
        <p className="pf-meta"><small>{t("trust.linkNudge")}</small></p>
        <button type="button" className="mini" disabled={busy} onClick={async () => {
          setBusy(true); setError("");
          const r = await linkProofCode(id);
          setBusy(false);
          if (r?.code) setCode(r.code); else setError(r?.error || t("trust.linkError"));
        }}>{busy ? t("evidence.saving") : t("trust.proveLink")}</button>
        {error && <p className="error"><small>{error}</small></p>}
      </div>
    );
  }

  return (
    <div className="pf-confirm link-proof">
      <p className="pf-meta"><small>{t("trust.pasteCode")}</small></p>
      <p className="proof-url"><code>{code}</code> <CopyButton text={code} /></p>
      <button type="button" className="mini" disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        const r = await checkLinkProof(id);
        setBusy(false);
        if (r?.ok) router.refresh(); else setError(r?.error || t("trust.linkError"));
      }}>{busy ? t("trust.checking") : t("trust.checkNow")}</button>
      <p className="pf-meta"><small>{t("trust.removeAfter")}</small></p>
      {error && <p className="error"><small>{error}</small></p>}
    </div>
  );
}
