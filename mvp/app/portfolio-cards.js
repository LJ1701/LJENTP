// Portfolio items as cards: files, links and references the user added themselves. Used on the Passport
// (with a remove button) and on the public proof page (read-only). Server component: it gets t() from the page.

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
const fileKind = (type) => (type.startsWith("image/") ? "image" : type.startsWith("video/") ? "video" : "pdf");
const ICON = { image: "🖼", video: "🎬", pdf: "📄", link: "🔗", reference: "👤" };

function Card({ it, url, t, removeAction }) {
  const fk = it.kind === "file" ? fileKind(it.file_type) : it.kind;
  const title = it.kind === "reference" ? it.ref_name : it.title || (it.kind === "link" ? hostOf(it.url) : it.file_name);
  const href = it.kind === "link" ? it.url : it.kind === "file" ? url : null;
  const who = [it.ref_role, it.ref_org].filter(Boolean).join(", ");
  return (
    <li className="pf-card">
      {it.kind === "file" && fk === "image" && url && <a href={url} target="_blank" rel="noopener noreferrer" className="pf-thumb"><img src={url} alt="" loading="lazy" /></a>}
      <div className="pf-body">
        <p className="pf-kind"><span aria-hidden="true">{ICON[fk]}</span> {t(`evidence.kind.${it.kind}`)}</p>
        <p className="pf-title">
          {href ? <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">{title} ↗</a> : <strong>{title}</strong>}
        </p>
        {it.kind === "reference" && (who || it.ref_relation || it.ref_contact) && (
          <p className="pf-meta">{who}{who && it.ref_relation && " · "}{it.ref_relation}
            {it.ref_contact && <> · {it.ref_contact}{it.show_contact === false && ` (${t("evidence.private")})`}</>}</p>
        )}
        {it.kind === "link" && it.title && <p className="pf-meta">{hostOf(it.url)}</p>}
        {it.description && <p className="pf-desc">{it.description}</p>}
        {it.achievement && <p className="pf-shows"><small>{t("evidence.shows")} &ldquo;{it.achievement}&rdquo;</small></p>}
        {it.kind === "file" && !url && <p className="pf-meta"><small>{t("evidence.fileUnavailable")}</small></p>}
      </div>
      {removeAction && (
        <form action={removeAction} className="pf-remove">
          <input type="hidden" name="id" value={it.id} />
          <button type="submit" className="ghost mini" aria-label={t("evidence.remove")} title={t("evidence.remove")}>×</button>
        </form>
      )}
    </li>
  );
}

export default function PortfolioCards({ items, urls = {}, t, removeAction }) {
  if (!items || !items.length) return null;
  return (
    <ul className="pf-grid">
      {items.map((it) => <Card key={it.id} it={it} url={urls[it.file_path]} t={t} removeAction={removeAction} />)}
    </ul>
  );
}
