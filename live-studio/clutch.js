// Clutch, the animated LJ LIVE mascot, drawn on a canvas so he's inside every saved video (no images or
// libraries). He acts out the moment: a knee-slide for a goal, a facepalm for an own goal, a red card held
// up, a dance at full time. Used by studio.js (posts) and promo.js (the ad). Self-contained on purpose.
//
// drawClutch(ctx, look, t)      the character, hips at (0, 0), about 400 px tall (head top ≈ -280, feet ≈ 110)
// clutchBand(ctx, look, t, w)   character with his style's scenery in a band w wide, centred (bubble only if look.say)
// clutchAct(kind)               which reaction a moment type gets
//
// look = { act, style, color, alt, say, light } · t = seconds since the clip started (Infinity = still)
//
// The post's Style sets how big he goes. Hype is over the top (backflip and fireworks, rocket boots,
// a giant red card, a slow-motion collapse). Breaking, Clean and Team colours are cooler and more
// cinematic: a news anchor at a desk, a smooth groove under spotlights, a caped hero with a team flag.

const CLUTCH_ACTS = {
  goal: "celebrate", pen: "icecold", og: "facepalm", red: "redcard",
  score: "point", update: "point", spot: "point",
  matchday: "camera", poll: "camera", take: "mic",
  ft_win: "dance", ft_blowout: "dance", ft_late: "dance", ft_comeback: "comeback", ft_draw: "shrug"
};

function clutchAct(kind) {
  return CLUTCH_ACTS[kind] || "point";
}

// The reaction for a style: Hype goes extraordinary, the other styles go vibe and epic.
const CLUTCH_STYLE_ACTS = {
  hype: { celebrate: "backflip", dance: "rocket", comeback: "rocket", redcard: "bigcard", facepalm: "collapse" },
  breaking: { celebrate: "deskslam", dance: "deskslam", comeback: "deskslam", shrug: "point", camera: "point" },
  clean: { celebrate: "groove", dance: "groove", comeback: "groove" },
  team: { celebrate: "hero", dance: "hero", comeback: "hero", point: "hero" }
};

function clutchStyleAct(style, act) {
  const map = CLUTCH_STYLE_ACTS[style] || CLUTCH_STYLE_ACTS.hype;
  return map[act] || act;
}

const CL = {
  gold: "#e9c77b", goldDark: "#9c6f2f", ink: "#0b0b0d", white: "#ffffff",
  ease: (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3),
  back: (x) => {
    const k = Math.min(Math.max(x, 0), 1);
    return 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);
  },
  span: (t, a, d) => (t - a) / d,
  hex: (h, fb) => (/^#?[0-9a-f]{6}$/i.test(h || "") ? `#${String(h).replace("#", "")}` : fb)
};

// Two-bone reach: from shoulder/hip (sx, sy) toward target (tx, ty). bend = +1 or -1 picks the elbow side.
function clutchReach(sx, sy, tx, ty, l1, l2, bend) {
  const dx = tx - sx, dy = ty - sy;
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5);
  const a = Math.atan2(dy, dx);
  const b = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d || 1))));
  const ea = a + bend * b;
  return { ex: sx + l1 * Math.cos(ea), ey: sy + l1 * Math.sin(ea), hx: sx + d * Math.cos(a), hy: sy + d * Math.sin(a) };
}

