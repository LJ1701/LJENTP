// Clutch, the animated LJ LIVE mascot, drawn on a canvas so he's inside every saved video (no images or
// libraries). He acts out the moment: a knee-slide for a goal, a facepalm for an own goal, a red card held
// up, a dance at full time. Used by studio.js (posts) and promo.js (the ad). Self-contained on purpose.
//
// drawClutch(ctx, look, t)      the character, hips at (0, 0), about 400 px tall (head top ≈ -280, feet ≈ 110)
// clutchBand(ctx, look, t, w)   character + speech bubble (or narrator mic) laid out in a band w wide, centred
// clutchAct(kind)               which reaction a moment type gets
//
// look = { act, color, alt, say, narrate, light } · t = seconds since the clip started (Infinity = still)

const CLUTCH_ACTS = {
  goal: "celebrate", pen: "icecold", og: "facepalm", red: "redcard",
  score: "point", update: "point", spot: "point",
  matchday: "camera", poll: "camera", take: "mic",
  ft_win: "dance", ft_blowout: "dance", ft_late: "dance", ft_comeback: "comeback", ft_draw: "shrug"
};

function clutchAct(kind) {
  return CLUTCH_ACTS[kind] || "point";
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
    mouth: 0, smile: 1, brow: 0, lids: 0, wink: false, prop: null, confetti: false, flash: 0
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

// Character on the left, speech bubble (or narrator mic) on the right, in a band `w` wide centred at 0.
// The band is 420 px tall, centred vertically at 0.
function clutchBand(ctx, look, tIn, w) {
  const still = tIn === Infinity;
  const t = still ? 2.6 : tIn;
  const display = '"Space Grotesk", Inter, sans-serif';
  const charX = -w / 2 + 200;
  const enter = still || look.act === "celebrate" ? 1 : CL.back(CL.span(t, 0.35, 0.5));
  ctx.save();
  ctx.translate(charX, 70);
  ctx.scale(0.88 * Math.max(enter, 0.01), 0.88 * Math.max(enter, 0.01));
  drawClutch(ctx, look, tIn);
  ctx.restore();

  const bx = -w / 2 + 390, bw = w / 2 - 10 - bx, by = -120;
  const pop = still ? 1 : CL.back(CL.span(t, 0.9, 0.45));
  if (pop <= 0) return;
  ctx.save();
  ctx.translate(bx + bw / 2, by);
  ctx.scale(Math.max(pop, 0.01), Math.max(pop, 0.01));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (look.narrate) {
    // Narrator: a mic tag and moving sound bars; the words go in the voice-over script below the post.
    const bars = 9;
    ctx.fillStyle = look.light ? "rgba(255, 255, 255, 0.92)" : "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -70, bw, 140, 70);
    ctx.fill();
    ctx.fillStyle = look.light ? CL.ink : CL.white;
    ctx.font = `800 44px ${display}`;
    ctx.textAlign = "left";
    ctx.fillText("🎙 CLUTCH", -bw / 2 + 44, 2);
    for (let i = 0; i < bars; i++) {
      const h = still ? 30 : 16 + Math.abs(Math.sin(t * 9 + i * 1.3)) * 56;
      ctx.fillStyle = i % 2 ? CL.gold : "#e5383b";
      ctx.beginPath();
      ctx.roundRect(bw / 2 - 60 - (bars - i) * 22, -h / 2, 12, h, 6);
      ctx.fill();
    }
  } else if (look.say) {
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
