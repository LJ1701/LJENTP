import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n-server";
import { answerReference } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirm a reference · LJSportMind", robots: { index: false } };

// The page a reference opens from the private link the user sent them. It shows exactly what the user
// claimed about them and asks one question. No account needed.
export default async function ReferenceRequest({ params, searchParams }) {
  const { token } = await params;
  const { result } = await searchParams;
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("reference_request", { token });
  const r = data && data[0];
  if (!r) notFound();
  const { t, lang } = await getT();
  const who = [r.ref_role, r.ref_org].filter(Boolean).join(", ");
  const answered = r.confirm_status === "confirmed" || r.confirm_status === "declined";

  return (
    <div className="card ref-request">
      <p className="eyebrow">{t("confirm.eyebrow")}</p>
      <h1>{t("confirm.title", { owner: r.owner_name })}</h1>
      <p>{t("confirm.intro", { owner: r.owner_name, ref: r.ref_name })}</p>
      <ul className="ref-claim">
        <li><strong>{t("confirm.you")}</strong> {r.ref_name}{who && ` · ${who}`}</li>
        {r.ref_relation && <li><strong>{t("confirm.relation")}</strong> {r.ref_relation}</li>}
        {r.achievement && <li><strong>{t("confirm.achievement")}</strong> &ldquo;{r.achievement}&rdquo;</li>}
        {r.description && <li><strong>{t("confirm.note")}</strong> {r.description}</li>}
      </ul>

      {result === "ok" || answered ? (
        <p className="ok">{r.confirm_status === "declined" ? t("confirm.thanksDeclined") : t("confirm.thanks", { owner: r.owner_name })}
          {r.confirmed_at && <> · {new Date(r.confirmed_at).toLocaleDateString(lang)}</>}</p>
      ) : (
        <form action={answerReference}>
          {result === "owner" && <p className="error">{t("confirm.ownerError")}</p>}
          {result && !["ok", "owner"].includes(result) && <p className="error">{t("confirm.error")}</p>}
          <input type="hidden" name="token" value={token} />
          <label htmlFor="note">{t("confirm.commentLabel", { owner: r.owner_name })} <small>({t("evidence.optional")})</small></label>
          <textarea id="note" name="note" rows={3} maxLength={300} placeholder={t("confirm.commentPh")} />
          <div className="ref-actions">
            <button type="submit" name="answer" value="confirmed">{t("confirm.yes")}</button>
            <button type="submit" name="answer" value="declined" className="ghost">{t("confirm.no")}</button>
          </div>
          <p><small>{t("confirm.fine")}</small></p>
        </form>
      )}
    </div>
  );
}
