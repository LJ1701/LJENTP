// Shared pieces for the Stories list and a single story: a personal header (initial, name, role),
// the path as a timeline, and small facts worked out from the steps.

// "J." -> "J", "Ana Ruiz" -> "AR"
export const initials = (name) =>
  String(name || "?").replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

// Advice and "what helped" may be stored with quote marks around them; the design adds its own.
export const unquote = (text) => String(text || "").trim().replace(/^["“”']+|["“”']+$/g, "").trim();

export function storyFacts(s) {
  const steps = Array.isArray(s.steps) ? s.steps : [];
  const years = steps.map((st) => st.year).filter(Boolean);
  return {
    steps: steps.length,
    turning: steps.filter((st) => st.kind === "referral").length,
    from: years.length ? Math.min(...years) : null,
    to: years.length ? Math.max(...years) : null
  };
}

export function StoryHead({ s, t, big = false, link = false }) {
  const name = link ? <a href={`/stories/${s.id}`}>{s.display_name}</a> : s.display_name;
  return (
    <div className={`story-head${big ? " big" : ""}`}>
      <span className="story-avatar" aria-hidden="true">{initials(s.display_name)}</span>
      <div className="story-who">
        {big ? <h1>{name}</h1> : <h2>{name}</h2>}
        <p>{s.role_title}</p>
      </div>
      <span className="story-tag">{t(`stories.fields.${s.field}`)}</span>
    </div>
  );
}

export function FactsLine({ s, t }) {
  const f = storyFacts(s);
  const bits = [t("stories.stepsCount", { n: f.steps })];
  if (f.from) bits.push(f.from === f.to ? String(f.from) : `${f.from}–${f.to}`);
  if (f.turning) bits.push(t("stories.turningCount", { n: f.turning }));
  return <p className="story-facts">{bits.join(" · ")}</p>;
}

export function StoryPath({ steps, t }) {
  const list = Array.isArray(steps) ? steps : [];
  return (
    <ol className="story-path">
      {list.map((st, i) => (
        <li key={i} className={`story-step kind-${st.kind}`}>
          <span className="story-kind">{t(`stories.kinds.${st.kind}`)}{st.year ? ` · ${st.year}` : ""}</span>
          <span>{st.text}</span>
        </li>
      ))}
    </ol>
  );
}
