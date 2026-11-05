import { createClient } from "@/lib/supabase/server";
import { billingStatus, FREE_ANSWERS } from "@/lib/billing";
import { getSubscription } from "@/lib/stripe";
import { getT } from "@/lib/i18n-server";
import { fill } from "@/lib/i18n";
import { buy, setProRenewal, joinProgram, requestPilot } from "../billing/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("pricing.metaTitle"), description: t("pricing.metaDescription") };
}

export default async function Pricing({ searchParams }) {
  const { error, ok, canceled, pilot, pilot_error } = await searchParams;
  const { t, lang, dict } = await getT();
  const P = dict.pricing;
  const day = (iso) => new Date(iso).toLocaleDateString(lang, { month: "short", day: "numeric", year: "numeric" });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const status = user ? await billingStatus(user.id) : null;
  let cancelling = false;
  if (status?.pro && status.subscription) {
    try { cancelling = !!(await getSubscription(status.subscription)).cancel_at_period_end; } catch { /* show as renewing */ }
  }
  const guest = user?.is_anonymous;

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">{t("pricing.eyebrow")}</p>
        <h1>{t("pricing.title")} <span className="gold-text">{t("pricing.titleGold")}</span></h1>
        <p className="muted">{t("pricing.sub")}</p>
      </div>
      {error && <p className="error">{error}</p>}
      {ok && <p className="ok">{ok}</p>}
      {canceled && <p className="warn">{t("pricing.canceled")}</p>}

      {status?.ready && (
        <div className="card plan-status">
          <h2>{t("pricing.yourPlan")}</h2>
          <p>{status.pro ? <><strong>{t("pricing.proLine")}</strong> · {cancelling ? t("pricing.cancelledUntil", { date: day(status.proUntil) }) : t("pricing.renewsOn", { date: day(status.proUntil) })}</>
            : status.program ? <strong>{t("pricing.programLine", { name: status.program.name, date: day(status.program.until) })}</strong>
            : <><strong>{t("pricing.freeLine", { left: status.freeLeft, n: FREE_ANSWERS })}</strong>{status.packLeft > 0 && <> · {t("pricing.packLine", { n: status.packLeft })}</>}</>}</p>
          {status.pro && (
            <form action={setProRenewal}>
              <input type="hidden" name="renew" value={cancelling ? "1" : "0"} />
              <button type="submit" className="ghost">{cancelling ? t("pricing.keepPro") : t("pricing.cancelPro")}</button>
            </form>
          )}
        </div>
      )}

      <div className="price-grid">
        <div className="card price">
          <h2>{t("pricing.freeName")}</h2>
          <p className="price-tag">$0</p>
          <ul>{P.freeItems.map((x) => <li key={x}>{fill(x, { n: FREE_ANSWERS })}</li>)}</ul>
          <a className="cta small" href={user ? "/profile" : "/"}>{user ? t("pricing.openPassport") : t("pricing.startFree")}</a>
        </div>
        <div className="card price">
          <h2>{t("pricing.packName")}</h2>
          <p className="price-tag">$5 <small>{t("pricing.oneTime")}</small></p>
          <ul>{P.packItems.map((x) => <li key={x}>{x}</li>)}</ul>
          <form action={buy}><input type="hidden" name="kind" value="pack" /><button type="submit" disabled={!user || guest}>{t("pricing.buyPack")}</button></form>
        </div>
        <div className="card price featured">
          <span className="badge badge-full">{t("pricing.mostAi")}</span>
          <h2>{t("pricing.proName")}</h2>
          <p className="price-tag">$9 <small>{t("pricing.perMonth")}</small></p>
          <ul>{P.proItems.map((x) => <li key={x}>{x}</li>)}</ul>
          <form action={buy}><input type="hidden" name="kind" value="pro" /><button type="submit" disabled={!user || guest || status?.pro}>{status?.pro ? t("pricing.havePro") : t("pricing.goPro")}</button></form>
        </div>
      </div>
      {!user && <p className="muted center"><small>{t("pricing.startFreeNote")}</small></p>}
      {guest && <p className="muted center"><small>{t("pricing.guestNote")} <a href="/profile">{t("pricing.guestLink")}</a></small></p>}

      <h2 className="step-title" id="schools">{t("pricing.schoolsTitle")}</h2>
      <div className="card">
        <p className="price-tag">{t("pricing.fromPrice")} <small>{t("pricing.perYear")}</small></p>
        <ul>{P.schoolItems.map(([b, rest]) => <li key={b}><strong>{b}</strong> {rest}</li>)}</ul>
        <p><a className="cta small" href="/program">{t("pricing.startPilot")}</a> <small>{t("pricing.pilotNote")}</small></p>

        <h3>{t("pricing.requestTitle")}</h3>
        {pilot ? <p className="ok">{t("pricing.thanks")}</p> : (
          <form action={requestPilot} className="pilot-form">
            {pilot_error && <p className="error">{pilot_error}</p>}
            <div className="row">
              <div><label htmlFor="pr-name">{t("pricing.name")}</label><input id="pr-name" name="name" type="text" required maxLength={100} /></div>
              <div><label htmlFor="pr-email">{t("pricing.email")}</label><input id="pr-email" name="email" type="email" required maxLength={200} /></div>
            </div>
            <div className="row">
              <div><label htmlFor="pr-org">{t("pricing.org")}</label><input id="pr-org" name="organization" type="text" required maxLength={150} /></div>
              <div><label htmlFor="pr-role">{t("pricing.role")}</label><input id="pr-role" name="role" type="text" placeholder={t("pricing.rolePlaceholder")} maxLength={100} /></div>
            </div>
            <label htmlFor="pr-students">{t("pricing.students")}</label>
            <input id="pr-students" name="students" type="number" min={1} max={100000} />
            <label htmlFor="pr-msg">{t("pricing.message")}</label>
            <textarea id="pr-msg" name="message" rows={3} maxLength={1000} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <button type="submit">{t("pricing.request")}</button>
          </form>
        )}
        <h3>{t("pricing.codeTitle")}</h3>
        {user ? (
          <form action={joinProgram} className="join-form">
            <input type="hidden" name="from" value="pricing" />
            <input type="text" name="code" placeholder={t("billing.codePlaceholder")} maxLength={12} aria-label={t("billing.codeLabel")} required />
            <button type="submit">{t("billing.join")}</button>
          </form>
        ) : <p><a href="/">{t("pricing.startPassport")}</a></p>}
        <p><small>{t("billing.directorSees")}</small></p>
      </div>
    </>
  );
}
