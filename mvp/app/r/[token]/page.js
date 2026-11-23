import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n-server";
import { emailDomain, isPersonalDomain } from "@/lib/trust";
import { answerReference, withdrawReference } from "./actions";
import EmailStep from "./email-step";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirm a reference · The Assist", robots: { index: false } };

// The page a reference opens from the private link the user sent them. It shows exactly what the user
// claimed about them and asks one question. To answer, the reference first signs in with Google or Microsoft
// (supabase/013_trust.sql checks this too), so a confirmation can't be faked from a second browser.
export default async function ReferenceRequest({ params, searchParams }) {
  const { token } = await params;
  const { result } = await searchParams;
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();
  const supabase = await createClient();
  const [{ data }, { data: { user } }] = await Promise.all([supabase.rpc("reference_request", { token }), supabase.auth.getUser()]);
  const r = data && data[0];
  if (!r) notFound();
  const { t, lang } = await getT();
  const who = [r.ref_role, r.ref_org].filter(Boolean).join(", ");
  const answered = r.confirm_status === "confirmed" || r.confirm_status === "declined";
  const viaProvider = (user?.identities || []).some((i) => i.provider === "google" || i.provider === "azure");
  const signedIn = !!(user && !user.is_anonymous && user.email && user.email_confirmed_at && viaProvider);
  const domain = signedIn ? emailDomain(user.email) : "";
  const errors = { owner: t("confirm.ownerError"), email: t("trust.emailFirst"), limit: t("trust.limit"), link: t("trust.linkExpired") };

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

      {result === "withdrawn" ? (
        <p className="ok">{t("trust.withdrawn")}</p>
      ) : result === "ok" || answered ? (
        <>
          <p className="ok">{r.confirm_status === "declined" ? t("confirm.thanksDeclined") : t("confirm.thanks", { owner: r.owner_name })}
            {r.confirmed_at && <> · {new Date(r.confirmed_at).toLocaleDateString(lang)}</>}</p>
          {r.answered_by_me && r.confirm_status === "confirmed" && (
            <form action={withdrawReference}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="mini ghost">{t("trust.withdraw")}</button>
            </form>
          )}
        </>
      ) : (
        <>
          {result && errors[result] && <p className="error">{errors[result]}</p>}
          {result && !errors[result] && result !== "ok" && <p className="error">{t("confirm.error")}</p>}
          {!signedIn ? (
            <EmailStep token={token} />
          ) : (
            <form action={answerReference}>
              <p className="muted"><small>{t("trust.answeringAs", { email: user.email })} · {isPersonalDomain(domain) ? t("trust.personalEmailShort") : t("trust.workEmailShort", { domain })}</small></p>
              <input type="hidden" name="token" value={token} />
              <label htmlFor="note">{t("confirm.commentLabel", { owner: r.owner_name })} <small>({t("evidence.optional")})</small></label>
              <textarea id="note" name="note" rows={3} maxLength={300} placeholder={t("confirm.commentPh")} />
              <div className="ref-actions">
                <button type="submit" name="answer" value="confirmed">{t("confirm.yes")}</button>
                <button type="submit" name="answer" value="declined" className="ghost">{t("confirm.no")}</button>
              </div>
              <p><small>{t("trust.fine")}</small></p>
            </form>
          )}
          {signedIn && (
            <form action="/auth/signout" method="post"><button type="submit" className="link-button"><small>{t("trust.notYou")}</small></button></form>
          )}
        </>
      )}
    </div>
  );
}
