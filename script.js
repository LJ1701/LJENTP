const TEMPLATES = {
  comeback: {
    hook: [
      "Nobody expected {teamA} to walk away with this one after going down early.",
      "{teamA} looked finished — until they weren't.",
      "This is how you erase a deficit: {teamA} vs {teamB}."
    ],
    video: [
      "Frame-by-frame breakdown of the exact moment {teamA} flipped the game around.",
      "\"The Turning Point\" — a 45-second recap of {keyMoment}.",
      "React to the comeback: play the clip of {keyMoment} and freeze on the reactions."
    ],
    question: [
      "Did {teamB} choke, or did {teamA} just want it more?",
      "What was the real turning point — {keyMoment}, or something earlier?"
    ],
    caption: [
      "{teamA} {scoreA} - {scoreB} {teamB}. Down and out? Not this time. 🔥 #{teamATag} #{teamBTag} #Comeback"
    ]
  },
  blowout: {
    hook: [
      "{teamA} didn't just beat {teamB} — they sent a message.",
      "{scoreA} - {scoreB}. There's no other way to say it: a statement win for {teamA}."
    ],
    video: [
      "Top 3 plays from {teamA}'s domination, built around {keyMoment}.",
      "\"How did this get so out of hand?\" — quick explainer on {keyMoment}."
    ],
    question: [
      "Is {teamB} in trouble after a result like this, or was this just an off night?",
      "Was {keyMoment} the moment this game got out of reach?"
    ],
    caption: [
      "{teamA} {scoreA} - {scoreB} {teamB}. Total domination. #{teamATag} #{teamBTag} #Highlights"
    ]
  },
  buzzer: {
    hook: [
      "With seconds left, {teamA} did the unthinkable.",
      "{teamA} vs {teamB} came down to the final possession — and it did not disappoint."
    ],
    video: [
      "Slow-motion replay of {keyMoment} with a countdown clock overlay.",
      "\"Where were you when this happened?\" — react to {keyMoment}."
    ],
    question: [
      "Best last-minute moment you've seen this season — does {keyMoment} top your list?",
      "Was {teamB}'s defense on that final play a coaching issue or just bad luck?"
    ],
    caption: [
      "{teamA} {scoreA} - {scoreB} {teamB}. Down to the wire. 😱 #{teamATag} #{teamBTag} #ClutchTime"
    ]
  },
  upset: {
    hook: [
      "Nobody had {teamA} winning this one. Nobody.",
      "{teamA} just shocked everyone by taking down {teamB}."
    ],
    video: [
      "\"The Upset\" — recap video built around {keyMoment}.",
      "Reaction video: watching {teamB} fans process {keyMoment} live."
    ],
    question: [
      "Biggest upset of the season so far — does this result change how you rank these teams?",
      "Was {teamB} overrated all along?"
    ],
    caption: [
      "{teamA} {scoreA} - {scoreB} {teamB}. Did NOT see that coming. #{teamATag} #{teamBTag} #Upset"
    ]
  },
  controversial: {
    hook: [
      "This call is going to be the only thing anyone talks about from {teamA} vs {teamB}.",
      "Forget the score for a second — {keyMoment} is what everyone's arguing about."
    ],
    video: [
      "Multi-angle breakdown of {keyMoment} — let the audience decide.",
      "\"Was this the right call?\" — slow-motion review of {keyMoment}."
    ],
    question: [
      "Right call or robbery? Give me your honest take on {keyMoment}.",
      "Does {keyMoment} change the result if the refs get it right?"
    ],
    caption: [
      "{teamA} {scoreA} - {scoreB} {teamB}. Everyone's talking about {keyMoment}. 👀 #{teamATag} #{teamBTag} #Controversy"
    ]
  },
  milestone: {
    hook: [
      "History was made in {teamA} vs {teamB}.",
      "This is a moment {teamA} fans will remember for a long time."
    ],
    video: [
      "Career-highlight style edit built around {keyMoment}.",
      "\"A Moment in History\" — short documentary-style clip on {keyMoment}."
    ],
    question: [
      "Where does {keyMoment} rank among the best moments you've seen this season?",
      "Does this milestone change how we should talk about this team/player?"
    ],
    caption: [
      "{teamA} {scoreA} - {scoreB} {teamB}. A moment for the history books. 🏆 #{teamATag} #{teamBTag} #Milestone"
    ]
  },
  close: {
    hook: [
      "{teamA} vs {teamB} went right down to the wire.",
      "Nobody could separate {teamA} and {teamB} until the very end."
    ],
    video: [
      "Back-and-forth recap: every key swing in {teamA} vs {teamB}, centered on {keyMoment}.",
      "\"How close was this game?\" — breakdown of {keyMoment} and what it meant."
    ],
    question: [
      "Did the right team win, or should this one have gone the other way?",
      "What was the real difference-maker — {keyMoment}, or something else?"
    ],
    caption: [
      "{teamA} {scoreA} - {scoreB} {teamB}. Instant classic. #{teamATag} #{teamBTag} #CloseGame"
    ]
  },
  other: {
    hook: [
      "{teamA} vs {teamB} gave us plenty to talk about.",
      "Here's what stood out from {teamA} vs {teamB}."
    ],
    video: [
      "Quick recap centered on {keyMoment}.",
      "Breakdown video: why {keyMoment} mattered."
    ],
    question: [
      "What did you make of {keyMoment}?",
      "How big of a deal is {keyMoment} in the bigger picture?"
    ],
    caption: [
      "{teamA} {scoreA} - {scoreB} {teamB}. #{teamATag} #{teamBTag} #Highlights"
    ]
  }
};