// The pose for an act at time t: hand and foot targets, body offset, face.
function clutchPose(act, t) {
  const pose = {
    x: 0, y: 0, lean: 0, headTilt: 0, headY: 0, shrug: 0,
    lh: [-78, -18], rh: [78, -18], lf: [-34, 108], rf: [34, 108],
    mouth: 0, smile: 1, brow: 0, lids: 0, wink: false, prop: null, confetti: false, flash: 0,
    spin: 0, flames: 0, shake: 0, fireworks: false, flag: false, slam: 0
  };
  const bounce = (speed, amp) => -Math.abs(Math.sin(t * speed)) * amp;
  if (act === "celebrate") {
    // Knee-slide in from the left, arms spread, then up and fist pumps.
    const slide = CL.ease(CL.span(t, 0.15, 0.75));
    if (t < 1.25) {
      pose.x = (1 - slide) * -320;
      pose.y = 42;
      pose.lean = (1 - slide) * 0.25;
      pose.lh = [-150, -250];
      pose.rh = [150, -250];
      pose.lf = [-82, 66];
      pose.rf = [82, 66];
      pose.mouth = 0.9;
    } else {
      const k = t - 1.25;
      const pump = 0.5 + 0.5 * Math.sin(k * 10);
      pose.y = bounce(5, 22);
      pose.rh = [70, -330 + pump * 110];
      pose.lh = [-70, -330 + (1 - pump) * 110];
      pose.mouth = 0.55 + 0.4 * pump;
      pose.brow = 1;
    }
    pose.confetti = true;
  } else if (act === "icecold") {
    // Shades drop, a calm nod, a point at the camera side.
    pose.prop = { kind: "shades", drop: CL.ease(CL.span(t, 0.7, 0.4)) };
    pose.headY = t > 1.2 && t < 3.2 ? Math.max(0, Math.sin((t - 1.2) * 6)) * 10 : 0;
    pose.rh = [168, -168];
    pose.lh = [18, -96];
    pose.lean = -0.05;
    pose.smile = 0.6;
    pose.lids = 0.35;
  } else if (act === "facepalm") {
    const k = CL.ease(CL.span(t, 0.6, 0.45));
    pose.rh = [78 - k * 64, -18 - k * 200];
    pose.lh = [-70, -10];
    pose.headTilt = k * -0.18 + (t > 1.3 ? Math.sin(t * 7) * 0.06 : 0);
    pose.headY = k * 10;
    pose.lean = k * 0.08;
    pose.smile = -0.7;
    pose.brow = -1;
    pose.lids = 0.5 * k;
  } else if (act === "redcard") {
    const up = CL.back(CL.span(t, 0.5, 0.5));
    pose.rh = [110, -18 - up * 300];
    pose.lh = t > 1.3 ? [-176, -180] : [-78, -18];
    pose.prop = { kind: "card", show: up };
    pose.flash = t > 1.0 ? 0.5 + 0.5 * Math.sin(t * 9) : 0;
    pose.mouth = 0.55;
    pose.brow = -1;
    pose.lean = -0.04;
  } else if (act === "point") {
    // Points down at the scoreboard, a little bounce.
    pose.rh = [150, 28];
    pose.lh = [-50, -50];
    pose.y = bounce(3, 8);
    pose.lean = 0.06;
    pose.headTilt = 0.08;
    pose.mouth = 0.3;
  } else if (act === "pointup") {
    // Points up at something above him (the promo's score).
    pose.rh = [96, -318];
    pose.lh = [-50, -50];
    pose.y = bounce(3, 8);
    pose.headTilt = -0.1;
    pose.mouth = 0.3;
  } else if (act === "dance") {
    const s = Math.sin(t * 6);
    pose.x = s * 16;
    pose.y = bounce(6, 18);
    pose.lean = s * 0.08;
    pose.lh = [-120, -250 + s * 70];
    pose.rh = [120, -250 - s * 70];
    pose.lf = [-40 + s * 10, 108];
    pose.rf = [40 + s * 10, 108];
    pose.mouth = 0.6;
    pose.brow = 1;
    pose.confetti = t > 0.6;
  } else if (act === "comeback") {
    // On his knees, then a big jump, then the dance.
    if (t < 1.6) {
      pose.y = 46;
      pose.lh = [-54, 40];
      pose.rh = [54, 40];
      pose.lf = [-84, 66];
      pose.rf = [84, 66];
      pose.headTilt = -0.12;
      pose.headY = 12;
      pose.smile = -0.3;
      pose.lids = 0.4;
    } else if (t < 2.4) {
      const j = Math.sin(Math.PI * CL.span(t, 1.6, 0.8));
      pose.y = -150 * j;
      pose.lh = [-130, -320];
      pose.rh = [130, -320];
      pose.lf = [-50, 90];
      pose.rf = [50, 90];
      pose.mouth = 1;
      pose.brow = 1;
    } else {
      return clutchPose("dance", t);
    }
    pose.confetti = t > 1.8;
  } else if (act === "shrug") {
    const s = 0.5 + 0.5 * Math.sin(t * 3.2);
    pose.shrug = s;
    pose.lh = [-118, -112 - s * 22];
    pose.rh = [118, -112 - s * 22];
    pose.brow = 1;
    pose.smile = 0.2;
    pose.headTilt = 0.1 * Math.sin(t * 1.6);
  } else if (act === "camera") {
    // Points at you (hand comes toward the camera), with a wink.
    const k = CL.back(CL.span(t, 0.6, 0.5));
    pose.rh = [96, -150];
    pose.prop = { kind: "you", k };
    pose.lh = [-60, -40];
    pose.wink = t > 1.2 && (t % 2.4) < 1.6;
    pose.mouth = 0.25;
    pose.lean = -0.04;
  } else if (act === "backflip") {
    // HYPE goal: crouch, a full backflip, fireworks, then fist pumps.
    if (t < 0.5) {
      pose.y = 34;
      pose.lh = [-60, 20];
      pose.rh = [60, 20];
      pose.lf = [-60, 80];
      pose.rf = [60, 80];
      pose.mouth = 0.3;
    } else if (t < 1.35) {
      const k = CL.span(t, 0.5, 0.85);
      pose.y = -230 * Math.sin(Math.PI * k);
      pose.spin = -Math.PI * 2 * CL.ease(k);
      pose.lh = [-40, -60];
      pose.rh = [40, -60];
      pose.lf = [-30, 60];
      pose.rf = [30, 60];
      pose.mouth = 0.8;
    } else {
      const q = clutchPose("celebrate", t);
      q.confetti = true;
      q.fireworks = true;
      q.flash = Math.max(0, 1 - CL.span(t, 1.35, 0.5));
      q.shake = Math.max(0, 1 - CL.span(t, 1.35, 0.6));
      return q;
    }
    pose.fireworks = t > 0.9;
  } else if (act === "rocket") {
    // HYPE full time: rocket boots, hovering with arms up, gold confetti, screen shake.
    const lift = CL.ease(CL.span(t, 0.4, 1.2));
    pose.y = -150 * lift + Math.sin(t * 5) * 10 * lift;
    pose.lh = [-140, -300];
    pose.rh = [140, -300];
    pose.lf = [-30, 100];
    pose.rf = [30, 100];
    pose.flames = lift;
    pose.shake = t > 0.4 && t < 1.6 ? 0.6 : 0.15;
    pose.mouth = 0.8;
    pose.brow = 1;
    pose.confetti = t > 0.8;
    pose.fireworks = t > 1.2;
  } else if (act === "bigcard") {
    // HYPE red card: a giant card slams in.
    const q = clutchPose("redcard", t);
    const slam = CL.span(t, 0.5, 0.3);
    q.prop = { kind: "card", show: 1, scale: slam < 1 ? 3.6 - 1.4 * CL.ease(slam) : 2.2 };
    q.shake = slam >= 1 ? Math.max(0, 1 - CL.span(t, 0.8, 0.5)) : 0;
    q.flash = q.shake * 0.7;
    return q;
  } else if (act === "collapse") {
    // HYPE own goal: a dramatic slow-motion collapse to his knees.
    const k = CL.ease(CL.span(t, 0.5, 2.2));
    pose.y = 50 * k;
    pose.lean = 0.3 * k;
    pose.headTilt = 0.35 * k;
    pose.headY = 14 * k;
    pose.lh = [-90 + k * 20, -18 + k * 70];
    pose.rh = [90 - k * 20, -18 + k * 70];
    pose.lf = [-34 - k * 50, 108 - k * 40];
    pose.rf = [34 + k * 50, 108 - k * 40];
    pose.smile = -1;
    pose.brow = -1;
    pose.lids = 0.6 * k;
    pose.mouth = t > 0.6 && t < 2.4 ? 0.5 : 0;
  } else if (act === "deskslam") {
    // BREAKING: a news anchor. Calm at the desk, slams it, then points at the camera.
    if (t < 1.1) {
      pose.lh = [-90, -6];
      pose.rh = [90, -6];
      pose.mouth = 0.3;
      pose.smile = 0.5;
    } else if (t < 1.6) {
      const k = CL.span(t, 1.1, 0.5);
      const up = Math.sin(Math.PI * Math.min(1, k * 1.4));
      pose.lh = [-90, -6 - up * 120];
      pose.rh = [90, -6 - up * 120];
      pose.brow = -1;
      pose.mouth = 0.7;
      pose.slam = k > 0.7 ? 1 : 0;
      pose.shake = k > 0.7 ? 1 : 0;
    } else {
      pose.lh = [-90, -6];
      pose.rh = [96, -150];
      pose.prop = { kind: "you", k: CL.back(CL.span(t, 1.6, 0.4)) };
      pose.mouth = 0.4;
      pose.brow = 1;
      pose.shake = Math.max(0, 0.6 - CL.span(t, 1.6, 0.6));
    }
  } else if (act === "groove") {
    // CLEAN: a smooth groove, slow side steps and a confident nod.
    const s = Math.sin(t * 2.6);
    pose.x = s * 34;
    pose.y = -Math.abs(Math.sin(t * 2.6)) * 10;
    pose.lean = s * 0.06;
    pose.lh = [-96 + s * 30, -70 + Math.cos(t * 2.6) * 20];
    pose.rh = [96 + s * 30, -70 - Math.cos(t * 2.6) * 20];
    pose.lf = [-38 + s * 14, 108];
    pose.rf = [38 + s * 14, 108];
    pose.headY = Math.max(0, Math.sin(t * 5.2)) * 6;
    pose.lids = 0.3;
    pose.smile = 0.9;
  } else if (act === "hero") {
    // TEAM COLOURS: a caped hero pose with the team flag, slow push-in.
    pose.lh = [-62, -46];
    pose.rh = [118, -236];
    pose.lean = -0.04;
    pose.headTilt = -0.08;
    pose.smile = 0.8;
    pose.brow = 0.5;
    pose.flag = true;
    pose.confetti = false;
  } else if (act === "mic") {
    pose.rh = [34, -176];
    pose.lh = [-140, -150 + Math.sin(t * 4) * 34];
    pose.prop = { kind: "mic" };
    pose.mouth = 0.5;
    pose.brow = 1;
  }
  return pose;
}

