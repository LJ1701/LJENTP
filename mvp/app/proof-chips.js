// The proof attached to one achievement, as small tags. Used on the Passport (with a remove button)
// and on the public proof page (read-only). Server component: it gets t() from the page.

// Splits saved achievements into lines and attaches each proof item to its line. Items whose line was
// edited or removed are returned separately so the owner can still see and remove them.
export function groupProof(achievements, items) {
  const lines = String(achievements || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const byLine = new Map(lines.map((l) => [l, []]));
  const orphans = [];
  for (const it of items || []) (byLine.get(String(it.achievement).trim()) || orphans).push(it);
  return { lines: lines.map((line) => ({ line, items: byLine.get(line) })), orphans };
}

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

function Chip({ it, t }) {
  if (it.kind === "link") {
    return <a className="ev-chip ev-link" href={it.url} target="_blank" rel="noopener noreferrer nofollow ugc">
      <span className="ev-kind">{t("evidence.kind.link")}</span> {it.title || hostOf(it.url)} ↗</a>;
  }
  if (it.kind === "reference") {
    const who = [it.ref_role, it.ref_org].filter(Boolean).join(", ");
    return <span className="ev-chip ev-ref">
      <span className="ev-kind">{t("evidence.kind.reference")}</span> <strong>{it.ref_name}</strong>{who && <>, {who}</>}
      {it.ref_relation && <small> · {it.ref_relation}</small>}
      {it.ref_contact && <small> · {it.ref_contact}{it.show_contact === false && ` (${t("evidence.private")})`}</small>}
    </span>;
  }
  if (it.kind === "number") return <span className="ev-chip ev-num"><span className="ev-kind">{t("evidence.kind.number")}</span> <strong>{it.stat}</strong></span>;
  return <span className="ev-chip"><span className="ev-kind">{t("evidence.kind.where")}</span> {it.place}</span>;
}

export default function ProofChips({ items, t, removeAction }) {
  if (!items || !items.length) return null;
  return (
    <ul className="ev-chips">
      {items.map((it, i) => (
        <li key={it.id || i}>
          <Chip it={it} t={t} />
          {removeAction && (
            <form action={removeAction} className="ev-remove">
              <input type="hidden" name="id" value={it.id} />
              <button type="submit" className="ghost mini" aria-label={t("evidence.remove")} title={t("evidence.remove")}>×</button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
