// LJ LIVE promo: a 19-second 9:16 ad drawn on a canvas from today's real feed (a featured game, today's
// game count and live count), so it never shows a made-up score. "Save as video" records one full run.

const W = 1080;
const H = 1920;
const DURATION = 19;
const SPORTS = ["soccer", "basketball", "football", "hockey", "baseball"];
const GOLD = ["#f6e1a6", "#e9c77b", "#c9974a", "#9c6f2f"];
const RED = "#ff3b3b";
const DISPLAY = '"Space Grotesk", Inter, sans-serif';
const BODY = "Inter, system-ui, sans-serif";

const canvas = document.getElementById("ad");
const ctx = canvas.getContext("2d");
let feed = { game: null, total: 0, live: 0 };
let start = performance.now();

// ---- helpers ----
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

function goldFill(x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  GOLD.forEach((c, i) => g.addColorStop(i / (GOLD.length - 1), c));
  return g;
}

function font(size, weight = 700, family = DISPLAY) {
  return `${weight} ${size}px ${family}`;
}

// Largest size up to `size` at which the text fits the width.
function fit(text, maxW, size, weight = 700, family = DISPLAY) {
  let s = size;
  ctx.font = font(s, weight, family);
  while (s > 20 && ctx.measureText(text).width > maxW) {
    s -= 4;
    ctx.font = font(s, weight, family);
  }
  return s;
}