function drawClutch(ctx, look, tIn) {
  const still = tIn === Infinity;
  const t = still ? 2.6 : tIn;
  const pose = clutchPose(look.act || "point", t);
  const jersey = CL.hex(look.color, "#141518");
  const trim = CL.hex(look.alt, CL.gold);
  const trimOk = trim.toLowerCase() !== jersey.toLowerCase() ? trim : CL.gold;
  // Talking: the narrator's mouth moves the whole clip; otherwise the pose decides.
  if (look.narrate && !still && t > 0.4) {
    pose.mouth = Math.max(0.12, Math.abs(Math.sin(t * 13)) * (0.55 + 0.35 * Math.sin(t * 3.1)));
  }

  ctx.save();
  // Shadow on the ground.
  ctx.fillStyle = look.light ? "rgba(0, 0, 0, 0.12)" : "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(pose.x, 116, 110 + Math.min(0, pose.y) * 0.25, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.lean);
  if (pose.spin) {
    ctx.translate(0, -120);
    ctx.rotate(pose.spin);
    ctx.translate(0, 120);
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const limb = (sx, sy, target, bend, l1, l2, width, color) => {
    const r = clutchReach(sx, sy, target[0], target[1], l1, l2, bend);
    [[CL.ink, width + 10], [color, width]].forEach(([c, w]) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(r.ex, r.ey);
      ctx.lineTo(r.hx, r.hy);
      ctx.stroke();
    });
    return r;
  };

  // Cape (Team colours): flows behind him in the team's colours.
  if (look.style === "team") {
    const wave = Math.sin(t * 3.4) * 26;
    const shc = -142 - pose.shrug * 14;
    ctx.fillStyle = CL.ink;
    ctx.beginPath();
    ctx.moveTo(-66, shc - 4);
    ctx.lineTo(66, shc - 4);
    ctx.quadraticCurveTo(120 + wave, -40, 104 + wave * 1.4, 86);
    ctx.lineTo(-104 + wave * 0.6, 86);
    ctx.quadraticCurveTo(-120 + wave * 0.4, -40, -66, shc - 4);
    ctx.fill();
    ctx.fillStyle = trimOk === CL.gold ? jersey : trimOk;
    ctx.beginPath();
    ctx.moveTo(-58, shc);
    ctx.lineTo(58, shc);
    ctx.quadraticCurveTo(110 + wave, -40, 96 + wave * 1.4, 78);
    ctx.lineTo(-96 + wave * 0.6, 78);
    ctx.quadraticCurveTo(-110 + wave * 0.4, -40, -58, shc);
    ctx.fill();
  }

  // Legs and shoes.
  const lLeg = limb(-26, 26, pose.lf, 1, 50, 52, 30, CL.gold);
  const rLeg = limb(26, 26, pose.rf, -1, 50, 52, 30, CL.gold);
  [lLeg, rLeg].forEach((r, i) => {
    ctx.fillStyle = CL.ink;
    ctx.beginPath();
    ctx.ellipse(r.hx + (i ? 10 : -10), r.hy + 4, 30, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CL.white;
    ctx.beginPath();
    ctx.ellipse(r.hx + (i ? 10 : -10), r.hy + 1, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Rocket boots (Hype).
  if (pose.flames > 0) {
    [lLeg, rLeg].forEach((r, i) => {
      const fl = (40 + Math.abs(Math.sin(t * 30 + i)) * 50) * pose.flames;
      const fx = r.hx + (i ? 10 : -10);
      const g = ctx.createLinearGradient(0, r.hy + 10, 0, r.hy + 10 + fl);
      g.addColorStop(0, "#fff3c4");
      g.addColorStop(0.4, "#ffb020");
      g.addColorStop(1, "rgba(229, 56, 59, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(fx - 20, r.hy + 10);
      ctx.lineTo(fx + 20, r.hy + 10);
      ctx.lineTo(fx, r.hy + 10 + fl);
      ctx.closePath();
      ctx.fill();
    });
  }

  // Shorts.
  ctx.fillStyle = CL.ink;
  ctx.beginPath();
  ctx.roundRect(-50, -8, 100, 46, 10);
  ctx.fill();

  // Jersey (the team's colour), with trim and "LJ".
  const sh = -142 - pose.shrug * 14;
  ctx.fillStyle = CL.ink;
  ctx.beginPath();
  ctx.moveTo(-64, sh - 6);
  ctx.lineTo(64, sh - 6);
  ctx.lineTo(52, 6);
  ctx.lineTo(-52, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = jersey;
  ctx.beginPath();
  ctx.moveTo(-58, sh);
  ctx.lineTo(58, sh);
  ctx.lineTo(46, 0);
  ctx.lineTo(-46, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = trimOk;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-20, sh);
  ctx.quadraticCurveTo(0, sh + 22, 20, sh);
  ctx.stroke();
  ctx.fillStyle = trimOk;
  ctx.font = '900 46px "Space Grotesk", Inter, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LJ", 0, sh + 70);

  // Arms (gold, with team-colour sleeves).
  const lArm = limb(-56, sh + 12, pose.lh, 1, 64, 62, 26, CL.gold);
  const rArm = limb(56, sh + 12, pose.rh, -1, 64, 62, 26, CL.gold);
  [[-56, lArm], [56, rArm]].forEach(([sx, r]) => {
    ctx.strokeStyle = jersey;
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo(sx, sh + 12);
    ctx.lineTo(sx + (r.ex - sx) * 0.4, sh + 12 + (r.ey - sh - 12) * 0.4);
    ctx.stroke();
  });

  // Head.
  ctx.save();
  ctx.translate(0, sh - 72 + pose.headY);
  ctx.rotate(pose.headTilt);
  ctx.fillStyle = CL.ink;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.fill();
  const hg = ctx.createRadialGradient(-20, -24, 10, 0, 0, 66);
  hg.addColorStop(0, "#f6e1a6");
  hg.addColorStop(1, CL.gold);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(0, 0, 64, 0, Math.PI * 2);
  ctx.fill();
  // Headband in the team's colour.
  ctx.fillStyle = jersey;
  ctx.beginPath();
  ctx.roundRect(-66, -46, 132, 20, 8);
  ctx.fill();
  // Eyes.
  [-23, 23].forEach((ex, i) => {
    const winkThis = pose.wink && i === 1;
    if (winkThis) {
      ctx.strokeStyle = CL.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(ex, -2, 12, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = CL.white;
    ctx.beginPath();
    ctx.ellipse(ex, -4, 15, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CL.ink;
    ctx.beginPath();
    ctx.arc(ex + 2, -2, 8, 0, Math.PI * 2);
    ctx.fill();
    if (pose.lids > 0) {
      ctx.fillStyle = CL.gold;
      ctx.fillRect(ex - 17, -24, 34, 36 * pose.lids);
    }
    // Brows.
    ctx.strokeStyle = CL.ink;
    ctx.lineWidth = 6;
    ctx.beginPath();
    const tilt = pose.brow * 5 * (i ? -1 : 1);
    ctx.moveTo(ex - 13, -30 - pose.brow * 6 + tilt);
    ctx.lineTo(ex + 13, -30 - pose.brow * 6 - tilt);
    ctx.stroke();
  });
  // Mouth: open oval when shouting or talking, otherwise a smile (or a frown).
  if (pose.mouth > 0.15) {
    ctx.fillStyle = CL.ink;
    ctx.beginPath();
    ctx.ellipse(0, 32, 18, 4 + pose.mouth * 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e5383b";
    ctx.beginPath();
    ctx.ellipse(0, 36 + pose.mouth * 8, 10, 2 + pose.mouth * 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = CL.ink;
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (pose.smile >= 0) ctx.arc(0, 18, 22, Math.PI * (0.2 + (1 - pose.smile) * 0.15), Math.PI * (0.8 - (1 - pose.smile) * 0.15));
    else ctx.arc(0, 48, 20, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();
  }
  // Props on the face.
  if (pose.prop && pose.prop.kind === "shades") {
    const yy = -70 + pose.prop.drop * 66;
    ctx.globalAlpha = Math.min(1, pose.prop.drop * 2);
    ctx.fillStyle = CL.ink;
    ctx.beginPath();
    ctx.roundRect(-50, yy - 14, 44, 28, 10);
    ctx.roundRect(6, yy - 14, 44, 28, 10);
    ctx.fill();
    ctx.fillRect(-8, yy - 8, 16, 6);
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(-42, yy - 8, 12, 5);
    ctx.fillRect(14, yy - 8, 12, 5);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // Hand props.
  if (pose.prop && pose.prop.kind === "card" && pose.prop.show > 0) {
    ctx.save();
    ctx.translate(rArm.hx, rArm.hy - 50);
    ctx.rotate(0.12);
    const cs = pose.prop.scale || 1;
    ctx.scale(cs, cs);
    if (pose.flash > 0) {
      ctx.fillStyle = `rgba(229, 56, 59, ${0.25 * pose.flash})`;
      ctx.beginPath();
      ctx.arc(0, 0, 110, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = CL.ink;
    ctx.beginPath();
    ctx.roundRect(-38, -56, 76, 108, 10);
    ctx.fill();
    ctx.fillStyle = "#e5383b";
    ctx.beginPath();
    ctx.roundRect(-32, -50, 64, 96, 8);
    ctx.fill();
    ctx.restore();
  }
  if (pose.flag) {
    // Team flag on a pole, waving.
    ctx.save();
    ctx.translate(rArm.hx, rArm.hy);
    ctx.strokeStyle = CL.ink;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(0, -110);
    ctx.stroke();
    const fw = Math.sin(t * 4) * 14;
    [[CL.ink, 0], [jersey, 5]].forEach(([c, inset]) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(4, -110 + inset);
      ctx.quadraticCurveTo(66, -128 + fw + inset, 136 - inset, -110 + fw * 1.5 + inset);
      ctx.lineTo(136 - inset, -40 + fw * 1.5 - inset);
      ctx.quadraticCurveTo(66, -58 + fw - inset, 4, -40 - inset);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = trimOk;
    ctx.font = '900 34px "Space Grotesk", Inter, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("LJ", 70, -75 + fw);
    ctx.restore();
  }
  if (pose.prop && pose.prop.kind === "mic") {
    ctx.save();
    ctx.translate(rArm.hx, rArm.hy);
    ctx.rotate(-0.5);
    ctx.fillStyle = CL.ink;
    ctx.fillRect(-9, -6, 18, 60);
    ctx.beginPath();
    ctx.arc(0, -22, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c7c9cf";
    ctx.beginPath();
    ctx.arc(0, -22, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Hands (fists), drawn last so they sit on top.
  [lArm, rArm].forEach((r, i) => {
    const big = pose.prop && pose.prop.kind === "you" && i === 1 ? 1 + 0.9 * Math.max(0, pose.prop.k) : 1;
    ctx.fillStyle = CL.ink;
    ctx.beginPath();
    ctx.arc(r.hx, r.hy, 22 * big, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CL.gold;
    ctx.beginPath();
    ctx.arc(r.hx, r.hy, 16 * big, 0, Math.PI * 2);
    ctx.fill();
    if (big > 1) {
      // Index finger pointing straight out of the screen: a dot with a ring.
      ctx.fillStyle = CL.ink;
      ctx.beginPath();
      ctx.arc(r.hx, r.hy, 7 * big, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  // News desk in front (Breaking): hides his legs, shakes when slammed.
  if (look.style === "breaking") {
    ctx.save();
    ctx.translate(pose.slam ? Math.sin(t * 80) * 6 : 0, 0);
    ctx.fillStyle = CL.ink;
    ctx.beginPath();
    ctx.roundRect(-270, -12, 540, 140, 14);
    ctx.fill();
    ctx.fillStyle = "#1c1d22";
    ctx.beginPath();
    ctx.roundRect(-262, -4, 524, 124, 10);
    ctx.fill();
    ctx.fillStyle = "#e5383b";
    ctx.fillRect(-262, -4, 524, 18);
    ctx.fillStyle = CL.white;
    ctx.font = '900 46px "Space Grotesk", Inter, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LJ NEWS", 0, 66);
    ctx.restore();
  }

  // Confetti in front (deterministic, so the still and the video match).
  if (pose.confetti) {
    const colors = [CL.gold, jersey, trimOk, CL.white, "#f6e1a6"];
    for (let i = 0; i < 46; i++) {
      const seed = Math.sin(i * 91.7) * 10000;
      const r = seed - Math.floor(seed);
      const x = (r - 0.5) * 760;
      const fall = ((t * (120 + r * 160) + i * 47) % 560) - 420;
      ctx.save();
      ctx.translate(x + Math.sin(t * 3 + i) * 14, fall);
      ctx.rotate(t * (2 + r * 3) + i);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(-8, -4, 16, 8);
      ctx.restore();
    }
  }
}

function clutchWrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((w) => {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

// Fireworks bursts behind him (Hype): three bursts at set times, so the still and the video match.
function clutchFireworks(ctx, t, w, color) {
  const bursts = [[-w * 0.3, -150, 0.9], [w * 0.32, -170, 1.3], [0, -200, 1.8], [-w * 0.2, -120, 2.6], [w * 0.25, -110, 3.2]];
  const colors = [CL.gold, "#fff3c4", CL.hex(color, "#e5383b"), "#ffffff"];
  bursts.forEach(([bx, by, at], b) => {
    const k = (t - at) % 2.4;
    if (t < at || k > 1.1) return;
    const r = 30 + CL.ease(k / 1.1) * 150;
    ctx.globalAlpha = Math.max(0, 1 - k / 1.1);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + b;
      ctx.fillStyle = colors[(i + b) % colors.length];
      ctx.beginPath();
      ctx.arc(bx + Math.cos(a) * r, by + Math.sin(a) * r + k * 30, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

// Clutch in a band `w` wide and 430 px tall, centred at 0, with his style's scenery and effects.
// With look.say (used by the promo), he stands on the left with a speech bubble on the right.
function clutchBand(ctx, look, tIn, w) {
  const still = tIn === Infinity;
  const t = still ? 2.6 : tIn;
  const display = '"Space Grotesk", Inter, sans-serif';
  const style = look.style || "hype";
  const act = clutchStyleAct(style, look.act || "point");
  const look2 = { ...look, act, style };
  const pose = clutchPose(act, t);
  // Centred on his own; on the left when he has a speech bubble (the promo).
  const charX = look.say ? -w / 2 + 200 : 0;
  const enter = still ? 1 : CL.back(CL.span(t, 0.2, 0.5));
  const shake = still ? 0 : pose.shake * 14;
  ctx.save();
  ctx.translate(Math.sin(t * 61) * shake, Math.cos(t * 47) * shake);

  // Scenery behind him, by style.
  if (style === "hype") {
    // A gold aura, and fireworks for the big moments.
    const aura = ctx.createRadialGradient(charX, 0, 20, charX, 0, 200);
    aura.addColorStop(0, `rgba(233, 199, 123, ${0.35 + 0.15 * Math.sin(t * 4)})`);
    aura.addColorStop(1, "rgba(233, 199, 123, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(-w / 2, -215, w, 430);
    if (pose.fireworks) clutchFireworks(ctx, t, w, look.color);
  } else if (style === "clean") {
    // Two soft spotlights and a floor glow.
    [-1, 1].forEach((side) => {
      const sway = still ? 0 : Math.sin(t * 1.3 + side) * 30;
      const g = ctx.createLinearGradient(0, -215, 0, 140);
      g.addColorStop(0, look.light ? "rgba(201, 151, 74, 0.28)" : "rgba(255, 244, 214, 0.22)");
      g.addColorStop(1, "rgba(255, 244, 214, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(side * (w / 2 - 40), -215);
      ctx.lineTo(side * (w / 2 - 110), -215);
      ctx.lineTo(charX - 150 + sway, 140);
      ctx.lineTo(charX + 150 + sway, 140);
      ctx.closePath();
      ctx.fill();
    });
  } else if (style === "team") {
    // Light rays from behind, like a movie poster.
    ctx.save();
    ctx.translate(charX, -60);
    ctx.rotate(still ? 0 : t * 0.15);
    for (let i = 0; i < 12; i++) {
      ctx.rotate((Math.PI * 2) / 12);
      ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-30, -340);
      ctx.lineTo(30, -340);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Team colours: a slow push-in.
  const push = style === "team" && !still ? 1 + 0.08 * CL.ease(t / 5) : 1;
  ctx.save();
  ctx.translate(charX, 70);
  const sc = 0.88 * Math.max(enter, 0.01) * push;
  ctx.scale(sc, sc);
  drawClutch(ctx, look2, tIn);
  ctx.restore();

  // Stadium-light flash (Hype).
  if (!still && pose.flash > 0 && style === "hype") {
    const fl = ctx.createRadialGradient(charX, 0, 10, charX, 0, 210);
    fl.addColorStop(0, `rgba(255, 250, 235, ${0.7 * pose.flash})`);
    fl.addColorStop(1, "rgba(255, 250, 235, 0)");
    ctx.fillStyle = fl;
    ctx.fillRect(-w / 2, -215, w, 430);
  }
  ctx.restore();
  if (!look.say) return;

  const bx = -w / 2 + 390, bw = w / 2 - 10 - bx, by = -120;
  const pop = still ? 1 : CL.back(CL.span(t, 0.9, 0.45));
  if (pop <= 0) return;
  ctx.save();
  ctx.translate(bx + bw / 2, by);
  ctx.scale(Math.max(pop, 0.01), Math.max(pop, 0.01));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  {
    ctx.font = `800 46px ${display}`;
    let size = 46;
    let lines = clutchWrap(ctx, look.say, bw - 70);
    while (lines.length > 4 && size > 28) {
      size -= 2;
      ctx.font = `800 ${size}px ${display}`;
      lines = clutchWrap(ctx, look.say, bw - 70);
    }
    lines = lines.slice(0, 4);
    const lh = size * 1.18;
    const bh = lines.length * lh + 56;
    ctx.fillStyle = CL.white;
    ctx.strokeStyle = CL.ink;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 34);
    ctx.moveTo(-bw / 2 + 20, bh / 2 - 46);
    ctx.lineTo(-bw / 2 - 46, bh / 2 + 10);
    ctx.lineTo(-bw / 2 + 4, bh / 2 - 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = CL.white;
    ctx.fillRect(-bw / 2 + 2, bh / 2 - 44, 24, 30);
    // Typed out word by word.
    const total = look.say.length;
    let shown = still ? total : Math.floor(Math.min(1, Math.max(0, (t - 1.1) / Math.min(1.6, total * 0.03))) * total);
    ctx.fillStyle = CL.ink;
    ctx.font = `800 ${size}px ${display}`;
    ctx.textAlign = "left";
    lines.forEach((ln, i) => {
      const part = ln.slice(0, Math.max(0, shown));
      shown -= ln.length + 1;
      // Left edge fixed at the full line's position, so letters don't slide while typing.
      ctx.fillText(part, -ctx.measureText(ln).width / 2, -((lines.length - 1) * lh) / 2 + i * lh + 2);
    });
  }
  ctx.restore();
}
