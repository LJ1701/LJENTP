"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplication, removeApplication, addApplication } from "./actions";
import { useT } from "../i18n-provider";

// The application tracker: every job the user tracks, with its stage, the date they applied, a follow-up date
// and notes. Changes save as soon as they're made. Follow-ups due today or earlier are flagged.
const STAGES = ["saved", "applied", "interview", "offer", "rejected"];
const today = () => new Date().toISOString().slice(0, 10);

function Row({ app, onChange, onRemove }) {
  const { t, lang } = useT();
  const [notes, setNotes] = useState(app.notes || "");
  const [busy, start] = useTransition();
  const save = (patch) => start(async () => { const r = await updateApplication(app.id, patch); if (r.row) onChange(r.row); });
  const due = app.follow_up && app.status !== "rejected" && app.status !== "offer" && app.follow_up <= today();
  const fmt = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(lang, { month: "short", day: "numeric" });
  return (
    <article className={`app-row stage-${app.status}`}>
      <div className="app-head">
        <div>
          <h4>{app.url ? <a href={app.url} target="_blank" rel="noopener noreferrer">{app.title}</a> : app.title}</h4>
          <p className="muted"><small>{[app.company, app.location].filter(Boolean).join(" · ")}{app.applied_on && ` · ${t("tracker.appliedOn", { date: fmt(app.applied_on) })}`}</small></p>
          {due && <p className="warn"><small>{app.follow_up < today() ? t("tracker.overdue", { date: fmt(app.follow_up) }) : t("tracker.dueToday")}</small></p>}
        </div>
        <label className="visually-hidden" htmlFor={`st-${app.id}`}>{t("tracker.stage")}</label>
        <select id={`st-${app.id}`} value={app.status} disabled={busy} onChange={(e) => save({ status: e.target.value })}>
          {STAGES.map((s) => <option key={s} value={s}>{t(`tracker.stages.${s}`)}</option>)}
        </select>
      </div>
      <details>
        <summary>{t("tracker.details")}</summary>
        <div className="row">
          <div><label htmlFor={`ap-${app.id}`}>{t("tracker.applied")}</label><input id={`ap-${app.id}`} type="date" defaultValue={app.applied_on || ""} onChange={(e) => save({ applied_on: e.target.value })} /></div>
          <div><label htmlFor={`fu-${app.id}`}>{t("tracker.followUp")}</label><input id={`fu-${app.id}`} type="date" defaultValue={app.follow_up || ""} onChange={(e) => save({ follow_up: e.target.value })} /></div>
        </div>
        <label htmlFor={`no-${app.id}`}>{t("tracker.notes")}</label>
        <textarea id={`no-${app.id}`} rows={3} maxLength={2000} value={notes} placeholder={t("tracker.notesPh")} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (app.notes || "") && save({ notes })} />
        <button type="button" className="ghost mini" disabled={busy} onClick={() => start(async () => { const r = await removeApplication(app.id); if (r.ok) onRemove(app.id); })}>{t("tracker.remove")}</button>
      </details>
    </article>
  );
}

export default function Tracker({ initial }) {
  const { t } = useT();
  const router = useRouter();
  const [apps, setApps] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState("");
  const [adding, startAdd] = useTransition();
  const counts = Object.fromEntries(STAGES.map((s) => [s, apps.filter((a) => a.status === s).length]));
  const sent = apps.filter((a) => a.status !== "saved").length;
  const dueCount = apps.filter((a) => a.follow_up && a.follow_up <= today() && !["offer", "rejected"].includes(a.status)).length;
  const shown = (filter === "all" ? apps : apps.filter((a) => a.status === filter))
    .slice().sort((a, b) => (b.follow_up && b.follow_up <= today()) - (a.follow_up && a.follow_up <= today()) || String(b.updated_at).localeCompare(String(a.updated_at)));

  return (
    <div className="tracker">
      <div className="stage-chips" role="group" aria-label={t("tracker.filter")}>
        <button type="button" className={filter === "all" ? "chip on" : "chip"} onClick={() => setFilter("all")}>{t("tracker.all")} {apps.length}</button>
        {STAGES.map((s) => <button key={s} type="button" className={filter === s ? "chip on" : "chip"} onClick={() => setFilter(s)}>{t(`tracker.stages.${s}`)} {counts[s]}</button>)}
      </div>
      <p className="muted"><small>{t("tracker.summary", { sent, interviews: counts.interview + counts.offer })}{dueCount > 0 && ` · ${t("tracker.dueCount", { n: dueCount })}`}</small></p>
      {!apps.length && <p>{t("tracker.empty")}</p>}
      {shown.map((a) => <Row key={a.id} app={a} onChange={(row) => setApps((list) => list.map((x) => (x.id === row.id ? row : x)))} onRemove={(id) => setApps((list) => list.filter((x) => x.id !== id))} />)}
      <details className="add-app">
        <summary>{t("tracker.addManual")}</summary>
        <form onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; startAdd(async () => { const r = await addApplication(new FormData(f)); if (r.error) setMsg(r.error); else { setMsg(""); f.reset(); router.refresh(); } }); }}>
          <div className="row">
            <div><label htmlFor="ma-title">{t("tracker.jobTitle")}</label><input id="ma-title" name="title" type="text" required maxLength={200} /></div>
            <div><label htmlFor="ma-company">{t("tracker.company")}</label><input id="ma-company" name="company" type="text" maxLength={120} /></div>
          </div>
          <label htmlFor="ma-url">{t("tracker.link")}</label>
          <input id="ma-url" name="url" type="text" inputMode="url" placeholder="https://" maxLength={1000} />
          <button type="submit" disabled={adding}>{adding ? t("tracker.adding") : t("tracker.add")}</button>
          {msg && <p className="error">{msg}</p>}
        </form>
      </details>
    </div>
  );
}