function tag(name) {
  return name.replace(/[^a-zA-Z0-9]/g, "");
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fill(str, data) {
  return str.replace(/\{(\w+)\}/g, (_, key) => data[key] ?? "");
}

function generate(data) {
  const set = TEMPLATES[data.momentType] || TEMPLATES.other;
  return {
    hook: fill(pick(set.hook), data),
    video: fill(pick(set.video), data),
    question: fill(pick(set.question), data),
    caption: fill(pick(set.caption), data)
  };
}

const GOAL_CTA = {
  media: "Follow for more breakdowns like this.",
  coach: "Save this if you coach — bring it to practice.",
  frontoffice: "Follow for more film breakdowns like this.",
  brand: "Follow along as I build this out.",
  analytics: "Follow for more data-backed takes.",
  explore: "Follow for more breakdowns like this."
};

function generateScript(data, out) {
  const passport = loadPassport();
  const ctaLine = GOAL_CTA[passport && passport.goal] || GOAL_CTA.explore;

  return [
    { time: "0:00–0:03", label: "Hook", text: out.hook },
    {
      time: "0:03–0:08",
      label: "Setup",
      text: `${data.teamA} ${data.scoreA} - ${data.scoreB} ${data.teamB}. Here's what happened.`
    },
    { time: "0:08–0:20", label: "The Moment", text: data.keyMoment + "." },
    {
      time: "0:20–0:28",
      label: "Your Take",
      text: data.observation || "This is exactly the kind of moment that decides games."
    },
    {
      time: "0:28–0:35",
      label: "CTA",
      text: out.question + " " + ctaLine
    }
  ];
}

const form = document.getElementById("gameForm");
const results = document.getElementById("results");
const regenBtn = document.getElementById("regenBtn");
const scriptList = document.getElementById("outScript");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const copyScriptBtn = document.getElementById("copyScriptBtn");
const ttsWarning = document.getElementById("ttsWarning");

const speechSupported = "speechSynthesis" in window;
if (!speechSupported) {
  playBtn.hidden = true;
  ttsWarning.hidden = false;
}

let lastData = null;
let lastScript = null;

function renderScript(beats) {
  scriptList.innerHTML = "";
  beats.forEach((beat) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="beat-label">${beat.label} <span class="beat-time">${beat.time}</span></span>${beat.text}`;
    scriptList.appendChild(li);
  });
}

function scriptToText(beats) {
  return beats.map((b) => b.text).join(" ");
}

function render() {
  const out = generate(lastData);
  document.getElementById("outHook").textContent = out.hook;
  document.getElementById("outVideo").textContent = out.video;
  document.getElementById("outQuestion").textContent = out.question;
  document.getElementById("outCaption").textContent = out.caption;

  lastScript = generateScript(lastData, out);
  renderScript(lastScript);

  results.hidden = false;
  regenBtn.hidden = false;
}

if (speechSupported) {
  playBtn.addEventListener("click", () => {
    if (!lastScript) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptToText(lastScript));
    utterance.rate = 1;
    utterance.onend = () => {
      playBtn.hidden = false;
      stopBtn.hidden = true;
    };
    window.speechSynthesis.speak(utterance);
    playBtn.hidden = true;
    stopBtn.hidden = false;
  });

  stopBtn.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    playBtn.hidden = false;
    stopBtn.hidden = true;
  });
}

copyScriptBtn.addEventListener("click", async () => {
  if (!lastScript) return;
  const text = lastScript.map((b) => `[${b.time}] ${b.label}: ${b.text}`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    const original = copyScriptBtn.textContent;
    copyScriptBtn.textContent = "Copied!";
    setTimeout(() => (copyScriptBtn.textContent = original), 1500);
  } catch {
    // clipboard access denied; nothing to fall back to in this MVP
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const teamA = document.getElementById("teamA").value.trim();
  const teamB = document.getElementById("teamB").value.trim();
  const scoreA = document.getElementById("scoreA").value;
  const scoreB = document.getElementById("scoreB").value;
  const sportTerm = document.getElementById("sport").value;
  const momentType = document.getElementById("momentType").value;
  const keyMoment = document.getElementById("keyMoment").value.trim();
  const observation = document.getElementById("observation").value.trim();

  lastData = {
    teamA, teamB, scoreA, scoreB, sportTerm, momentType, keyMoment, observation,
    teamATag: tag(teamA),
    teamBTag: tag(teamB)
  };

  render();
  results.scrollIntoView({ behavior: "smooth" });
});

regenBtn.addEventListener("click", () => {
  if (lastData) render();
});

// ---- Tab switching ----

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab + "Panel").classList.add("active");
  });
});

// ---- Sports Passport ----

const CAREER_PATHS = [
  {
    name: "Sports Content Creator",
    blurb: "Building an audience by turning games, players, and takes into short-form content.",
    nextStep: "Post one piece of content a week using the Creator Studio tab.",
    tags: ["video editing", "social media", "writing", "photography / design", "content creation", "personal brand building"]
  },
  {
    name: "Team Video / Media Analyst",
    blurb: "Breaking down film for a team or program to support coaching and player development.",
    nextStep: "Offer to cut film for a local club or college team to build a reel.",
    tags: ["video editing", "data & analytics", "coaching", "coaching & player development"]
  },
  {
    name: "Sports Journalist / Broadcaster",
    blurb: "Covering games and stories through writing or on-camera work.",
    nextStep: "Start a match-report or postgame recap series in your own voice.",
    tags: ["writing", "broadcasting / on-camera", "content creation", "journalism & broadcasting"]
  },
  {
    name: "Youth or Club Coach",
    blurb: "Developing players directly, using your own playing background.",
    nextStep: "Volunteer as an assistant coach with a local youth or club team.",
    tags: ["coaching", "playing experience", "event management", "coaching & player development"]
  },
  {
    name: "Scouting / Analytics",
    blurb: "Evaluating talent and performance using data and game knowledge.",
    nextStep: "Start logging your own scouting notes or stats on games you watch.",
    tags: ["data & analytics", "playing experience", "scouting & analytics"]
  },
  {
    name: "Marketing & Sponsorship",
    blurb: "Connecting brands, sponsors, and audiences within sports.",
    nextStep: "Study how a team or athlete you follow runs their sponsor content.",
    tags: ["marketing & sales", "social media", "content creation", "marketing & sponsorship"]
  },
  {
    name: "Event Operations",
    blurb: "Running the logistics behind games, tournaments, and sports events.",
    nextStep: "Volunteer to help run a local tournament or club event.",
    tags: ["event management", "event operations"]
  },
  {
    name: "Front Office / Team Operations",
    blurb: "Working behind the scenes for a team or organization.",
    nextStep: "Look for internship or part-time roles with local clubs or franchises.",
    tags: ["data & analytics", "marketing & sales", "event management", "playing experience", "front office / team ops"]
  }
];

const GOAL_TAGS = {
  media: ["content creation", "journalism & broadcasting"],
  coach: ["coaching & player development"],
  frontoffice: ["front office / team ops"],
  brand: ["personal brand building", "content creation"],
  analytics: ["scouting & analytics"],
  explore: []
};

const GOAL_LABELS = {
  media: "breaking into sports media / content",
  coach: "becoming a coach",
  frontoffice: "working in a team front office",
  brand: "building a personal brand",
  analytics: "becoming a scout / analyst",
  explore: "still exploring options"
};

const PASSPORT_KEY = "ljsportmind_passport";

function getCheckedValues(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map((el) => el.value);
}

function matchCareerPaths(userTags) {
  return CAREER_PATHS.map((path) => {
    const matched = path.tags.filter((t) => userTags.includes(t));
    return { ...path, score: matched.length, matched };
  })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function renderMatches(matches) {
  const list = document.getElementById("matchList");
  list.innerHTML = "";
  if (matches.length === 0) {
    list.innerHTML = `<div class="match-card"><p>Select a few more skills or interests to see career path matches.</p></div>`;
    return;
  }
  matches.forEach((m) => {
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = `
      <h4>${m.name}</h4>
      <p>${m.blurb}</p>
      <p><strong>Next step:</strong> ${m.nextStep}</p>
      <p class="matched-tags">Matched on: ${m.matched.join(", ")}</p>
    `;
    list.appendChild(div);
  });
}

function savePassport(data) {
  try {
    localStorage.setItem(PASSPORT_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable; nothing to persist
  }
}

function loadPassport() {
  try {
    const raw = localStorage.getItem(PASSPORT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyPassportToForm(data) {
  document.getElementById("pName").value = data.name || "";
  document.getElementById("pLocation").value = data.location || "";
  document.getElementById("pRole").value = data.role || "Player";
  document.getElementById("pGoal").value = data.goal || "explore";
  document.querySelectorAll("#pSkills input").forEach((el) => {
    el.checked = (data.skills || []).includes(el.value);
  });
  document.querySelectorAll("#pInterests input").forEach((el) => {
    el.checked = (data.interests || []).includes(el.value);
  });
}

const passportForm = document.getElementById("passportForm");
const passportResults = document.getElementById("passportResults");
const passportBanner = document.getElementById("passportBanner");

function renderPassportBanner(data) {
  if (!data || !data.name) {
    passportBanner.hidden = true;
    return;
  }
  passportBanner.textContent = `Tailored for ${data.name} — ${GOAL_LABELS[data.goal] || GOAL_LABELS.explore}`;
  passportBanner.hidden = false;
}

const savedPassport = loadPassport();
if (savedPassport) {
  applyPassportToForm(savedPassport);
  renderPassportBanner(savedPassport);
}

passportForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById("pName").value.trim(),
    location: document.getElementById("pLocation").value.trim(),
    role: document.getElementById("pRole").value,
    goal: document.getElementById("pGoal").value,
    skills: getCheckedValues("pSkills"),
    interests: getCheckedValues("pInterests")
  };

  savePassport(data);
  renderPassportBanner(data);

  const userTags = [...data.skills, ...data.interests, ...(GOAL_TAGS[data.goal] || [])];
  const matches = matchCareerPaths(userTags);

  const namePart = data.name ? data.name : "You";
  const locationPart = data.location ? ` based in ${data.location}` : "";
  document.getElementById("passportSummary").textContent =
    `${namePart}${locationPart}, currently a ${data.role.toLowerCase()}, working toward ${GOAL_LABELS[data.goal]}.`;

  renderMatches(matches);
  passportResults.hidden = false;
  passportResults.scrollIntoView({ behavior: "smooth" });
});
