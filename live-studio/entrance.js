// The entrance: a stadium-style opening with real numbers from the live feed. "Go live" (or Enter,
// Space or Escape) zooms into the app. It plays once per browser session; reduced-motion users get
// a still version.

(function entrance() {
  const I18N_ENT = {
    en: { entTagline: "Real games. Real moments. Posted in seconds.", entGo: "Go live", entLiveNow: "{n} games live right now", entOneLive: "1 game live right now", entToday: "{n} games in today's feed" },
    es: { entTagline: "Partidos reales. Momentos reales. Publicados en segundos.", entGo: "Entrar en vivo", entLiveNow: "{n} partidos en vivo ahora", entOneLive: "1 partido en vivo ahora", entToday: "{n} partidos en el marcador de hoy" },
    zh: { entTagline: "真实比赛，真实瞬间，几秒发布。", entGo: "进入直播", entLiveNow: "{n} 场比赛正在直播", entOneLive: "1 场比赛正在直播", entToday: "今天共有 {n} 场比赛" },
    ar: { entTagline: "مباريات حقيقية. لحظات حقيقية. تُنشر في ثوانٍ.", entGo: "ادخل البث المباشر", entLiveNow: "{n} مباريات مباشرة الآن", entOneLive: "مباراة واحدة مباشرة الآن", entToday: "{n} مباريات في نتائج اليوم" },
    fr: { entTagline: "De vrais matchs. De vrais moments. Publiés en quelques secondes.", entGo: "Passer en direct", entLiveNow: "{n} matchs en direct maintenant", entOneLive: "1 match en direct maintenant", entToday: "{n} matchs au programme aujourd'hui" },
    pt: { entTagline: "Jogos reais. Momentos reais. Postados em segundos.", entGo: "Entrar ao vivo", entLiveNow: "{n} jogos ao vivo agora", entOneLive: "1 jogo ao vivo agora", entToday: "{n} jogos no placar de hoje" },
    de: { entTagline: "Echte Spiele. Echte Momente. In Sekunden gepostet.", entGo: "Live gehen", entLiveNow: "{n} Spiele gerade live", entOneLive: "1 Spiel gerade live", entToday: "{n} Spiele im heutigen Ticker" },
    it: { entTagline: "Partite vere. Momenti veri. Pubblicati in pochi secondi.", entGo: "Vai in diretta", entLiveNow: "{n} partite in diretta ora", entOneLive: "1 partita in diretta ora", entToday: "{n} partite nel tabellone di oggi" },
    hi: { entTagline: "असली मैच। असली पल। सेकंडों में पोस्ट।", entGo: "लाइव जाएँ", entLiveNow: "अभी {n} मैच लाइव", entOneLive: "अभी 1 मैच लाइव", entToday: "आज के फ़ीड में {n} मैच" },
    ja: { entTagline: "本物の試合。本物の瞬間。数秒で投稿。", entGo: "ライブへ", entLiveNow: "いま{n}試合がライブ中", entOneLive: "いま1試合がライブ中", entToday: "今日の試合は{n}試合" }
  };
  Object.keys(I18N_ENT).forEach((lang) => (I18N[lang] = Object.assign(I18N[lang] || {}, I18N_ENT[lang])));
  // Locale files that load later merge their own text in; re-apply ours on top so the entrance stays translated.
  const originalRegister = registerLocale;
  registerLocale = function (code, pack) {
    originalRegister(code, pack);
    if (I18N_ENT[code]) Object.assign(I18N[code], I18N_ENT[code]);
  };

  const box = document.getElementById("entrance");
  const count = document.getElementById("entCount");
  const scores = document.getElementById("entScores");
  const go = document.getElementById("entGo");
  let seen = false;
  try {
    seen = sessionStorage.getItem("ljlive_entered") === "1";
  } catch {
    // no session storage: show the entrance
  }
  if (seen) {
    box.remove();
    document.body.classList.remove("entrance-on");
    return;
  }

  let stats = null;
  function translate() {
    box.querySelectorAll("[data-i18n]").forEach((n) => (n.textContent = t(n.dataset.i18n)));
    if (!stats) return;
    count.textContent = stats.live === 1 ? t("entOneLive") : stats.live > 1 ? tf("entLiveNow", { n: stats.live }) : tf("entToday", { n: stats.total });
    count.classList.toggle("is-live", stats.live > 0);
    count.hidden = false;
  }

  // Real results float up like stadium screens; live games first.
  function floatScores(games) {
    const picks = games.slice(0, 10);
    picks.forEach((g, i) => {
      const card = el("div", `ent-score ${g.state}`);
      card.append(
        el("span", "ent-score-tag", g.state === "in" ? `● ${g.detail}` : g.leagueName),
        el("span", "ent-score-line", `${g.home.name} ${g.home.score}–${g.away.score} ${g.away.name}`)
      );
      // Keep the screens in side lanes so they never sit on the title or button.
      if (i % 2) card.style.left = `${2 + ((i * 5) % 12)}%`;
      else card.style.right = `${2 + ((i * 7) % 12)}%`;
      card.style.animationDelay = `${0.6 + i * 0.55}s`;
      card.style.setProperty("--drift", `${(i % 2 ? 1 : -1) * (10 + (i % 3) * 8)}px`);
      scores.append(card);
    });
  }

  async function loadStats() {
    const sports = ["soccer", "basketball", "football", "hockey", "baseball"];
    const lists = await Promise.all(sports.map((sp) =>
      fetch(`/api/live?sport=${sp}`).then((r) => (r.ok ? r.json() : { games: [] })).catch(() => ({ games: [] }))));
    const all = lists.flatMap((d) => d.games || []);
    if (!all.length) return;
    const live = all.filter((g) => g.state === "in");
    stats = { live: live.length, total: all.length };
    translate();
    // Take turns across sports so the screens show variety, live games first.
    const mix = (state) => {
      const pools = lists.map((d) => (d.games || []).filter((g) => g.state === state));
      const out = [];
      for (let i = 0; pools.some((pl) => pl[i]); i++) pools.forEach((pl) => pl[i] && out.push(pl[i]));
      return out;
    };
    floatScores([...mix("in"), ...mix("post")]);
  }

  function enter() {
    if (box.classList.contains("leaving")) return;
    try {
      sessionStorage.setItem("ljlive_entered", "1");
    } catch {
      // will show again next visit
    }
    box.classList.add("leaving");
    document.body.classList.remove("entrance-on");
    document.body.classList.add("app-arrive");
    setTimeout(() => {
      box.remove();
      document.body.classList.remove("app-arrive");
    }, 900);
  }

  go.addEventListener("click", enter);
  document.addEventListener("keydown", (e) => {
    if (document.body.contains(box) && ["Enter", " ", "Escape"].includes(e.key)) {
      e.preventDefault();
      enter();
    }
  });
  document.getElementById("langSelect").addEventListener("change", () => setTimeout(translate));
  translate();
  loadStats();
  setTimeout(() => go.focus(), 1800);
})();
