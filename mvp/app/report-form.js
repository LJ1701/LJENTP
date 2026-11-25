import { reportContent } from "./report-actions";

// A small "Report" link that opens a form. Used on public proof pages, employer roles and stories.
// Server component: it gets t() from the page.
export default function ReportForm({ kind, target, t, back }) {
  const path = back || (kind === "profile" ? `/p/${target}` : kind === "story" ? `/stories/${target}` : "/profile?tab=jobs");
  return (
    <details className="report">
      <summary>{t(`trust.report.${kind}`)}</summary>
      <form action={reportContent}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="back" value={path} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />
        <label htmlFor={`reason-${kind}-${target}`}>{t("trust.report.why")}</label>
        <select id={`reason-${kind}-${target}`} name="reason" required defaultValue="">
          <option value="" disabled>{t("trust.report.choose")}</option>
          <option value="fake">{t("trust.report.fake")}</option>
          <option value="scam">{t("trust.report.scam")}</option>
          <option value="not_theirs">{t("trust.report.notTheirs")}</option>
          <option value="other">{t("trust.report.other")}</option>
        </select>
        <label htmlFor={`details-${kind}-${target}`}>{t("trust.report.details")} <small>({t("evidence.optional")})</small></label>
        <textarea id={`details-${kind}-${target}`} name="details" rows={2} maxLength={500} />
        <button type="submit" className="mini ghost">{t("trust.report.send")}</button>
        <p className="muted"><small>{t("trust.report.private")}</small></p>
      </form>
    </details>
  );
}