function text(str, x, y, size, opts = {}) {
  const { weight = 700, family = DISPLAY, color = "#f3f1ea", align = "center", maxW = W - 140, alpha = 1 } = opts;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  fit(str, maxW, size, weight, family);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hex(c, fallback) {
  return c ? `#${c}` : fallback;
}

// ---- the feed ----
async function loadFeed() {
  const lists = await Promise.all(SPORTS.map((sp) =>
    fetch(`api/live?sport=${sp}`).then((r) => (r.ok ? r.json() : { games: [] })).catch(() => ({ games: [] }))));
  const all = lists.flatMap((d) => d.games || []);
  const live = all.filter((g) => g.state === "in");
  // Featured: a live game with goals if there is one, otherwise the latest finished game with goals.
  const scored = (g) => g.home.score + g.away.score > 0;
  const finished = all.filter((g) => g.state === "post").sort((a, b) => String(b.start).localeCompare(String(a.start)));
  const game = live.find(scored) || live[0] || finished.find(scored) || finished[0] || null;
  feed = { game, total: all.length, live: live.length };
}

function statusOf(g) {
  if (!g) return "";
  return g.state === "in" ? `LIVE · ${g.detail || g.clock}` : "FINAL";
}

// ---- background ----
function background(t) {
  ctx.fillStyle = "#050608";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, H * 0.75);
  glow.addColorStop(0, "rgba(233, 199, 123, 0.16)");
  glow.addColorStop(1, "rgba(5, 6, 8, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // Two stadium light beams sweeping slowly.
  [[-1, 0], [1, 1.7]].forEach(([side, phase]) => {
    const a = Math.sin(t * 0.7 + phase) * 0.18;
    ctx.save();
    ctx.translate(W / 2 + side * 520, -80);
    ctx.rotate(-side * 0.42 + a);
    const beam = ctx.createLinearGradient(0, 0, 0, H * 1.1);
    beam.addColorStop(0, "rgba(255, 244, 214, 0.20)");
    beam.addColorStop(1, "rgba(255, 244, 214, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(26, 0);
    ctx.lineTo(260, H * 1.1);
    ctx.lineTo(-260, H * 1.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  // Pitch lines.
  ctx.save();
  ctx.strokeStyle = "rgba(233, 199, 123, 0.10)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.62, 190, 0, Math.PI * 2);
  ctx.moveTo(60, H * 0.62);
  ctx.lineTo(W - 60, H * 0.62);
  ctx.stroke();
  ctx.restore();
}

// ---- scenes ----
function sceneHook(t) {
  const words = [["THE GAME", 0.15], ["CHANGES", 0.6], ["IN ONE", 1.05], ["SECOND.", 1.45]];
  words.forEach(([w, at], i) => {
    const p = prog(t, at, at + 0.35);
    if (!p) return;
    const scale = 1.5 - 0.5 * easeOut(p);
    ctx.save();
    ctx.translate(W / 2, 640 + i * 190);
    ctx.scale(scale, scale);
    const isLast = i === words.length - 1;
    text(w, 0, 0, 170, { color: isLast ? goldFill(-400, -80, 400, 80) : "#f3f1ea", alpha: p });
    ctx.restore();
  });
  const flash = prog(t, 2.35, 2.6);
  if (flash) {
    ctx.fillStyle = `rgba(255, 250, 235, ${Math.sin(flash * Math.PI) * 0.85})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function sceneScore(t) {
  const g = feed.game;
  const p = easeOut(prog(t, 0, 0.5));
  if (!g) {
    text("REAL GAMES.", W / 2, 840, 150, { alpha: p });
    text("EVERY DAY.", W / 2, 1010, 150, { color: goldFill(200, 940, 880, 1080), alpha: p });
    return;
  }
  const y = 960 + (1 - p) * 120;
  ctx.save();
  ctx.globalAlpha = p;
  text(String(g.leagueName || "").toUpperCase(), W / 2, y - 420, 48, { family: BODY, weight: 800, color: GOLD[1] });
  // Status pill.
  const status = statusOf(g);
  ctx.font = font(40, 800, BODY);
  const pw = ctx.measureText(status).width + 110;
  roundRect(W / 2 - pw / 2, y - 340, pw, 76, 38);
  ctx.fillStyle = g.state === "in" ? RED : "rgba(255, 255, 255, 0.12)";
  ctx.fill();
  if (g.state === "in") {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + 0.5 * Math.sin(t * 8)})`;
    ctx.beginPath();
    ctx.arc(W / 2 - pw / 2 + 40, y - 302, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  text(status, W / 2 + (g.state === "in" ? 16 : 0), y - 301, 40, { family: BODY, weight: 800 });
  text(g.home.name.toUpperCase(), W / 2, y - 190, 88);
  const sp = easeBack(prog(t, 0.35, 0.85));
  ctx.save();
  ctx.translate(W / 2, y + 10);
  ctx.scale(sp, sp);
  text(`${g.home.score}  –  ${g.away.score}`, 0, 0, 280, { color: goldFill(-420, -140, 420, 140) });
  ctx.restore();
  text(g.away.name.toUpperCase(), W / 2, y + 210, 88);
  ctx.restore();
  // Clutch points up at the real score.
  if (typeof clutchBand === "function") {
    ctx.save();
    ctx.translate(W / 2, 1500);
    clutchBand(ctx, { act: "pointup", say: "Real game. Real score." }, t, W - 120);
    ctx.restore();
  } else {
    text("Real game. Real score.", W / 2, 1520, 56, { family: BODY, weight: 700, color: "#c9cbd1", alpha: prog(t, 1.2, 1.7) });
  }
}

function postCard(x, y, w, h, theme, g, t) {
  const themes = {
    breaking: { bg: "#0b0c10", band: RED, label: "BREAKING", ink: "#ffffff", score: "#ffffff" },
    hype: { bg: "#0b0c10", band: GOLD[1], label: "WHAT A GAME", ink: "#f3f1ea", score: GOLD[1] },
    clean: { bg: "#f5f3ee", band: "#14110a", label: "FULL TIME", ink: "#14110a", score: "#14110a" },
    team: { bg: hex(g && g.home.color, "#16213a"), band: "#ffffff", label: "MATCH DAY", ink: "#ffffff", score: "#ffffff" }
  };
  const th = themes[theme];
  ctx.save();
  roundRect(x, y, w, h, 36);
  ctx.clip();
  ctx.fillStyle = th.bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = th.band;
  ctx.fillRect(x, y + h * 0.16, w, h * 0.09);
  text(th.label, x + w / 2, y + h * 0.205, h * 0.05, { color: theme === "hype" || theme === "team" ? "#14110a" : "#ffffff", maxW: w - 60 });
  if (g) {
    text(g.home.name.toUpperCase(), x + w / 2, y + h * 0.38, h * 0.05, { color: th.ink, maxW: w - 60 });
    text(`${g.home.score} – ${g.away.score}`, x + w / 2, y + h * 0.5, h * 0.12, { color: th.score, maxW: w - 60 });
    text(g.away.name.toUpperCase(), x + w / 2, y + h * 0.62, h * 0.05, { color: th.ink, maxW: w - 60 });
    text(statusOf(g), x + w / 2, y + h * 0.71, h * 0.03, { family: BODY, weight: 800, color: th.ink, alpha: 0.75, maxW: w - 60 });
  } else {
    text("YOUR GAME", x + w / 2, y + h * 0.5, h * 0.07, { color: th.ink, maxW: w - 60 });
  }
  text("Made by @ljsoccer01", x + w / 2, y + h * 0.92, h * 0.026, { family: BODY, weight: 700, color: th.ink, alpha: 0.6, maxW: w - 60 });
  ctx.restore();
}

function scenePhone(t) {
  const g = feed.game;
  const rise = easeOut(prog(t, 0, 0.6));
  const pw = 560;
  const ph = 1100;
  const px = W / 2 - pw / 2;
  const py = 560 + (1 - rise) * 900;
  text("TURN IT INTO A POST.", W / 2, 300, 92, { alpha: prog(t, 0, 0.4) });
  text("IN SECONDS.", W / 2, 420, 92, { color: goldFill(250, 380, 830, 460), alpha: prog(t, 2.5, 2.9) });
  // Phone body.
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 60;
  roundRect(px - 22, py - 22, pw + 44, ph + 44, 70);
  ctx.fillStyle = "#1a1c22";
  ctx.fill();
  ctx.restore();
  postCard(px, py, pw, ph, "breaking", g, t);
  // Progress, then posted.
  const build = prog(t, 0.8, 2.4);
  if (build < 1) {
    roundRect(px + 60, py + ph - 190, pw - 120, 22, 11);
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fill();
    roundRect(px + 60, py + ph - 190, (pw - 120) * easeOut(build), 22, 11);
    ctx.fillStyle = goldFill(px, 0, px + pw, 0);
    ctx.fill();
    text("Creating video…", W / 2, py + ph - 240, 34, { family: BODY, weight: 700, alpha: build ? 1 : 0 });
  } else {
    const s = easeBack(prog(t, 2.4, 2.8));
    ctx.save();
    ctx.translate(W / 2, py + ph - 200);
    ctx.scale(s, s);
    roundRect(-220, -48, 440, 96, 48);
    ctx.fillStyle = "#2fbf71";
    ctx.fill();
    text("✓ Ready to post", 0, 2, 40, { family: BODY, weight: 800 });
    ctx.restore();
  }
}

function sceneStyles(t) {
  const order = ["hype", "breaking", "clean", "team"];
  const i = Math.min(order.length - 1, Math.floor(t / 0.75));
  const local = t - i * 0.75;
  const s = 0.92 + 0.08 * easeOut(prog(local, 0, 0.25));
  const cw = 680;
  const ch = 1210;
  ctx.save();
  ctx.translate(W / 2, 880);
  ctx.scale(s, s);
  postCard(-cw / 2, -ch / 2, cw, ch, order[i], feed.game, t);
  ctx.restore();
  text("4 STYLES · AUTO VIDEOS", W / 2, 1640, 70, { color: goldFill(150, 1600, 930, 1680) });
}

function sceneStats(t) {
  const rows = [];
  if (feed.total) rows.push([String(Math.round(feed.total * easeOut(prog(t, 0, 1.1)))), "GAMES IN TODAY'S FEED"]);
  if (feed.live) rows.push([String(feed.live), feed.live === 1 ? "GAME LIVE RIGHT NOW" : "GAMES LIVE RIGHT NOW"]);
  rows.push(["5", "SPORTS"], ["10", "LANGUAGES"]);
  const top = 960 - (rows.length - 1) * 165;
  rows.forEach(([big, small], i) => {
    const p = easeOut(prog(t, i * 0.35, i * 0.35 + 0.4));
    const y = top + i * 330 + (1 - p) * 60;
    text(big, W / 2, y - 40, 190, { color: goldFill(300, y - 120, 780, y + 40), alpha: p });
    text(small, W / 2, y + 95, 52, { family: BODY, weight: 800, alpha: p });
  });
}

function sceneEnd(t) {
  const p = easeOut(prog(t, 0, 0.6));
  const s = 0.85 + 0.15 * p;
  ctx.save();
  ctx.translate(W / 2, 800);
  ctx.scale(s, s);
  ctx.globalAlpha = p;
  // "LJ ● LIVE", laid out from measured widths so the dot sits in the gap.
  ctx.font = font(230);
  const lj = ctx.measureText("LJ").width;
  const lv = ctx.measureText("LIVE").width;
  const gap = 110;
  const x0 = -(lj + gap + lv) / 2;
  text("LJ", x0, 0, 230, { align: "left", color: goldFill(x0, -100, x0 + lj, 100), maxW: W });
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(x0 + lj + gap / 2, 14, 24 + 5 * Math.sin(t * 6), 0, Math.PI * 2);
  ctx.fill();
  text("LIVE", x0 + lj + gap, 0, 230, { align: "left", color: goldFill(x0 + lj + gap, -100, x0 + lj + gap + lv, 100), maxW: W });
  ctx.restore();
  text("Post it first.", W / 2, 1060, 100, { alpha: prog(t, 0.4, 0.9) });
  text("lj-live.vercel.app", W / 2, 1220, 64, { family: BODY, weight: 800, color: GOLD[1], alpha: prog(t, 0.8, 1.2) });
  text("Live scores free · 3 posts a day free", W / 2, 1320, 42, { family: BODY, weight: 700, color: "#c9cbd1", alpha: prog(t, 1.1, 1.5) });
  text("by LJSOCCER · @ljsoccer01", W / 2, 1720, 38, { family: BODY, weight: 700, color: "#9da1ab", alpha: prog(t, 1.2, 1.6) });
}

const SCENES = [
  [0, 2.6, sceneHook],
  [2.6, 6.2, sceneScore],
  [6.2, 10.4, scenePhone],
  [10.4, 13.4, sceneStyles],
  [13.4, 16.2, sceneStats],
  [16.2, DURATION, sceneEnd]
];

function draw(t) {
  background(t);
  const scene = SCENES.find(([a, b]) => t >= a && t < b) || SCENES[SCENES.length - 1];
  const local = t - scene[0];
  // Quick fade between scenes.
  const fadeIn = prog(local, 0, 0.18);
  const fadeOut = 1 - prog(t, scene[1] - 0.18, scene[1]);
  ctx.save();
  ctx.globalAlpha = Math.min(fadeIn, fadeOut);
  scene[2](local);
  ctx.restore();
}

function frame(now) {
  const t = ((now - start) / 1000) % DURATION;
  draw(t);
  requestAnimationFrame(frame);
}

// ---- controls ----
document.getElementById("replay").addEventListener("click", () => (start = performance.now()));

const recordBtn = document.getElementById("record");
const note = document.getElementById("note");
function videoType() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) || "";
}
recordBtn.addEventListener("click", () => {
  const type = videoType();
  if (!type || !canvas.captureStream) {
    note.textContent = "This browser can't record video. Try Chrome or Safari on a computer.";
    return;
  }
  recordBtn.disabled = true;
  recordBtn.textContent = "Recording… 19s";
  const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: type, videoBitsPerSecond: 8000000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    const blob = new Blob(chunks, { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lj-live-promo.${type.includes("mp4") ? "mp4" : "webm"}`;
    a.click();
    recordBtn.disabled = false;
    recordBtn.textContent = "Save as video";
  };
  start = performance.now();
  rec.start();
  setTimeout(() => rec.stop(), DURATION * 1000);
});

Promise.all([
  document.fonts.load('700 100px "Space Grotesk"'),
  document.fonts.load("800 100px Inter"),
  loadFeed().catch(() => {})
]).finally(() => {
  start = performance.now();
  requestAnimationFrame(frame);
});
