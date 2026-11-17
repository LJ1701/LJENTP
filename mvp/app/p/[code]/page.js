import { notFound } from "next/navigation";
import { getPublicProfile, getPublicPortfolio } from "@/lib/public-profile";
import { labelIn, pathName, stepText } from "@/lib/careers";
import { effectiveProfile } from "@/lib/detect";
import { getT } from "@/lib/i18n-server";
import PortfolioCards from "../../portfolio-cards";

export const dynamic = "force-dynamic";
// Title and description for link previews (LinkedIn, iMessage, group chats); the image is opengraph-image.js.
export async function generateMetadata({ params }) {
  const { code } = await params;
  const p = await getPublicProfile(code);
  const { t, dict } = await getT();
  if (!p) return { title: `${t("public.title")} · LJSportMind`, robots: { index: false } };
  const eff = effectiveProfile(p);
  const proofs = Object.keys(eff.evidence).length;
  const title = t("public.metaTitle", { name: p.full_name || t("public.title") });
  const description = `${[dict.roles[p.role] || p.role, dict.sports[p.sport] || p.sport].filter(Boolean).join(" · ")}${proofs ? ` · ${t("public.metaProofs", { n: proofs })}` : ""}. ${t("public.metaSee")}`;
  return { title, description, robots: { index: false }, openGraph: { title, description, type: "profile" }, twitter: { card: "summary_large_image", title, description } };
}

// Read-only public proof page. Works signed out: the database functions return this one profile and its
// proof only while its owner has the link switched on. Proof is added by the owner, not checked by
// LJSportMind, so the page says so instead of calling anything "verified".
export default async function PublicProfile({ params }) {
  const { code } = await params;
  if (!/^[a-z0-9]{10}$/.test(code)) notFound();
  const [p, { items, urls }] = await Promise.all([getPublicProfile(code), getPublicPortfolio(code)]);
  if (!p) notFound();

  const { t, lang, dict } = await getT();
  const eff = effectiveProfile(p);
  const done = p.steps ? p.steps.filter((s) => s.done).length : 0;
  const lines = String(p.achievements || "").split("\n").map((l) => l.trim()).filter(Boolean);
  // Portfolio items the owner tied to an achievement show as small tags under that line.
  const shownBy = (line) => items.filter((i) => i.achievement && i.achievement.trim() === line);
  const name = p.full_name || t("public.title");
  const tags = [...eff.skills, ...eff.interests];

  return (
    <>
      <div className="proof-hero">
        <span className="verified">{t("public.badge")}</span>
        <h1>{name}</h1>
        <p className="muted">{[dict.roles[p.role] || p.role, dict.sports[p.sport] || p.sport].filter(Boolean).join(" · ")}</p>
        {p.goal && <p><strong>{t("public.goal")}</strong> {p.goal}</p>}
        {items.length > 0 && <p className="hero-stats"><a href="#portfolio">{t("evidence.publicCount", { n: items.length })}</a></p>}
      </div>

      {lines.length > 0 && (
        <section>
          <h2>{t("public.achievements")}</h2>
          <ul className="ev-public">
            {lines.map((line) => (
              <li key={line} className={shownBy(line).length ? "ev-line backed" : "ev-line"}>
                <p className="ev-text">{line}</p>
                {shownBy(line).length > 0 && (
                  <p className="ev-tags">{shownBy(line).map((i) => <a key={i.id} href="#portfolio" className="ev-chip"><span className="ev-kind">{t(`evidence.kind.${i.kind}`)}</span> {i.kind === "reference" ? i.ref_name : i.title || i.file_name || i.url}</a>)}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length > 0 && (
        <section id="portfolio">
          <h2>{t("evidence.publicTitle")}</h2>
          <PortfolioCards items={items} urls={urls} t={t} />
          <p><small>{t("evidence.publicNote", { name })}</small></p>
        </section>
      )}

      {tags.length > 0 && (
        <section>
          <h2>{t("public.skillsTitle")}</h2>
          <ul>
            {tags.map((tag) => (
              <li key={tag}>
                <strong>{labelIn(dict, tag)}</strong>
                {eff.evidence[tag] && <> · {t("public.evidence")} &ldquo;{eff.evidence[tag]}&rdquo;</>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.role_idx !== null && p.role_idx !== undefined && p.steps && (
        <section>
          <h2>{t("public.workingToward")} <span className="gold-text">{pathName(dict, p.role_idx)}</span></h2>
          <p>{t("public.planDone", { done, total: p.steps.length })}</p>
          <div className="progress" aria-hidden="true"><span style={{ width: `${Math.round((done / p.steps.length) * 100)}%` }} /></div>
          <ul className="plan-list">
            {p.steps.map((s, i) => <li key={i}><span className={s.done ? "check done" : "check"} style={{ display: "inline-grid", placeItems: "center" }}>{s.done ? "✓" : ""}</span> <span className={s.done ? "done-text" : ""}>{stepText(dict, s, p.role_idx)}</span></li>)}
          </ul>
        </section>
      )}

      <p><small>{t("public.footnote", { date: new Date(p.updated_at).toLocaleDateString(lang) })}</small></p>
    </>
  );
}
