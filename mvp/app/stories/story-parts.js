import { countryName } from "@/lib/countries";

// Shared pieces for the Stories list and a single story.
export function StoryMeta({ s, t, lang }) {
  const bits = [s.role_title, t(`stories.fields.${s.field}`), s.country ? countryName(s.country, lang) : ""].filter(Boolean);
  return <p className="muted story-meta">{bits.join(" · ")}</p>;
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
