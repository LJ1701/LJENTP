// LJ Body ID: the identity you start LJSportMind with. A ~20-second standing-still scan (front, then side)
// with on-device pose AI (MediaPipe) records your body's proportions and posture. The first scan is your
// Body ID (from LJ M.E.M.O.: a baseline only your body makes); later scans are compared with it.
// A health watch-list flags patterns worth watching or checking with a professional. It never diagnoses.
// Video never leaves the device: only the numbers below are saved, with the Sports Passport.

const MP_VERSION = "0.10.35";
const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
const MP_MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const BODY_KEY = "ljsportmind_bodyid";

// MediaPipe pose landmark indices (left/right are the person's own sides).
const LM = { nose: 0, lEar: 7, rEar: 8, lShoulder: 11, rShoulder: 12, lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28 };
const BODY_POINTS = [LM.nose, LM.lShoulder, LM.rShoulder, LM.lHip, LM.rHip, LM.lKnee, LM.rKnee, LM.lAnkle, LM.rAnkle];
const SKELETON = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
const DRAW_POINTS = [0, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

const MOVE_STEPS = [
  { kind: "front", key: "bidStepFront", secs: 7 },
  { kind: "side", key: "bidStepSide", secs: 7 }
];

// Body areas for the pain / past-injury check-in, and which watch-list area each feeds.
const BODY_AREAS = ["neck", "shoulder", "back", "hip", "knee", "ankle"];
const WATCH_AREAS = [
  { id: "posture", areas: ["back", "shoulder"], who: "whoDoctor" },
  { id: "neck", areas: ["neck"], who: "whoPhysio" },
  { id: "knees", areas: ["knee"], who: "whoPhysio" },
  { id: "weight", areas: ["hip"], who: "whoPhysio" },
  { id: "balance", areas: ["ankle"], who: "whoPhysio" }
];

const MOVE_HISTORY_MAX = 20;

// ---- Measurement (pure functions) ----

function seen(lm, indices) {
  return !!lm && indices.every((i) => lm[i] && (lm[i].visibility === undefined || lm[i].visibility > 0.5));
}

const CORE_POINTS = [LM.nose, LM.lShoulder, LM.rShoulder, LM.lHip, LM.rHip];
const LEG_POINTS = [LM.lKnee, LM.rKnee, LM.lAnkle, LM.rAnkle];

function bodyVisible(lm) {
  return seen(lm, BODY_POINTS);
}

function coreVisible(lm) {
  return seen(lm, CORE_POINTS);
}

function tiltDeg(left, right, aspect) {
  const dx = Math.abs(left.x - right.x) * aspect || 1e-6;
  return (Math.atan((left.y - right.y) / dx) * 180) / Math.PI;
}

// Front, standing still. In an unmirrored camera image the person's left side has the larger x.
// Positive tilt = the person's left side sits lower; positive offset/shift = toward the person's left.
function frontFeatures(lm, aspect) {
  const P = (i) => ({ x: lm[i].x * aspect, y: lm[i].y });
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const sh = mid(P(LM.lShoulder), P(LM.rShoulder));
  const hip = mid(P(LM.lHip), P(LM.rHip));
  const shoulderWidth = dist(P(LM.lShoulder), P(LM.rShoulder)) || 1e-6;
  const torso = dist(sh, hip) || 1e-6;
  const legsSeen = seen(lm, LEG_POINTS);
  const leg = legsSeen ? (dist(P(LM.lHip), P(LM.lKnee)) + dist(P(LM.lKnee), P(LM.lAnkle)) + dist(P(LM.rHip), P(LM.rKnee)) + dist(P(LM.rKnee), P(LM.rAnkle))) / 2 : 0;
  return {
    shoulderTilt: tiltDeg(lm[LM.lShoulder], lm[LM.rShoulder], aspect),
    hipTilt: tiltDeg(lm[LM.lHip], lm[LM.rHip], aspect),
    headOffset: (P(LM.nose).x - sh.x) / shoulderWidth,
    weightShift: legsSeen ? (hip.x - (P(LM.lAnkle).x + P(LM.rAnkle).x) / 2) / shoulderWidth : null,
    standingKnee: legsSeen ? Math.abs(lm[LM.lKnee].x - lm[LM.rKnee].x) / (Math.abs(lm[LM.lAnkle].x - lm[LM.rAnkle].x) || 1e-6) : null,
    frame: shoulderWidth / (dist(P(LM.lHip), P(LM.rHip)) || 1e-6),
    legs: legsSeen ? leg / torso : null,
    hipX: hip.x / shoulderWidth
  };
}

// Side profile: use whichever side faces the camera. "Forward" is where the nose points.
// Positive head angle = head ahead of the shoulder.
function sidePoints(lm) {
  const score = (ids) => ids.reduce((s, i) => s + ((lm[i] && lm[i].visibility) ?? 1), 0);
  const left = [LM.lEar, LM.lShoulder, LM.lHip, LM.lAnkle];
  const right = [LM.rEar, LM.rShoulder, LM.rHip, LM.rAnkle];
  return score(left) >= score(right) ? left : right;
}

function sideVisible(lm) {
  return !!lm && seen(lm, [LM.nose, ...sidePoints(lm)]);
}

function sideFeatures(lm, aspect) {
  const [ear, shoulder, hip] = sidePoints(lm).map((i) => lm[i]);
  const facing = lm[LM.nose].x >= ear.x ? 1 : -1;
  const deg = (dx, dy) => (Math.atan2(dx * aspect * facing, dy || 1e-6) * 180) / Math.PI;
  return {
    headAngle: deg(ear.x - shoulder.x, shoulder.y - ear.y),
    trunkLean: deg(shoulder.x - hip.x, hip.y - shoulder.y)
  };
}

function median(xs) {
  const sorted = xs.slice().sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}

const round1 = (x) => Math.round(x * 10) / 10;
const round2 = (x) => Math.round(x * 100) / 100;

// Medians are robust to a stray frame; steadiness is how little the hips drift while standing still.
function analyzeFront(frames) {
  if (frames.length < 5) return null;
  const hips = frames.map((f) => f.hipX);
  const mean = hips.reduce((a, b) => a + b, 0) / hips.length;
  const drift = Math.sqrt(hips.reduce((a, b) => a + (b - mean) ** 2, 0) / hips.length);
  const m = (k) => median(frames.map((f) => f[k]));
  // Leg measurements only count when the legs were in view for a good share of the frames.
  const legFrames = frames.filter((f) => f.legs !== null);
  const ml = (k) => (legFrames.length >= Math.max(5, frames.length / 3) ? median(legFrames.map((f) => f[k])) : null);
  const opt = (v, fn) => (v === null ? null : fn(v));
  return {
    shoulderTilt: round1(m("shoulderTilt")),
    hipTilt: round1(m("hipTilt")),
    headOffset: Math.round(100 * m("headOffset")),
    weightShift: opt(ml("weightShift"), (v) => Math.round(100 * v)),
    standingKnee: opt(ml("standingKnee"), round2),
    frame: round2(m("frame")),
    legs: opt(ml("legs"), round2),
    steadiness: round1(drift * 100)
  };
}

function analyzeSide(frames) {
  if (frames.length < 5) return null;
  return {
    headAngle: Math.round(median(frames.map((f) => f.headAngle))),
    trunkLean: Math.round(median(frames.map((f) => f.trunkLean)))
  };
}

const has = (v) => v !== null && v !== undefined;

function buildBodySnapshot(results, at, checkin) {
  const front = results.front || {};
  const side = results.side || {};
  const pick = (obj, key) => (has(obj[key]) ? obj[key] : null);
  const snap = { at, pain: (checkin && checkin.pain) || [], injury: (checkin && checkin.injury) || [] };
  ["shoulderTilt", "hipTilt", "headOffset", "weightShift", "standingKnee", "frame", "legs", "steadiness"].forEach((k) => (snap[k] = pick(front, k)));
  ["headAngle", "trunkLean"].forEach((k) => (snap[k] = pick(side, k)));
  return snap;
}

function metricValue(snap, metric) {
  if (metric.endsWith("Abs")) {
    const v = snap[metric.slice(0, -3)];
    return has(v) ? Math.abs(v) : null;
  }
  return has(snap[metric]) ? snap[metric] : null;
}

// Health watch-list: level 0 = looks typical, 1 = worth watching, 2 = worth a professional check,
// null = not measured. Thresholds are rough screening guides for phone-camera numbers.
function bodyFlags(snap) {
  const tier = (v, ok, watch, lowerIsBetter = true) => {
    if (!has(v)) return null;
    if (lowerIsBetter) return v <= ok ? 0 : v <= watch ? 1 : 2;
    return v >= ok ? 0 : v >= watch ? 1 : 2;
  };
  const tilt = has(snap.shoulderTilt) ? Math.max(Math.abs(snap.shoulderTilt), Math.abs(snap.hipTilt)) : null;
  const levels = {
    posture: tier(tilt, 3, 5),
    // Head-forward posture and a little sway are common; on their own they stay "worth watching".
    neck: has(snap.headAngle) ? Math.min(1, tier(snap.headAngle, 15, 25)) : null,
    knees: tier(snap.standingKnee, 0.85, 0.75, false),
    weight: has(snap.weightShift) ? tier(Math.abs(snap.weightShift), 10, 25) : null,
    balance: has(snap.steadiness) ? Math.min(1, tier(snap.steadiness, 3, 6)) : null
  };
  const pain = snap.pain || [];
  const injury = snap.injury || [];
  return WATCH_AREAS.map(({ id, areas, who }) => {
    let level = levels[id];
    const hurts = areas.some((a) => pain.includes(a));
    const injured = areas.some((a) => injury.includes(a));
    if (injured) level = Math.max(level ?? 0, 1);
    if (hurts) level = 2;
    return { id, who, level, pain: hurts, injury: injured };
  });
}

// Changes since the baseline that are big enough to notice. dir: +1 = higher is better, -1 = lower is better.
const MEMORY_METRICS = [
  ["shoulderTiltAbs", -1, 3], ["hipTiltAbs", -1, 3], ["headAngle", -1, 8],
  ["weightShiftAbs", -1, 10], ["standingKnee", 1, 0.1], ["steadiness", -1, 3]
];

function memoryChanges(base, now) {
  const worse = [], better = [];
  MEMORY_METRICS.forEach(([metric, dir, size]) => {
    const a = metricValue(base, metric), b = metricValue(now, metric);
    if (a === null || b === null) return;
    const delta = (b - a) * dir;
    if (delta <= -size) worse.push({ metric, a, b });
    else if (delta >= size) better.push({ metric, a, b });
  });
  return { worse, better };
}

// 0–1 per axis for the Body ID signature. Frame and legs are proportions (identity, not good/bad);
// the rest are posture, where further out means more level, centred or steady.
const AXES = ["axShoulders", "axHips", "axHead", "axKnees", "axWeight", "axStill", "axFrame", "axLegs"];
function bodyAxes(snap) {
  const clamp = (x) => Math.max(0.1, Math.min(1, x));
  const norm = (v, fn) => (has(v) ? clamp(fn(v)) : 0.5);
  return [
    norm(snap.shoulderTilt, (v) => 1 - Math.abs(v) / 8),
    norm(snap.hipTilt, (v) => 1 - Math.abs(v) / 8),
    norm(snap.headAngle, (v) => 1 - Math.max(0, v) / 40),
    norm(snap.standingKnee, (v) => 1 - Math.abs(1 - v) / 0.5),
    norm(snap.weightShift, (v) => 1 - Math.abs(v) / 40),
    norm(snap.steadiness, (v) => 1 - v / 8),
    norm(snap.frame, (v) => (v - 0.9) / 0.9),
    norm(snap.legs, (v) => (v - 1) / 1.1)
  ];
}

function bodyTraits(snap) {
  const traits = [];
  if (has(snap.frame) && snap.frame >= 1.45) traits.push("trBroad");
  if (has(snap.legs) && snap.legs >= 1.75) traits.push("trLong");
  else if (has(snap.legs) && snap.legs <= 1.45) traits.push("trCompact");
  if (has(snap.shoulderTilt) && Math.abs(snap.shoulderTilt) <= 1.5 && Math.abs(snap.hipTilt) <= 1.5) traits.push("trLevel");
  if (has(snap.headAngle) && snap.headAngle <= 12) traits.push("trUpright");
  if (has(snap.weightShift) && Math.abs(snap.weightShift) <= 5) traits.push("trCentred");
  if (has(snap.steadiness) && snap.steadiness <= 2) traits.push("trSteady");
  return traits.slice(0, 4);
}

// A stable code from the baseline scan, e.g. "LJ-7K3Q-2MXD".
function bodyIdCode(snap) {
  const src = ["frame", "legs", "shoulderTilt", "hipTilt", "headAngle", "standingKnee", "weightShift", "at"].map((k) => String(snap[k])).join("|");
  const fnv = (s, seed) => {
    let h = seed >>> 0;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
    return h;
  };
  const abc = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const chars = (h) => Array.from({ length: 4 }, (_, i) => abc[(h >>> (i * 5)) & 31]).join("");
  return `LJ-${chars(fnv(src, 2166136261))}-${chars(fnv(src, 374761393))}`;
}

function nextMoveHistory(list, snap) {
  const history = (Array.isArray(list) ? list : []).concat([snap]);
  return history.length > MOVE_HISTORY_MAX ? [history[0], ...history.slice(-(MOVE_HISTORY_MAX - 1))] : history;
}

// Plain-English summary for the AI Coach, independent of the interface language.
function moveSummaryText(list) {
  if (!Array.isArray(list) || !list.length) return "";
  const n = (v, unit = "") => (has(v) ? `${v}${unit}` : "n/a");
  const fmt = (s) => `standing still from the front: shoulder tilt ${n(s.shoulderTilt, " deg")}, hip tilt ${n(s.hipTilt, " deg")} (positive = left side lower), weight shift ${n(s.weightShift, "%")} (positive = toward their left), knee/ankle width ratio ${n(s.standingKnee)} (below 0.85 suggests knees angled inward), sway ${n(s.steadiness, "%")}; from the side: head ${n(s.headAngle, " deg")} ahead of the shoulder, trunk lean ${n(s.trunkLean, " deg")}; proportions: shoulder/hip width ${n(s.frame)}, leg/torso length ${n(s.legs)}`;
  const base = list[0], now = list[list.length - 1];
  const levelWord = ["looks typical", "worth watching", "worth a professional check"];
  const flags = bodyFlags(now).filter((f) => has(f.level) && f.level > 0)
    .map((f) => `${f.id}: ${levelWord[f.level]}${f.pain ? " (reported pain)" : ""}${f.injury ? " (past injury)" : ""}`);
  let text = `LJ Body ID ${bodyIdCode(base)} (a standing-still posture scan, no exercises). Pain reported: ${(now.pain || []).join(", ") || "none"}. Past injuries: ${(now.injury || []).join(", ") || "none"}. Latest scan (${String(now.at).slice(0, 10)}): ${fmt(now)}. Screening watch-list: ${flags.join("; ") || "nothing flagged"}.`;
  if (list.length > 1) {
    const ch = memoryChanges(base, now);
    text += ` Baseline (${String(base.at).slice(0, 10)}): ${fmt(base)}. Noticeably worse since baseline: ${ch.worse.map((c) => `${c.metric} ${c.a} -> ${c.b}`).join(", ") || "none"}. Noticeably better: ${ch.better.map((c) => `${c.metric} ${c.a} -> ${c.b}`).join(", ") || "none"}.`;
  }
  return text;
}

if (typeof module !== "undefined") {
  module.exports = {
    frontFeatures, sideFeatures, analyzeFront, analyzeSide, buildBodySnapshot, bodyFlags, memoryChanges,
    bodyAxes, bodyTraits, bodyIdCode, nextMoveHistory, moveSummaryText
  };
}

// Body ID scans live with the Passport once there is one, and on their own before that.
function loadBodyScans() {
  const data = typeof loadPassport === "function" ? loadPassport() : null;
  if (data && Array.isArray(data.movement) && data.movement.length) return data.movement;
  try {
    const list = JSON.parse(localStorage.getItem(BODY_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// ---- Interface ----

if (typeof document !== "undefined") {
  const I18N_MOVE = {
    en: {
      heroCta2: "See my career matches", hfBodyT: "Body ID", hfBodyD: "20-second scan. Your body becomes your ID.", hfCareerT: "Career match", hfCareerD: "Sports roles that fit you, with a plan.", hfPlanT: "Your plan", hfPlanD: "A saved, step-by-step path to your target role.",
      bidStepOf: "Step {i} of {n} · {name}",
      bidFrontName: "Front", bidSideName: "Side",
      bidInView: "✓ Whole body in view. Hold still…",
      bidInViewLegs: "✓ Got you. Step back a little so your feet fit too.",
      bidHold: "Hold still…",
      bidTips: "Before you start: prop your phone up at waist height, step back 2–3 m so head to feet fit in the frame, and use good light. The scan waits until it can see you.",
      bidMissFront: "The front view wasn't captured, so posture wasn't measured. Scan again with your whole upper body facing the camera.",
      bidMissLegs: "Your legs weren't fully in view, so knees, weight and leg length weren't measured. Step back until your feet fit, then scan again.",
      bidMissSide: "The side view wasn't captured, so head position wasn't measured. Turn fully sideways when asked.",
      heroCta: "Start with my Body ID",
      bidTitle: "Your LJ Body ID",
      bidSub: "Stand still for 20 seconds. Your body becomes your ID.",
      bidPainLabel: "Pain right now?",
      bidInjuryLabel: "Past injury?",
      aNeck: "Neck", aShoulder: "Shoulder", aBack: "Back", aHip: "Hip", aKnee: "Knee", aAnkle: "Ankle / foot",
      mvStart: "Scan my Body ID",
      bidRescan: "Scan again",
      bidSkip: "Skip for now",
      bidFine: "Video stays on this device. A screening guide, not a diagnosis.",
      mvCancel: "Stop",
      mvLoading: "Loading the body AI…",
      mvCameraError: "Couldn't open the camera. Allow camera access and try again.",
      mvModelError: "Couldn't load the body AI. Check your connection and try again.",
      mvGetReady: "Get ready… {n}",
      bidStepFront: "Face the camera. Feet hip-width apart, arms relaxed. Stand still.",
      bidStepSide: "Turn sideways to the camera. Stand still.",
      mvStepBack: "Step back until your whole body, head to feet, is in view.",
      bidStepBackSide: "Step back so your side, head to feet, is in view.",
      mvSecondsLeft: "{n}s",
      bidSince: "Since {date} · scans: {n}",
      bidLegend: "Filled: your first scan. Outline: your latest.",
      trBroad: "Broad frame", trLong: "Long-legged", trCompact: "Compact build", trLevel: "Level stance",
      trUpright: "Upright head", trCentred: "Centred weight", trSteady: "Rock-steady",
      axShoulders: "Shoulders", axHips: "Hips", axHead: "Head", axKnees: "Knees", axWeight: "Weight", axStill: "Stillness", axFrame: "Frame", axLegs: "Legs",
      bidWatchTitle: "Health watch-list",
      lvOk: "Looks typical", lvWatch: "Worth watching", lvCheck: "Worth a professional check", lvNone: "Not measured",
      wPosture: "Spine and posture", wNeck: "Neck and head", wKnees: "Knees", wWeight: "Hips and weight", wBalance: "Balance",
      sPosture: "Shoulders {s}; hips {h}.",
      sNeck: "Head {n}° ahead of your shoulders.",
      sKnees: "Knee ÷ ankle width: {v}.",
      sWeight: "Weight {w}.",
      sBalance: "Sway while still: {v}%.",
      sPain: "Pain reported.",
      sInjury: "Past injury.",
      whyPosture: "Often habit or a dominant side. If it stays across scans, a professional can check for a leg-length difference or a spinal curve.",
      whyNeck: "Linked with neck and upper-back strain, often from screens.",
      whyKnees: "Knees angled inward are linked with a higher risk of knee injuries, including ACL tears.",
      whyWeight: "Favouring one side can follow an injury or pain.",
      whyBalance: "Extra sway can come from tiredness, ankle or hip issues, or the inner ear.",
      whyPain: "Pain that lasts, comes back or changes how you move deserves a professional look.",
      whoPhysio: "See: a physiotherapist or athletic trainer.",
      whoDoctor: "See: a doctor or physiotherapist.",
      bidMemTitle: "Since your first scan",
      bidMemSteady: "No big changes.",
      bidMemWorse: "{label}: {a} → {b}",
      bidMemBetter: "{label}: {a} → {b}",
      mvNotMeasured: "not measured",
      mvLevel: "level",
      mvLower: "{side} side {n}° lower",
      mvLeftSide: "left",
      mvRightSide: "right",
      mvCentred: "centred",
      mvToward: "{n}% toward your {side}",
      mShoulders: "Shoulder tilt", mHips: "Hip tilt", mHead: "Head forward", mWeight: "Weight shift", mKnees: "Knee alignment", mStill: "Sway",
      mvAskAi: "Ask AI to read my Body ID",
      mvAskQuestion: "Read my LJ Body ID: my health watch-list and what changed since my first scan. Is anything worth a professional check, and what simple habits help?"
    },
    es: {
      heroCta2: "Ver mis carreras compatibles", hfBodyT: "Body ID", hfBodyD: "Escaneo de 20 segundos. Tu cuerpo es tu ID.", hfCareerT: "Tu carrera", hfCareerD: "Puestos del deporte para ti, con un plan.", hfPlanT: "Tu plan", hfPlanD: "Un camino guardado, paso a paso, hacia tu puesto objetivo.",
      bidStepOf: "Paso {i} de {n} · {name}",
      bidFrontName: "De frente", bidSideName: "De lado",
      bidInView: "✓ Cuerpo completo a la vista. Quédate quieto…",
      bidInViewLegs: "✓ Te veo. Aléjate un poco para que también se vean tus pies.",
      bidHold: "Quédate quieto…",
      bidTips: "Antes de empezar: apoya el teléfono a la altura de la cintura, aléjate 2–3 m para que se vea de la cabeza a los pies y busca buena luz. El escaneo espera hasta verte.",
      bidMissFront: "No se captó la vista de frente, así que no se midió la postura. Escanea de nuevo con todo el torso de frente a la cámara.",
      bidMissLegs: "Tus piernas no se veían completas, así que no se midieron rodillas, peso ni piernas. Aléjate hasta que se vean tus pies y escanea de nuevo.",
      bidMissSide: "No se captó la vista de lado, así que no se midió la posición de la cabeza. Gírate completamente de lado cuando te lo pida.",
      heroCta: "Empezar con mi Body ID",
      bidTitle: "Tu LJ Body ID",
      bidSub: "Quédate quieto 20 segundos. Tu cuerpo se convierte en tu ID.",
      bidPainLabel: "¿Dolor ahora?",
      bidInjuryLabel: "¿Lesión pasada?",
      aNeck: "Cuello", aShoulder: "Hombro", aBack: "Espalda", aHip: "Cadera", aKnee: "Rodilla", aAnkle: "Tobillo / pie",
      mvStart: "Escanear mi Body ID",
      bidRescan: "Escanear de nuevo",
      bidSkip: "Omitir por ahora",
      bidFine: "El video se queda en este dispositivo. Una guía de detección, no un diagnóstico.",
      mvCancel: "Parar",
      mvLoading: "Cargando la IA corporal…",
      mvCameraError: "No se pudo abrir la cámara. Permite el acceso a la cámara e inténtalo de nuevo.",
      mvModelError: "No se pudo cargar la IA corporal. Revisa tu conexión e inténtalo de nuevo.",
      mvGetReady: "Prepárate… {n}",
      bidStepFront: "De frente a la cámara. Pies al ancho de la cadera, brazos relajados. Quédate quieto.",
      bidStepSide: "Gírate de lado a la cámara. Quédate quieto.",
      mvStepBack: "Aléjate hasta que se vea todo tu cuerpo, de la cabeza a los pies.",
      bidStepBackSide: "Aléjate para que se vea tu costado, de la cabeza a los pies.",
      mvSecondsLeft: "{n} s",
      bidSince: "Desde {date} · {n} escaneos",
      bidLegend: "Relleno: tu primer escaneo. Contorno: el último.",
      trBroad: "Complexión ancha", trLong: "Piernas largas", trCompact: "Complexión compacta", trLevel: "Postura nivelada",
      trUpright: "Cabeza erguida", trCentred: "Peso centrado", trSteady: "Firme como una roca",
      axShoulders: "Hombros", axHips: "Cadera", axHead: "Cabeza", axKnees: "Rodillas", axWeight: "Peso", axStill: "Quietud", axFrame: "Complexión", axLegs: "Piernas",
      bidWatchTitle: "Lista de vigilancia de salud",
      lvOk: "Parece normal", lvWatch: "Vale la pena vigilar", lvCheck: "Vale la pena una revisión profesional", lvNone: "Sin medir",
      wPosture: "Columna y postura", wNeck: "Cuello y cabeza", wKnees: "Rodillas", wWeight: "Cadera y peso", wBalance: "Equilibrio",
      sPosture: "Hombros {s}; cadera {h}.",
      sNeck: "Cabeza {n}° por delante de los hombros.",
      sKnees: "Ancho rodillas ÷ tobillos: {v}.",
      sWeight: "Peso {w}.",
      sBalance: "Balanceo estando quieto: {v} %.",
      sPain: "Dolor indicado.",
      sInjury: "Lesión pasada.",
      whyPosture: "Suele ser un hábito o un lado dominante. Si se mantiene entre escaneos, un profesional puede revisar una diferencia en la longitud de las piernas o una curva en la columna.",
      whyNeck: "Se asocia con tensión en el cuello y la parte alta de la espalda, a menudo por las pantallas.",
      whyKnees: "Las rodillas hacia dentro se asocian con mayor riesgo de lesiones de rodilla, incluido el LCA.",
      whyWeight: "Cargar más un lado puede venir de una lesión o de dolor.",
      whyBalance: "Más balanceo puede venir del cansancio, del tobillo o la cadera, o del oído interno.",
      whyPain: "El dolor que dura, vuelve o cambia tu forma de moverte merece una revisión profesional.",
      whoPhysio: "Consulta: un fisioterapeuta o preparador físico.",
      whoDoctor: "Consulta: un médico o fisioterapeuta.",
      bidMemTitle: "Desde tu primer escaneo",
      bidMemSteady: "Sin grandes cambios.",
      bidMemWorse: "{label}: {a} → {b}",
      bidMemBetter: "{label}: {a} → {b}",
      mvNotMeasured: "sin medir",
      mvLevel: "nivelados",
      mvLower: "lado {side} {n}° más bajo",
      mvLeftSide: "izquierdo",
      mvRightSide: "derecho",
      mvCentred: "centrado",
      mvToward: "{n}% hacia tu lado {side}",
      mShoulders: "Inclinación de hombros", mHips: "Inclinación de cadera", mHead: "Cabeza adelantada", mWeight: "Desplazamiento del peso", mKnees: "Alineación de rodillas", mStill: "Balanceo",
      mvAskAi: "Pedir a la IA que lea mi Body ID",
      mvAskQuestion: "Lee mi LJ Body ID: mi lista de vigilancia de salud y qué cambió desde mi primer escaneo. ¿Hay algo que valga la pena revisar con un profesional y qué hábitos sencillos ayudan?"
    },
    zh: {
      heroCta2: "查看适合我的职业", hfBodyT: "Body ID", hfBodyD: "20 秒扫描，你的身体就是你的 ID。", hfCareerT: "职业匹配", hfCareerD: "适合你的体育岗位，附带计划。", hfPlanT: "你的计划", hfPlanD: "保存好的、通往目标岗位的分步路线。",
      bidStepOf: "第 {i} 步，共 {n} 步 · {name}",
      bidFrontName: "正面", bidSideName: "侧面",
      bidInView: "✓ 全身已在画面中。保持静止…",
      bidInViewLegs: "✓ 已识别。请再后退一点，让双脚也进入画面。",
      bidHold: "保持静止…",
      bidTips: "开始前：把手机放在齐腰高度，后退 2–3 米让头到脚都在画面中，并保证光线充足。扫描会等到看见你再开始。",
      bidMissFront: "未拍到正面，因此没有测量姿态。请让上半身完全面向摄像头后再扫描。",
      bidMissLegs: "双腿没有完整入镜，因此没有测量膝盖、重心和腿长。请后退到双脚入镜后再扫描。",
      bidMissSide: "未拍到侧面，因此没有测量头部位置。提示时请完全侧身。",
      heroCta: "从我的 Body ID 开始",
      bidTitle: "你的 LJ Body ID",
      bidSub: "静止站立 20 秒，你的身体就是你的 ID。",
      bidPainLabel: "现在有疼痛吗？",
      bidInjuryLabel: "以前受过伤吗？",
      aNeck: "颈部", aShoulder: "肩部", aBack: "背部", aHip: "髋部", aKnee: "膝盖", aAnkle: "脚踝 / 脚",
      mvStart: "扫描我的 Body ID",
      bidRescan: "再次扫描",
      bidSkip: "暂时跳过",
      bidFine: "视频只留在本设备上。这是筛查参考，不是诊断。",
      mvCancel: "停止",
      mvLoading: "正在加载身体 AI…",
      mvCameraError: "无法打开摄像头。请允许访问摄像头后重试。",
      mvModelError: "无法加载身体 AI。请检查网络后重试。",
      mvGetReady: "准备… {n}",
      bidStepFront: "面向摄像头，双脚与髋同宽，双臂放松。保持静止。",
      bidStepSide: "侧身对着摄像头。保持静止。",
      mvStepBack: "请后退，直到从头到脚都在画面中。",
      bidStepBackSide: "请后退，让你的侧身从头到脚都在画面中。",
      mvSecondsLeft: "{n} 秒",
      bidSince: "自 {date} 起 · 共 {n} 次扫描",
      bidLegend: "填充：第一次扫描。轮廓：最近一次。",
      trBroad: "宽肩体型", trLong: "长腿", trCompact: "紧凑体型", trLevel: "站姿平正",
      trUpright: "头部挺直", trCentred: "重心居中", trSteady: "稳如磐石",
      axShoulders: "肩", axHips: "髋", axHead: "头", axKnees: "膝", axWeight: "重心", axStill: "稳定", axFrame: "体型", axLegs: "腿长",
      bidWatchTitle: "健康关注清单",
      lvOk: "看起来正常", lvWatch: "值得关注", lvCheck: "建议找专业人士检查", lvNone: "未测量",
      wPosture: "脊柱与姿态", wNeck: "颈部与头部", wKnees: "膝盖", wWeight: "髋部与重心", wBalance: "平衡",
      sPosture: "肩膀{s}；髋部{h}。",
      sNeck: "头部比肩膀靠前 {n}°。",
      sKnees: "膝宽 ÷ 踝宽：{v}。",
      sWeight: "重心{w}。",
      sBalance: "静止时晃动：{v}%。",
      sPain: "报告了疼痛。",
      sInjury: "有过伤。",
      whyPosture: "通常是习惯或惯用侧导致。如果多次扫描都存在，专业人士可以检查腿长差异或脊柱侧弯。",
      whyNeck: "与颈部和上背部劳损有关，常见于长时间看屏幕。",
      whyKnees: "膝盖内扣与膝部受伤风险较高有关，包括前十字韧带撕裂。",
      whyWeight: "偏向一侧可能与受伤或疼痛有关。",
      whyBalance: "晃动较多可能来自疲劳、脚踝或髋部问题，或内耳。",
      whyPain: "持续、反复或改变你动作方式的疼痛，值得找专业人士看看。",
      whoPhysio: "可以找：理疗师或运动防护师。",
      whoDoctor: "可以找：医生或理疗师。",
      bidMemTitle: "与第一次扫描相比",
      bidMemSteady: "没有明显变化。",
      bidMemWorse: "{label}：{a} → {b}",
      bidMemBetter: "{label}：{a} → {b}",
      mvNotMeasured: "未测量",
      mvLevel: "水平",
      mvLower: "{side}侧低 {n}°",
      mvLeftSide: "左",
      mvRightSide: "右",
      mvCentred: "居中",
      mvToward: "偏向{side}侧 {n}%",
      mShoulders: "肩膀倾斜", mHips: "髋部倾斜", mHead: "头部前伸", mWeight: "重心偏移", mKnees: "膝盖对齐", mStill: "晃动",
      mvAskAi: "让 AI 解读我的 Body ID",
      mvAskQuestion: "请解读我的 LJ Body ID：我的健康关注清单，以及与第一次扫描相比的变化。有没有值得找专业人士检查的地方？有哪些简单习惯有帮助？"
    },
    ar: {
      heroCta2: "اعرض المهن المناسبة لي", hfBodyT: "Body ID", hfBodyD: "مسح لمدة 20 ثانية. جسمك هو هويتك.", hfCareerT: "مسارك المهني", hfCareerD: "وظائف رياضية تناسبك مع خطة.", hfPlanT: "خطتك", hfPlanD: "مسار محفوظ خطوة بخطوة نحو وظيفتك المستهدفة.",
      bidStepOf: "الخطوة {i} من {n} · {name}",
      bidFrontName: "من الأمام", bidSideName: "من الجانب",
      bidInView: "✓ جسمك كاملًا ظاهر. اثبت…",
      bidInViewLegs: "✓ رأيتك. تراجع قليلًا لتظهر قدماك أيضًا.",
      bidHold: "اثبت…",
      bidTips: "قبل البدء: ضع هاتفك على ارتفاع الخصر، وتراجع 2–3 م حتى يظهر جسمك من الرأس إلى القدمين، واختر إضاءة جيدة. ينتظر المسح حتى يراك.",
      bidMissFront: "لم تُلتقط الصورة الأمامية، لذا لم تُقس الوضعية. امسح مرة أخرى بحيث يواجه الجزء العلوي من جسمك الكاميرا.",
      bidMissLegs: "لم تظهر ساقاك كاملتين، لذا لم تُقس الركبتان والوزن وطول الساقين. تراجع حتى تظهر قدماك ثم امسح مرة أخرى.",
      bidMissSide: "لم تُلتقط الصورة الجانبية، لذا لم يُقس موضع الرأس. استدر جانبيًا بالكامل عند الطلب.",
      heroCta: "ابدأ بهويتي Body ID",
      bidTitle: "هويتك LJ Body ID",
      bidSub: "قف ثابتًا 20 ثانية. يصبح جسمك هويتك.",
      bidPainLabel: "ألم الآن؟",
      bidInjuryLabel: "إصابة سابقة؟",
      aNeck: "الرقبة", aShoulder: "الكتف", aBack: "الظهر", aHip: "الورك", aKnee: "الركبة", aAnkle: "الكاحل / القدم",
      mvStart: "امسح هويتي Body ID",
      bidRescan: "امسح مرة أخرى",
      bidSkip: "تخطَّ الآن",
      bidFine: "يبقى الفيديو على هذا الجهاز. دليل فحص وليس تشخيصًا.",
      mvCancel: "إيقاف",
      mvLoading: "جارٍ تحميل ذكاء الجسم الاصطناعي…",
      mvCameraError: "تعذّر فتح الكاميرا. اسمح بالوصول إلى الكاميرا وحاول مرة أخرى.",
      mvModelError: "تعذّر تحميل ذكاء الجسم الاصطناعي. تحقق من اتصالك وحاول مرة أخرى.",
      mvGetReady: "استعد… {n}",
      bidStepFront: "واجه الكاميرا. القدمان بعرض الوركين والذراعان مسترخيتان. اثبت.",
      bidStepSide: "استدر جانبيًا نحو الكاميرا. اثبت.",
      mvStepBack: "تراجع حتى يظهر جسمك كاملًا من الرأس إلى القدمين.",
      bidStepBackSide: "تراجع حتى يظهر جانبك كاملًا من الرأس إلى القدمين.",
      mvSecondsLeft: "{n} ث",
      bidSince: "منذ {date} · {n} عمليات مسح",
      bidLegend: "الممتلئ: أول مسح. الخط الخارجي: آخر مسح.",
      trBroad: "بنية عريضة", trLong: "ساقان طويلتان", trCompact: "بنية متماسكة", trLevel: "وقفة مستوية",
      trUpright: "رأس مستقيم", trCentred: "وزن متمركز", trSteady: "ثابت كالصخر",
      axShoulders: "الكتفان", axHips: "الوركان", axHead: "الرأس", axKnees: "الركبتان", axWeight: "الوزن", axStill: "الثبات", axFrame: "البنية", axLegs: "الساقان",
      bidWatchTitle: "قائمة المتابعة الصحية",
      lvOk: "يبدو طبيعيًا", lvWatch: "يستحق المتابعة", lvCheck: "يستحق فحصًا لدى مختص", lvNone: "لم يُقس",
      wPosture: "العمود الفقري والوضعية", wNeck: "الرقبة والرأس", wKnees: "الركبتان", wWeight: "الوركان والوزن", wBalance: "التوازن",
      sPosture: "الكتفان: {s}؛ الوركان: {h}.",
      sNeck: "الرأس متقدم {n}° أمام الكتفين.",
      sKnees: "عرض الركبتين ÷ الكاحلين: {v}.",
      sWeight: "الوزن: {w}.",
      sBalance: "التمايل أثناء الثبات: {v}%.",
      sPain: "تم الإبلاغ عن ألم.",
      sInjury: "إصابة سابقة.",
      whyPosture: "غالبًا عادة أو جانب مسيطر. إذا استمر عبر عدة عمليات مسح، يمكن لمختص فحص اختلاف طول الساقين أو انحناء العمود الفقري.",
      whyNeck: "مرتبط بإجهاد الرقبة وأعلى الظهر، غالبًا بسبب الشاشات.",
      whyKnees: "ميل الركبتين للداخل مرتبط بزيادة خطر إصابات الركبة، ومنها تمزق الرباط الصليبي.",
      whyWeight: "الاعتماد على جانب واحد قد يأتي بعد إصابة أو ألم.",
      whyBalance: "قد يأتي التمايل الزائد من التعب أو مشكلات الكاحل أو الورك أو الأذن الداخلية.",
      whyPain: "الألم الذي يستمر أو يتكرر أو يغيّر طريقة حركتك يستحق فحصًا لدى مختص.",
      whoPhysio: "راجع: أخصائي علاج طبيعي أو مدربًا رياضيًا معتمدًا.",
      whoDoctor: "راجع: طبيبًا أو أخصائي علاج طبيعي.",
      bidMemTitle: "منذ أول مسح",
      bidMemSteady: "لا تغييرات كبيرة.",
      bidMemWorse: "{label}: {a} ← {b}",
      bidMemBetter: "{label}: {a} ← {b}",
      mvNotMeasured: "لم يُقس",
      mvLevel: "مستويان",
      mvLower: "الجانب {side} أخفض بـ {n}°",
      mvLeftSide: "الأيسر",
      mvRightSide: "الأيمن",
      mvCentred: "في المنتصف",
      mvToward: "{n}% نحو جانبك {side}",
      mShoulders: "ميل الكتفين", mHips: "ميل الوركين", mHead: "تقدّم الرأس", mWeight: "انتقال الوزن", mKnees: "استقامة الركبتين", mStill: "التمايل",
      mvAskAi: "اطلب من الذكاء الاصطناعي قراءة Body ID",
      mvAskQuestion: "اقرأ هويتي LJ Body ID: قائمة المتابعة الصحية وما تغيّر منذ أول مسح. هل هناك ما يستحق فحصًا لدى مختص، وما العادات البسيطة التي تساعد؟"
    }
  };
  Object.keys(I18N_MOVE).forEach((lang) => Object.assign(I18N[lang], I18N_MOVE[lang]));

  const AREA_KEYS = { neck: "aNeck", shoulder: "aShoulder", back: "aBack", hip: "aHip", knee: "aKnee", ankle: "aAnkle" };
  const WATCH_KEYS = { posture: "wPosture", neck: "wNeck", knees: "wKnees", weight: "wWeight", balance: "wBalance" };
  const WHY_KEYS = { posture: "whyPosture", neck: "whyNeck", knees: "whyKnees", weight: "whyWeight", balance: "whyBalance" };
  const LEVEL_KEYS = ["lvOk", "lvWatch", "lvCheck"];
  const METRIC_FMT = {
    shoulderTiltAbs: { key: "mShoulders", unit: "°" },
    hipTiltAbs: { key: "mHips", unit: "°" },
    headAngle: { key: "mHead", unit: "°" },
    weightShiftAbs: { key: "mWeight", unit: "%" },
    standingKnee: { key: "mKnees", unit: "" },
    steadiness: { key: "mStill", unit: "%" }
  };

  const mvStartBtn = document.getElementById("mvStartBtn");
  const mvStage = document.getElementById("mvStage");
  const mvVideo = document.getElementById("mvVideo");
  const mvCanvas = document.getElementById("mvCanvas");
  const mvPrompt = document.getElementById("mvPrompt");
  const mvMsg = document.getElementById("mvMsg");
  const mvResults = document.getElementById("mvResults");
  const bidCard = document.getElementById("bidCard");
  const passportBid = document.getElementById("passportBodyId");
  let landmarker = null;
  let running = null; // { stop() }
  let mvMsgKey = "";

  function showMvMsg(key) {
    mvMsgKey = key;
    mvMsg.textContent = key ? t(key) : "";
    mvMsg.hidden = !key;
  }

  // ---- Check-in chips (pain, past injury) ----

  function chipGroup(containerId) {
    const box = document.getElementById(containerId);
    const checked = new Set([...box.querySelectorAll("input:checked")].map((i) => i.value));
    box.innerHTML = "";
    BODY_AREAS.forEach((value) => {
      const label = el("label", "checkbox-pill");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = value;
      input.checked = checked.has(value);
      label.append(input, el("span", "", t(AREA_KEYS[value])));
      box.append(label);
    });
  }

  function chipValues(containerId) {
    return [...document.querySelectorAll(`#${containerId} input:checked`)].map((i) => i.value);
  }

  function setChipValues(containerId, values) {
    document.querySelectorAll(`#${containerId} input`).forEach((i) => (i.checked = values.includes(i.value)));
  }

  // ---- Camera + pose ----

  async function loadLandmarker() {
    if (landmarker) return landmarker;
    const vision = await import(`${MP_BASE}/vision_bundle.mjs`);
    const files = await vision.FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
    landmarker = await vision.PoseLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MP_MODEL, delegate: "GPU" },
      runningMode: "VIDEO",
      numPoses: 1
    });
    return landmarker;
  }

  function drawPose(lm, good) {
    const ctx = mvCanvas.getContext("2d");
    mvCanvas.width = mvVideo.videoWidth;
    mvCanvas.height = mvVideo.videoHeight;
    ctx.clearRect(0, 0, mvCanvas.width, mvCanvas.height);
    if (!lm) return;
    const ok = (i) => lm[i] && (lm[i].visibility === undefined || lm[i].visibility > 0.5);
    ctx.strokeStyle = good ? "#e9c77b" : "rgba(233, 199, 123, 0.45)";
    ctx.fillStyle = good ? "#c9974a" : "rgba(201, 151, 74, 0.45)";
    ctx.lineWidth = 4;
    SKELETON.forEach(([a, b]) => {
      if (!ok(a) || !ok(b)) return;
      ctx.beginPath();
      ctx.moveTo(lm[a].x * mvCanvas.width, lm[a].y * mvCanvas.height);
      ctx.lineTo(lm[b].x * mvCanvas.width, lm[b].y * mvCanvas.height);
      ctx.stroke();
    });
    DRAW_POINTS.forEach((i) => {
      if (!ok(i)) return;
      ctx.beginPath();
      ctx.arc(lm[i].x * mvCanvas.width, lm[i].y * mvCanvas.height, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Front, then side; each gets a 3-second countdown, then records while the person stands still.
  function runScan() {
    return new Promise((resolve, reject) => {
      const frames = { front: [], side: [] };
      let stepIndex = 0;
      let phaseStart = performance.now();
      let phase = "frame";
      let stopped = false;
      let raf = 0;
      let lastTick = 0, seenFor = 0, recorded = 0;

      running = {
        stop() {
          stopped = true;
          cancelAnimationFrame(raf);
          reject(new Error("stopped"));
        }
      };

      const loop = () => {
        if (stopped) return;
        const now = performance.now();
        const step = MOVE_STEPS[stepIndex];
        let lm = null;
        if (mvVideo.readyState >= 2) {
          const result = landmarker.detectForVideo(mvVideo, now);
          lm = result.landmarks && result.landmarks[0];
        }
        const aspect = mvVideo.videoWidth / (mvVideo.videoHeight || 1);
        const visible = step.kind === "side" ? sideVisible(lm) : coreVisible(lm);
        const full = step.kind === "side" ? visible : bodyVisible(lm);
        drawPose(lm, visible);
        const back = t(step.kind === "side" ? "bidStepBackSide" : "mvStepBack");
        const header = tf("bidStepOf", { i: stepIndex + 1, n: MOVE_STEPS.length, name: t(step.kind === "side" ? "bidSideName" : "bidFrontName") });
        const dt = now - (lastTick || now);
        lastTick = now;

        if (phase === "frame") {
          // Wait until the body is in view for a full second before counting down.
          seenFor = visible ? seenFor + dt : 0;
          mvPrompt.textContent = `${header}\n${t(step.key)}\n${visible ? t(full ? "bidInView" : "bidInViewLegs") : back}`;
          if (seenFor >= 1000 || now - phaseStart > 30000) {
            phase = "countdown";
            phaseStart = now;
          }
        } else if (phase === "countdown") {
          const left = 3 - Math.floor((now - phaseStart) / 1000);
          mvPrompt.textContent = `${header}\n${t(step.key)}\n${tf("mvGetReady", { n: Math.max(left, 1) })}`;
          if (left <= 0) {
            phase = "record";
            phaseStart = now;
            recorded = 0;
          }
        } else {
          // Only time spent in view counts, so stepping out of frame pauses the scan instead of wasting it.
          if (visible) {
            frames[step.kind].push(step.kind === "side" ? sideFeatures(lm, aspect) : frontFeatures(lm, aspect));
            recorded += dt;
          }
          const secsLeft = Math.ceil(step.secs - recorded / 1000);
          mvPrompt.textContent = `${header}\n${visible ? t("bidHold") : back}\n${tf("mvSecondsLeft", { n: Math.max(secsLeft, 0) })}`;
          if (secsLeft <= 0 || now - phaseStart > 25000) {
            stepIndex += 1;
            if (stepIndex >= MOVE_STEPS.length) {
              running = null;
              return resolve({ front: analyzeFront(frames.front), side: analyzeSide(frames.side) });
            }
            phase = "frame";
            phaseStart = now;
            seenFor = 0;
          }
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
  }

  async function startScan() {
    showMvMsg("mvLoading");
    mvStartBtn.disabled = true;
    let stream = null;
    try {
      await loadLandmarker();
    } catch {
      mvStartBtn.disabled = false;
      return showMvMsg("mvModelError");
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
    } catch {
      mvStartBtn.disabled = false;
      return showMvMsg("mvCameraError");
    }
    showMvMsg("");
    mvVideo.srcObject = stream;
    await mvVideo.play();
    mvStage.hidden = false;
    mvStage.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      const results = await runScan();
      saveBodyScan(buildBodySnapshot(results, new Date().toISOString(), { pain: chipValues("bidPain"), injury: chipValues("bidInjury") }));
    } catch {
      // stopped by the user
    } finally {
      running = null;
      stream.getTracks().forEach((track) => track.stop());
      mvVideo.srcObject = null;
      mvStage.hidden = true;
      mvStartBtn.disabled = false;
    }
  }

  function saveBodyScan(snap) {
    const list = nextMoveHistory(loadBodyScans(), snap);
    const data = loadPassport();
    if (data) {
      data.movement = list;
      data.updatedAt = new Date().toISOString();
      savePassport(data);
      uploadProfile(data);
    }
    try {
      localStorage.setItem(BODY_KEY, JSON.stringify(list));
    } catch {
      // storage unavailable; the scan still shows until the page closes
    }
    renderMovement();
    bidCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---- Body ID card ----

  // Radar-style signature: 8 axes, first scan filled, latest scan as an outline. The outer ring
  // carries 16 ticks lit from the Body ID code, so two similar bodies still look different.
  function signatureSvg(base, now, code, labels = true) {
    const size = 220, c = size / 2, r = 84;
    const point = (i, v) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
      return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v];
    };
    const poly = (vals) => vals.map((v, i) => point(i, v).map((n) => n.toFixed(1)).join(",")).join(" ");
    let svg = `<svg viewBox="0 0 ${size} ${size}" class="bid-sig" aria-hidden="true">`;
    svg += `<defs><linearGradient id="bidGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e1a6"/><stop offset="0.5" stop-color="#e9c77b"/><stop offset="1" stop-color="#9c6f2f"/></linearGradient></defs>`;
    [0.25, 0.5, 0.75, 1].forEach((k) => (svg += `<polygon points="${poly(AXES.map(() => k))}" class="bid-grid"/>`));
    AXES.forEach((_, i) => {
      const [x, y] = point(i, 1);
      svg += `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="bid-grid"/>`;
    });
    if (code) {
      const bits = [...code.replace(/[^A-Z0-9]/g, "")].map((ch) => ch.charCodeAt(0));
      for (let i = 0; i < 16; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 16 + Math.PI / 16;
        const on = (bits[i % bits.length] >> (i % 3)) & 1;
        const x = c + Math.cos(a) * (r + 14), y = c + Math.sin(a) * (r + 14);
        svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 3.2 : 1.6}" class="${on ? "bid-tick on" : "bid-tick"}"/>`;
      }
    }
    if (base) svg += `<polygon points="${poly(bodyAxes(base))}" class="bid-base"/>`;
    if (now && now !== base) svg += `<polygon points="${poly(bodyAxes(now))}" class="bid-now"/>`;
    if (labels) {
      AXES.forEach((key, i) => {
        const [x, y] = point(i, 1.32);
        svg += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="bid-axis">${t(key)}</text>`;
      });
    }
    return svg + "</svg>";
  }

  function tiltWords(v) {
    if (Math.abs(v) <= 2) return t("mvLevel");
    return tf("mvLower", { side: t(v > 0 ? "mvLeftSide" : "mvRightSide"), n: Math.abs(v) });
  }

  function shiftWords(v) {
    if (Math.abs(v) <= 8) return t("mvCentred");
    return tf("mvToward", { n: Math.abs(v), side: t(v > 0 ? "mvLeftSide" : "mvRightSide") });
  }

  function fmtValue(metric, value) {
    if (!has(value)) return t("mvNotMeasured");
    return `${value}${METRIC_FMT[metric].unit}`;
  }

  function seenText(flag, snap) {
    switch (flag.id) {
      case "posture": return has(snap.shoulderTilt) ? tf("sPosture", { s: tiltWords(snap.shoulderTilt), h: tiltWords(snap.hipTilt) }) : "";
      case "neck": return has(snap.headAngle) ? tf("sNeck", { n: Math.max(0, snap.headAngle) }) : "";
      case "knees": return has(snap.standingKnee) ? tf("sKnees", { v: snap.standingKnee }) : "";
      case "weight": return has(snap.weightShift) ? tf("sWeight", { w: shiftWords(snap.weightShift) }) : "";
      case "balance": return has(snap.steadiness) ? tf("sBalance", { v: snap.steadiness }) : "";
      default: return "";
    }
  }

  function renderIdCard(list) {
    bidCard.innerHTML = "";
    if (!list.length) return;
    const base = list[0], now = list[list.length - 1];
    const code = bodyIdCode(base);
    const day = (iso) => new Date(iso).toLocaleDateString(currentLang);
    const card = el("div", "card bid-card");
    const art = el("div", "bid-art");
    art.innerHTML = signatureSvg(base, now, code);
    const info = el("div", "bid-info");
    info.append(el("p", "bid-code", code), el("p", "bid-since", tf("bidSince", { date: day(base.at), n: list.length })));
    const traits = el("div", "bid-traits");
    bodyTraits(now).forEach((k) => traits.append(el("span", "bid-trait", t(k))));
    info.append(traits);
    if (list.length > 1) info.append(el("p", "bid-legend", t("bidLegend")));
    card.append(art, info);
    bidCard.append(card);
  }

  // The Body ID is the Passport's identity: once scanned, it replaces the skill rings on the Passport card.
  function renderPassportBodyId(list) {
    const idCard = passportBid.closest(".passport-id-card");
    passportBid.innerHTML = "";
    idCard.classList.toggle("has-bid", list.length > 0);
    if (!list.length) return;
    const art = el("div", "bid-mini");
    art.innerHTML = signatureSvg(list[0], list[list.length - 1], bodyIdCode(list[0]), false);
    const code = el("a", "bid-mini-code", bodyIdCode(list[0]));
    code.href = "#bodyIdStart";
    passportBid.append(art, code);
  }

  function renderWatch(now) {
    const box = el("div", "card bid-section");
    box.append(el("h3", "", t("bidWatchTitle")));
    const ul = el("ul", "bid-watch");
    bodyFlags(now).forEach((f) => {
      const li = el("li", `lv-${f.level === null ? "none" : f.level}`);
      const head = el("div", "bid-watch-head");
      head.append(el("strong", "", t(WATCH_KEYS[f.id])), el("span", "bid-level", t(f.level === null ? "lvNone" : LEVEL_KEYS[f.level])));
      li.append(head);
      const notes = [seenText(f, now), f.pain ? t("sPain") : "", f.injury ? t("sInjury") : ""].filter(Boolean).join(" ");
      if (notes) li.append(el("p", "bid-seen", notes));
      if (f.level > 0) {
        li.append(el("p", "bid-why", t(f.pain ? "whyPain" : WHY_KEYS[f.id])));
        li.append(el("p", "bid-who", t(f.who)));
      }
      ul.append(li);
    });
    box.append(ul);
    return box;
  }

  function renderMemory(list) {
    const box = el("div", "card bid-section");
    box.append(el("h3", "", t("bidMemTitle")));
    const ch = memoryChanges(list[0], list[list.length - 1]);
    if (!ch.worse.length && !ch.better.length) {
      box.append(el("p", "", t("bidMemSteady")));
      return box;
    }
    const ul = el("ul", "mv-checks");
    const line = (c, key) => tf(key, { label: t(METRIC_FMT[c.metric].key), a: fmtValue(c.metric, c.a), b: fmtValue(c.metric, c.b) });
    ch.worse.forEach((c) => ul.append(el("li", "gap", `○ ${line(c, "bidMemWorse")}`)));
    ch.better.forEach((c) => ul.append(el("li", "have", `✓ ${line(c, "bidMemBetter")}`)));
    box.append(ul);
    return box;
  }

  function renderMovement() {
    const list = loadBodyScans();
    renderIdCard(list);
    renderPassportBodyId(list);
    mvResults.innerHTML = "";
    mvStartBtn.textContent = t(list.length ? "bidRescan" : "mvStart");
    document.getElementById("bidSkip").hidden = list.length > 0;
    if (!list.length) return;
    const now = list[list.length - 1];
    if (!running && !chipValues("bidPain").length && !chipValues("bidInjury").length) {
      setChipValues("bidPain", now.pain || []);
      setChipValues("bidInjury", now.injury || []);
    }
    const missing = [
      !has(now.shoulderTilt) && "bidMissFront",
      has(now.shoulderTilt) && !has(now.standingKnee) && "bidMissLegs",
      !has(now.headAngle) && "bidMissSide"
    ].filter(Boolean);
    if (missing.length) {
      const note = el("div", "card bid-missing");
      missing.forEach((k) => note.append(el("p", "", t(k))));
      mvResults.append(note);
    }
    mvResults.append(renderWatch(now));
    if (list.length > 1) mvResults.append(renderMemory(list));
    if (loadPassport()) {
      const ask = el("button", "secondary needs-ai", t("mvAskAi"));
      ask.type = "button";
      ask.addEventListener("click", () => {
        openCoach();
        askAssistant(t("mvAskQuestion"));
      });
      const actions = el("div", "actions");
      actions.append(ask);
      mvResults.append(actions);
    }
  }

  function translateMovement() {
    document.querySelectorAll('#bodyIdStart [data-i18n], .hero-x [data-i18n]').forEach((node) => (node.textContent = t(node.dataset.i18n)));
    chipGroup("bidPain");
    chipGroup("bidInjury");
    showMvMsg(mvMsgKey);
    renderMovement();
  }

  // A new or cleared Passport picks up (or drops) the Body ID.
  const refreshWithoutBodyId = refreshProfileViews;
  refreshProfileViews = function () {
    refreshWithoutBodyId();
    renderMovement();
  };
  const clearPassportKeepBodyId = clearPassport;
  clearPassport = function () {
    clearPassportKeepBodyId();
    try {
      localStorage.removeItem(BODY_KEY);
    } catch {
      // storage unavailable; nothing to clear
    }
  };

  mvStartBtn.addEventListener("click", startScan);
  document.getElementById("mvCancelBtn").addEventListener("click", () => running && running.stop());
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.dataset.tab !== "passport" && running) running.stop();
    });
  });
  document.getElementById("passportForm").addEventListener("submit", () => setTimeout(renderMovement));
  document.getElementById("langSelect").addEventListener("change", translateMovement);
  translateMovement();
}
