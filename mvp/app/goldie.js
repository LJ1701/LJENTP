"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CoachChat from "./profile/coach-chat";
import { newSince } from "./profile/actions";
import GuestButton from "./guest-button";

// Goldie: LJSportMind's guide, an original gold ball mascot in the logo colours (octagon from the logo,
// seams from every sport). On the Passport page Goldie is the AI coach and can move the page for the user;
// on other pages Goldie gives a short scripted welcome (no AI call, so no Gemini quota is used).

const TOUR = [
  ["passport", "This is your Sports Passport. Paste your résumé or fill it in. Then tell me one thing you did and I'll turn it into proof with numbers employers can check."],
  ["path", "Your path: the sports careers you fit, with proof for each skill. Pick a target and your plan appears right inside it."],
  ["jobs", "Real sports jobs and internships, from anywhere. Ask for what you want, then press Fit check on any posting."],
  ["proof", "Your proof: one public link and honest résumé bullets for every application."],
  [null, "That's it! Tick plan steps as you go and they become proof. I'm always here in the corner."]
];
const SECTIONS = { go_passport: "passport", go_matches: "path", go_jobs: "jobs", go_plan: "path", go_proof: "proof" };

const store = {
  get: (k) => { try { return window.localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { window.localStorage.setItem(k, v); } catch {} }
};

// Goldie's looks. Gold is the default; the user can pick a sport ball in the panel (saved in this browser only).
export const SKINS = [["gold", "Goldie"], ["soccer", "Soccer"], ["basketball", "Basketball"], ["football", "Football"], ["baseball", "Baseball"], ["volleyball", "Volleyball"]];
const SKIN_KEY = "goldie-skin";

export function useGoldieSkin() {
  const [skin, setSkin] = useState("gold");
  useEffect(() => {
    const saved = store.get(SKIN_KEY);
    if (SKINS.some(([k]) => k === saved)) setSkin(saved);
    const onSkin = (e) => setSkin(e.detail);
    window.addEventListener("goldie:skin", onSkin);
    return () => window.removeEventListener("goldie:skin", onSkin);
  }, []);
  return skin;
}

const pickSkin = (k) => { store.set(SKIN_KEY, k); window.dispatchEvent(new CustomEvent("goldie:skin", { detail: k })); };

const gradient = (id, stops) => (
  <radialGradient id={id} cx="36%" cy="30%" r="75%">
    {stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
  </radialGradient>
);

// The ball itself (body and markings) for each look; the face is drawn on top of any of them.
function SkinBody({ skin }) {
  const ink = { fill: "none", stroke: "#1a1206", strokeOpacity: 0.55, strokeWidth: 2.2 };
  if (skin === "soccer") return (
    <>
      <defs>{gradient("goldie-soccer", [["0%", "#ffffff"], ["60%", "#e4e6ec"], ["100%", "#8d93a0"]])}</defs>
      <circle cx="50" cy="50" r="44" fill="url(#goldie-soccer)" stroke="#3a3f4a" strokeWidth="1.5" />
      <polygon points="50,9 60,16 56,28 44,28 40,16" fill="#15171c" />
      <path d="M7 40 L16 36 L20 46 L13 55 L6 52 Z M93 40 L84 36 L80 46 L87 55 L94 52 Z M26 84 L30 75 L41 79 L40 90 Z M74 84 L70 75 L59 79 L60 90 Z" fill="#15171c" />
      <path d="M44 28 L30 36 L20 46 M56 28 L70 36 L80 46 M13 55 L22 70 L30 75 M87 55 L78 70 L70 75 M41 79 L59 79" {...ink} strokeOpacity="0.35" strokeWidth="1.4" />
    </>
  );
  if (skin === "basketball") return (
    <>
      <defs>{gradient("goldie-basketball", [["0%", "#ffc68f"], ["40%", "#f08a3c"], ["100%", "#8a3a0f"]])}</defs>
      <circle cx="50" cy="50" r="44" fill="url(#goldie-basketball)" stroke="#5a250a" strokeWidth="1.5" />
      <path d="M21 15 Q35 50 21 85 M79 15 Q65 50 79 85 M50 6 L50 36 M50 76 L50 94 M6 50 L24 50 M76 50 L94 50" {...ink} strokeOpacity="0.7" />
    </>
  );
  if (skin === "football") return (
    <>
      <defs>{gradient("goldie-football", [["0%", "#e0a06d"], ["45%", "#a95a27"], ["100%", "#4a230c"]])}</defs>
      <ellipse cx="50" cy="52" rx="47" ry="36" fill="url(#goldie-football)" stroke="#3a1a08" strokeWidth="1.5" />
      <path d="M17 30 Q12 52 17 74 M83 30 Q88 52 83 74" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="3" />
      <path d="M36 24 L64 24 M40 20 L40 28 M46 20 L46 28 M52 20 L52 28 M58 20 L58 28" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
  if (skin === "baseball") return (
    <>
      <defs>{gradient("goldie-baseball", [["0%", "#ffffff"], ["60%", "#ece8df"], ["100%", "#9a958a"]])}</defs>
      <circle cx="50" cy="50" r="44" fill="url(#goldie-baseball)" stroke="#6d685e" strokeWidth="1.5" />
      <path d="M22 12 Q38 50 22 88 M78 12 Q62 50 78 88" fill="none" stroke="#c8102e" strokeWidth="1.8" />
      <path d="M24 22 l5 -2 M28 32 l5 -1 M30 42 l5 0 M30 58 l5 0 M28 68 l5 1 M24 78 l5 2 M76 22 l-5 -2 M72 32 l-5 -1 M70 42 l-5 0 M70 58 l-5 0 M72 68 l-5 1 M76 78 l-5 2" fill="none" stroke="#c8102e" strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
  if (skin === "volleyball") return (
    <>
      <defs>{gradient("goldie-volleyball", [["0%", "#ffffff"], ["60%", "#eef0f4"], ["100%", "#9aa1ad"]])}</defs>
      <circle cx="50" cy="50" r="44" fill="url(#goldie-volleyball)" stroke="#4a5060" strokeWidth="1.5" />
      <path d="M50 6 Q22 22 14 52 Q26 34 50 30 Q74 34 86 52 Q78 22 50 6 Z" fill="#f5c518" fillOpacity="0.85" />
      <path d="M14 70 Q30 92 50 94 Q70 92 86 70 Q66 82 50 82 Q34 82 14 70 Z" fill="#1f5fbf" fillOpacity="0.85" />
      <path d="M14 52 Q26 34 50 30 Q74 34 86 52 M14 70 Q34 82 50 82 Q66 82 86 70" {...ink} strokeOpacity="0.4" strokeWidth="1.4" />
    </>
  );
  return (
    <>
      <defs>{gradient("goldie-gold", [["0%", "#fff3c4"], ["35%", "#f0cf7f"], ["72%", "#c9974a"], ["100%", "#7d5520"]])}</defs>
      <circle cx="50" cy="50" r="44" fill="url(#goldie-gold)" stroke="#5c3f15" strokeWidth="1.5" />
      {/* Seams: basketball and football curves on the sides */}
      <path d="M21 15 Q35 50 21 85" fill="none" stroke="#1a1206" strokeOpacity="0.5" strokeWidth="2.2" />
      <path d="M79 15 Q65 50 79 85" fill="none" stroke="#1a1206" strokeOpacity="0.5" strokeWidth="2.2" />
      <path d="M8 46 Q14 44 18 40 M92 46 Q86 44 82 40" fill="none" stroke="#1a1206" strokeOpacity="0.4" strokeWidth="1.8" />
      {/* The LJSportMind octagon on top, like a soccer ball panel */}
      <polygon points="50,10 57,13 60,20 57,27 50,30 43,27 40,20 43,13" fill="#101218" stroke="#e9c77b" strokeWidth="1.6" />
      <polygon points="50,15 54,17 55.5,20 54,23 50,25 46,23 44.5,20 46,17" fill="none" stroke="#e9c77b" strokeOpacity="0.7" strokeWidth="1" />
    </>
  );
}

// skin: a fixed look (the picker's previews); otherwise the user's chosen look.
export function GoldieBall({ talking = false, cheering = false, size = 64, skin }) {
  const chosen = useGoldieSkin();
  const look = skin || chosen;
  return (
    <svg className={`goldie-ball${talking ? " talking" : ""}${cheering ? " cheering" : ""}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <SkinBody skin={look} />
      <ellipse cx="32" cy="30" rx="9" ry="5" fill="#fff" opacity="0.35" transform="rotate(-30 32 30)" />
      <circle cx="30" cy="62" r="4.5" fill="#e8826b" opacity="0.35" />
      <circle cx="70" cy="62" r="4.5" fill="#e8826b" opacity="0.35" />
      <g className="goldie-eyes">
        <ellipse cx="39" cy="51" rx="5.5" ry="6.5" fill="#fff" />
        <ellipse cx="61" cy="51" rx="5.5" ry="6.5" fill="#fff" />
        <circle cx="40" cy="52.5" r="3" fill="#1a1206" />
        <circle cx="62" cy="52.5" r="3" fill="#1a1206" />
        <circle cx="41" cy="51" r="1" fill="#fff" />
        <circle cx="63" cy="51" r="1" fill="#fff" />
      </g>
      {talking
        ? <ellipse className="goldie-mouth" cx="50" cy="67" rx="5" ry="3.5" fill="#1a1206" />
        : cheering
          ? <path d="M41 63 Q50 76 59 63 Z" fill="#1a1206" stroke="#1a1206" strokeWidth="1.5" strokeLinejoin="round" />
          : <path d="M43 65 Q50 71 57 65" fill="none" stroke="#1a1206" strokeWidth="2.4" strokeLinecap="round" />}
    </svg>
  );
}

// Goldie on the homepage hero: click to open the guide.
export function HeroGoldie() {
  return (
    <button type="button" className="hero-goldie" onClick={() => window.dispatchEvent(new CustomEvent("goldie:open"))} aria-label="Say hi to Goldie, your guide">
      <span className="hero-goldie-bubble" aria-hidden="true">Hi! I&apos;m Goldie.</span>
      <GoldieBall size={78} />
    </button>
  );
}

// coach: { paths, targetIdx, starters, firstName } on the Passport page; absent everywhere else.
export default function Goldie({ coach }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState(null);
  const [tour, setTour] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modeRequest, setModeRequest] = useState(null);
  const [signedIn, setSignedIn] = useState(null);
  const [howOpen, setHowOpen] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);
  const [cheer, setCheer] = useState(null); // { count } while Goldie celebrates new proof
  const [news, setNews] = useState(null); // { count, withProof, query, word, since } for "new since you left"
  const newsChecked = useRef(false);
  const skin = useGoldieSkin();
  const hidden = !coach && pathname === "/profile"; // the Passport page renders its own Goldie with the coach

  // Spotlight: scroll to a step and glow its card.
  const spotlight = useCallback((id) => {
    document.querySelectorAll(".goldie-spot").forEach((el) => el.classList.remove("goldie-spot"));
    const head = document.getElementById(id);
    if (!head) return false;
    head.scrollIntoView({ behavior: "smooth", block: "start" });
    const card = head.nextElementSibling;
    if (card) card.classList.add("goldie-spot");
    return true;
  }, []);

  useEffect(() => {
    if (hidden) return;
    if (coach) {
      if (!store.get("goldie-welcomed")) {
        const t = setTimeout(() => setBubble("welcome"), 1200);
        return () => clearTimeout(t);
      }
    } else {
      createClient().auth.getSession().then(({ data }) => setSignedIn(!!data.session));
      if (!store.get("goldie-hello")) {
        const t = setTimeout(() => setBubble("hello"), 1500);
        return () => clearTimeout(t);
      }
    }
  }, [coach, hidden]);

  useEffect(() => {
    if (hidden) return;
    const onOpen = (e) => { setTour(null); setBubble(null); setOpen(true); if (e.detail && e.detail.mode) setModeRequest({ mode: e.detail.mode, at: Date.now() }); };
    const onTour = () => { setOpen(false); setBubble(null); setTour(0); };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); setTour(null); } };
    window.addEventListener("goldie:open", onOpen);
    window.addEventListener("goldie:tour", onTour);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("goldie:open", onOpen); window.removeEventListener("goldie:tour", onTour); window.removeEventListener("keydown", onKey); };
  }, [hidden]);

  // New proof anywhere on the page (proof builder, plan steps): Goldie bounces and counts it.
  useEffect(() => {
    if (hidden) return;
    let t;
    const onCheer = (e) => { setCheer({ count: (e.detail && e.detail.count) || 0 }); clearTimeout(t); t = setTimeout(() => setCheer(null), 4500); };
    window.addEventListener("goldie:cheer", onCheer);
    return () => { window.removeEventListener("goldie:cheer", onCheer); clearTimeout(t); };
  }, [hidden]);

  // "New since you left": once per page load, compare with the last visit saved in this browser.
  useEffect(() => {
    if (!coach || !coach.hasProfile || newsChecked.current) return;
    newsChecked.current = true;
    const last = store.get("goldie-last-visit");
    store.set("goldie-last-visit", new Date().toISOString());
    if (!last || !store.get("goldie-welcomed")) return;
    newSince(last).then((res) => { if (res && res.count > 0) { setNews({ ...res, since: last }); setBubble((b) => b || "news"); } }).catch(() => {});
  }, [coach]);

  useEffect(() => {
    if (tour === null) { document.querySelectorAll(".goldie-spot").forEach((el) => el.classList.remove("goldie-spot")); return; }
    if (TOUR[tour][0]) spotlight(TOUR[tour][0]);
    else document.querySelectorAll(".goldie-spot").forEach((el) => el.classList.remove("goldie-spot"));
  }, [tour, spotlight]);

  if (hidden) return null;

  const closeBubble = () => { store.set(coach ? "goldie-welcomed" : "goldie-hello", "1"); setBubble(null); };
  const startTour = () => { closeBubble(); setOpen(false); setTour(0); };

  // Runs a page action Goldie's answer asked for. Only these known names do anything.
  function onAction(action) {
    if (action === "start_tour") return startTour();
    // Job searches show their postings inside the chat, so the page stays where it is.
    if (!SECTIONS[action]) return;
    spotlight(SECTIONS[action]);
    // On a phone the panel covers the page, so step aside and leave a note.
    if (window.innerWidth < 760) { setOpen(false); setBubble("moved"); }
  }

  // Takes the user to the proof builder in step 1.
  function openProofBuilder() {
    setOpen(false);
    const box = document.querySelector(".proof-builder");
    if (!box) return spotlight("passport");
    box.scrollIntoView({ behavior: "smooth", block: "center" });
    box.classList.add("goldie-spot");
    setTimeout(() => { box.classList.remove("goldie-spot"); document.getElementById("pb-input")?.focus({ preventScroll: true }); }, 700);
  }

  function showNews() {
    setBubble(null);
    window.dispatchEvent(new CustomEvent("goldie:search", { detail: { query: news.query } }));
    document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const sinceText = (iso) => {
    const d = new Date(iso);
    const days = (Date.now() - d.getTime()) / 86400000;
    return days < 1 ? "earlier today" : days < 7 ? `${d.toLocaleDateString("en-US", { weekday: "long" })}` : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const step = tour !== null ? TOUR[tour] : null;
  const name = coach && coach.firstName;

  return (
    <div className="goldie">
      {/* Kept mounted while closed, so the chat isn't lost when Goldie is minimised. */}
      {(open || coach) && (
        <div className="goldie-panel" role="dialog" aria-label="Goldie, your guide" hidden={!open}>
          <div className="goldie-panel-head">
            <GoldieBall size={40} talking={busy} />
            <div><strong>Goldie</strong><small className="goldie-sub">Your sports career guide</small></div>
            <button type="button" className="goldie-look-btn" onClick={() => setLookOpen(!lookOpen)} aria-expanded={lookOpen}>Look</button>
            <button type="button" className="goldie-close" onClick={() => setOpen(false)} aria-label="Close Goldie">×</button>
          </div>
          {lookOpen && (
            <div className="goldie-looks" role="group" aria-label="Choose Goldie's look">
              {SKINS.map(([k, l]) => (
                <button type="button" key={k} className={skin === k ? "on" : ""} aria-pressed={skin === k} onClick={() => pickSkin(k)}>
                  <GoldieBall size={34} skin={k} /><small>{l}</small>
                </button>
              ))}
            </div>
          )}
          {coach ? (
            <>
              <div className="chips goldie-quick">
                <button type="button" onClick={startTour}>Give me the tour</button>
                <button type="button" onClick={openProofBuilder}>Turn something I did into proof</button>
              </div>
              <CoachChat compact paths={coach.paths} targetIdx={coach.targetIdx} starters={coach.starters} onAction={onAction} onBusy={setBusy} modeRequest={modeRequest} />
            </>
          ) : signedIn ? (
            <div className="goldie-script">
              <p>Welcome back! Your Passport, matches, jobs and plan are all on one page, and I can answer questions there.</p>
              <a className="cta" href="/profile">Open my Passport →</a>
            </div>
          ) : (
            <div className="goldie-script">
              <p>Hi, I&apos;m Goldie! I help anyone heading into the sports industry find careers they fit and prove it.</p>
              <GuestButton className="guest-btn">Try it now as a guest</GuestButton>
              <button type="button" className="ghost" onClick={() => setHowOpen(!howOpen)} aria-expanded={howOpen}>How does it work?</button>
              {howOpen && (
                <ol className="goldie-how">
                  <li>Fill in your Sports Passport: what you&apos;ve done, one achievement per line.</li>
                  <li>See your sports career matches and real jobs and internships, each with a fit check.</li>
                  <li>Follow your plan and share one proof link with employers.</li>
                </ol>
              )}
              <p><small>Already have an account? <a href="/#start" onClick={() => setOpen(false)}>Sign in</a></small></p>
            </div>
          )}
        </div>
      )}

      {!open && (step || bubble || cheer) && (
        <div className={cheer && !step ? "goldie-bubble goldie-cheer" : "goldie-bubble"} role="status">
          {cheer && !step ? (
            <p><strong>{cheer.count ? `Proof #${cheer.count}!` : "New proof!"}</strong> Nice work{name ? `, ${name}` : ""}. Your matches and fit checks just got stronger.</p>
          ) : step ? (
            <>
              <p><small className="muted">Tour {tour + 1} of {TOUR.length}</small><br />{step[1]}</p>
              <div className="goldie-bubble-actions">
                <button type="button" className="ghost mini" onClick={() => setTour(null)}>End tour</button>
                {tour > 0 && <button type="button" className="ghost mini" onClick={() => setTour(tour - 1)}>Back</button>}
                {tour < TOUR.length - 1
                  ? <button type="button" className="mini" onClick={() => setTour(tour + 1)}>Next</button>
                  : <button type="button" className="mini" onClick={() => { setTour(null); setOpen(true); }}>Ask me something</button>}
              </div>
            </>
          ) : bubble === "welcome" ? (
            <>
              <p>Hi{name ? ` ${name}` : ""}! I&apos;m Goldie, your sports career guide. Want a 30-second tour?</p>
              <div className="goldie-bubble-actions">
                <button type="button" className="ghost mini" onClick={closeBubble}>Not now</button>
                <button type="button" className="mini" onClick={startTour}>Show me around</button>
              </div>
            </>
          ) : bubble === "news" && news ? (
            <>
              <p>Welcome back{name ? `, ${name}` : ""}! <strong>{news.count} new {news.word} {news.count === 1 ? "job" : "jobs"}</strong> since {sinceText(news.since)}{news.withProof ? `, and you already have proof for ${news.withProof} of them` : ""}.</p>
              <div className="goldie-bubble-actions">
                <button type="button" className="ghost mini" onClick={() => setBubble(null)}>Later</button>
                <button type="button" className="mini" onClick={showNews}>Show me</button>
              </div>
            </>
          ) : bubble === "moved" ? (
            <>
              <p>Here it is! Tap me when you need me again.</p>
              <div className="goldie-bubble-actions"><button type="button" className="ghost mini" onClick={() => setBubble(null)}>OK</button></div>
            </>
          ) : (
            <>
              <p>Hi, I&apos;m Goldie! New to sports careers? I&apos;ll show you around.</p>
              <div className="goldie-bubble-actions">
                <button type="button" className="ghost mini" onClick={closeBubble}>Later</button>
                <button type="button" className="mini" onClick={() => { closeBubble(); setOpen(true); }}>Say hi</button>
              </div>
            </>
          )}
        </div>
      )}

      <button type="button" className="goldie-launch" onClick={() => { closeBubble(); setTour(null); setOpen(!open); }} aria-label={open ? "Close Goldie" : "Open Goldie, your guide"} aria-expanded={open}>
        <GoldieBall talking={busy} cheering={!!cheer} />
      </button>
    </div>
  );
}
