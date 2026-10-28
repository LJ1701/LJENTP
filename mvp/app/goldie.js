"use client";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CoachChat from "./profile/coach-chat";
import GuestButton from "./guest-button";

// Goldie: LJSportMind's guide, an original gold ball mascot in the logo colours (octagon from the logo,
// seams from every sport). On the Passport page Goldie is the AI coach and can move the page for the user;
// on other pages Goldie gives a short scripted welcome (no AI call, so no Gemini quota is used).

const TOUR = [
  ["passport", "This is your Sports Passport. Fill in who you are, then add achievements, one per line. They're your proof."],
  ["matches", "Your career matches land here: the skills you have for each path, and what's still missing."],
  ["jobs", "Live sports jobs. Type what you want, like \"NBA jobs\", then press Fit check on any listing."],
  ["plan", "Pick a target role and your plan appears here. Tick steps off as you go."],
  ["coach", "That's me! Ask me anything, or practise an interview for your target role."],
  ["proof", "Turn on your proof link and paste it into applications. You can switch it off any time."]
];
const SECTIONS = { go_passport: "passport", go_matches: "matches", go_jobs: "jobs", go_plan: "plan", go_coach: "coach", go_proof: "proof" };

const store = {
  get: (k) => { try { return window.localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { window.localStorage.setItem(k, v); } catch {} }
};

export function GoldieBall({ talking = false, size = 64 }) {
  return (
    <svg className={`goldie-ball${talking ? " talking" : ""}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="goldie-gold" cx="36%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="35%" stopColor="#f0cf7f" />
          <stop offset="72%" stopColor="#c9974a" />
          <stop offset="100%" stopColor="#7d5520" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#goldie-gold)" stroke="#5c3f15" strokeWidth="1.5" />
      {/* Seams: basketball and football curves on the sides */}
      <path d="M21 15 Q35 50 21 85" fill="none" stroke="#1a1206" strokeOpacity="0.5" strokeWidth="2.2" />
      <path d="M79 15 Q65 50 79 85" fill="none" stroke="#1a1206" strokeOpacity="0.5" strokeWidth="2.2" />
      <path d="M8 46 Q14 44 18 40 M92 46 Q86 44 82 40" fill="none" stroke="#1a1206" strokeOpacity="0.4" strokeWidth="1.8" />
      {/* The LJSportMind octagon on top, like a soccer ball panel */}
      <polygon points="50,10 57,13 60,20 57,27 50,30 43,27 40,20 43,13" fill="#101218" stroke="#e9c77b" strokeWidth="1.6" />
      <polygon points="50,15 54,17 55.5,20 54,23 50,25 46,23 44.5,20 46,17" fill="none" stroke="#e9c77b" strokeOpacity="0.7" strokeWidth="1" />
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
        : <path d="M43 65 Q50 71 57 65" fill="none" stroke="#1a1206" strokeWidth="2.4" strokeLinecap="round" />}
    </svg>
  );
}

// Buttons elsewhere on the page that open Goldie (optionally straight into interview practice).
export function GoldieButtons({ canInterview }) {
  const open = (mode) => window.dispatchEvent(new CustomEvent("goldie:open", { detail: { mode } }));
  return (
    <div className="job-actions">
      <button type="button" onClick={() => open("ask")}>Ask Goldie</button>
      <button type="button" className="ghost" onClick={() => open("interview")} disabled={!canInterview} title={canInterview ? "" : "Pick a target role first"}>Practise an interview</button>
      <button type="button" className="ghost" onClick={() => window.dispatchEvent(new CustomEvent("goldie:tour"))}>Take the tour</button>
    </div>
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

  useEffect(() => {
    if (tour === null) { document.querySelectorAll(".goldie-spot").forEach((el) => el.classList.remove("goldie-spot")); return; }
    spotlight(TOUR[tour][0]);
  }, [tour, spotlight]);

  if (hidden) return null;

  const closeBubble = () => { store.set(coach ? "goldie-welcomed" : "goldie-hello", "1"); setBubble(null); };
  const startTour = () => { closeBubble(); setOpen(false); setTour(0); };

  // Runs a page action Goldie's answer asked for. Only these known names do anything.
  function onAction(action, query) {
    if (action === "start_tour") return startTour();
    const small = window.innerWidth < 760;
    if (action === "search_jobs") {
      window.dispatchEvent(new CustomEvent("goldie:search", { detail: { query: query || "sports jobs" } }));
      spotlight("jobs");
    } else if (SECTIONS[action]) {
      spotlight(SECTIONS[action]);
    } else return;
    // On a phone the panel covers the page, so step aside and leave a note.
    if (small) { setOpen(false); setBubble("moved"); }
  }

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
            <button type="button" className="goldie-close" onClick={() => setOpen(false)} aria-label="Close Goldie">×</button>
          </div>
          {coach ? (
            <>
              <div className="chips goldie-quick">
                <button type="button" onClick={startTour}>Give me the tour</button>
              </div>
              <CoachChat compact paths={coach.paths} targetIdx={coach.targetIdx} starters={coach.starters} onAction={onAction} onBusy={setBusy} modeRequest={modeRequest} />
            </>
          ) : signedIn ? (
            <div className="goldie-script">
              <p>Welcome back! Your Passport, matches, live jobs and plan are all on one page, and I can answer questions there.</p>
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
                  <li>See your sports career matches and real jobs hiring now, each with a fit check.</li>
                  <li>Follow your plan and share one proof link with employers.</li>
                </ol>
              )}
              <p><small>Already have an account? <a href="/#start" onClick={() => setOpen(false)}>Sign in</a></small></p>
            </div>
          )}
        </div>
      )}

      {!open && (step || bubble) && (
        <div className="goldie-bubble" role="status">
          {step ? (
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
        <GoldieBall talking={busy} />
      </button>
    </div>
  );
}
