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

function generateScript(data, out) {
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
      text: out.question + " Follow for more breakdowns like this."
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
