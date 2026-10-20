// LJSportMind LIVE Studio: follow a real game and post it as it happens. Scores, the match clock and
// key events (goals and red cards, with the player and minute) come from a live score feed via
// /api/live; nothing is typed in or made up. Each new event automatically becomes a 9:16 video,
// a still and a factual caption. When the game ends, a recap is built from the same events.
// Your own hot take can be added, and it is always labelled as your opinion.

const LIVE_KEY = "ljsportmind_live";
const LIVE_POLL_MS = 15000;
const LIST_POLL_MS = 30000;
const LS_EMOJI = {
  goal: "⚽", red: "🟥", score: { basketball: "🏀", football: "🏈", soccer: "⚽", baseball: "⚾", hockey: "🏒" }, update: "📊", take: "💬", ft: "🏁",
  matchday: "🗓️", poll: "🗳️", spot: "⭐"
};
const LS_HASH = { soccer: "#football #soccer", basketball: "#basketball", football: "#football", baseball: "#baseball", hockey: "#hockey" };

const I18N_LIVE = {
  en: {
    heroLiveNow: "Live & latest", heroCta2: "Open LIVE Studio", hfBodyT: "Body ID", hfBodyD: "20-second scan. Your body becomes your ID.", hfCareerT: "Career match", hfCareerD: "Sports roles that fit you, with a plan.", hfLiveT: "LIVE Studio", hfLiveD: "Real games turned into posts and videos.",
    lsAiOff: "AI writing turns on once the site's AI key is connected.", lsAiHooks: "Hooks", lsAiCaptions: "Captions", lsAiPrompts: "Comment prompts", lsUse: "Use this", lsInUse: "In use ✓", lsAiAgain: "More options",
    lsBaseball: "Baseball", lsHockey: "Hockey",
    lsCredit: "Made by @ljsoccer01",
    lsCreate: "Create", lsStyle: "Style",
    stHype: "Hype", stBreaking: "Breaking", stClean: "Clean", stTeam: "Team colours",
    cMatchday: "Matchday", cPoll: "Prediction poll", cScore: "Score now", cSpot: "Player spotlight", cRecap: "Full-time recap",
    lsDrawOpt: "Draw", lsNoScorers: "No scorers yet.",
    m_matchday: "Matchday", m_poll: "Who wins?", m_spot: "Spotlight", m_brace: "Brace", m_hat: "Hat-trick",
    h_matchday: ["{league} · {when}"], c_matchday: "{home} v {away} · {league} · {when}.",
    h_poll: ["{home} v {away} · {when}"], c_poll2: "Who wins {home} v {away}? Comment 1 for {home} or 2 for {away}. {when}.",
    c_poll3: "Who wins {home} v {away}? Comment 1 for {home}, X for a draw or 2 for {away}. {when}.",
    q_matchday: "Who wins? 👇", q_poll2: "Comment 1 or 2 👇", q_poll3: "Comment 1, X or 2 👇",
    h_spot1: ["{player} scores for {team} at {mins}."], h_spotN: ["{player}: {n} goals for {team} ({mins})."],
    c_spot: "{player} ({team}): {n} goal(s) in {home} v {away} at {mins}. {when}: {line}.", q_spot: "Rate this performance 1–10 👇",
    h_brace: ["{player} scores again: 2 goals for {team}."], h_hat: ["HAT-TRICK: {player} has 3 for {team}."],
    lsFollowingFootball: "Following live. Every score change turns into a post automatically.",
    lsFollowingBasketball: "Following live. The score updates every 20 seconds; tap to post it.",
    tabCreator: "LIVE Studio",
    lsKicker: "LIVE Studio",
    lsTitle: "Post the moment while it's still happening.",
    lsPick: "Pick a real game",
    lsSoccer: "Soccer", lsBasketball: "Basketball", lsFootball: "Football",
    lsRefresh: "Refresh",
    lsLoading: "Loading today's games…",
    lsFeedError: "The live score feed isn't responding. Try again in a minute.",
    lsNoGames: "No games in the feed today for this sport.",
    lsStateIn: "LIVE", lsStatePre: "Upcoming", lsStatePost: "Final",
    lsSourceNote: "Scores and events come from ESPN's public live scoreboard. Posts only use what the feed reports.",
    lsFollowing: "Following live. New goals and red cards turn into posts automatically.",
    lsFinalNote: "This game is over. The posts below use its official result.",
    lsPreNote: "This game hasn't started. Posts appear automatically once it kicks off.",
    lsLive: "LIVE", lsFT: "FULL TIME", lsUpcoming: "UPCOMING",
    lsPostScore: "Post the current score",
    lsTakePh: "Your hot take (posted as your opinion)…", lsTakeBtn: "Add my take",
    lsNewMatch: "Pick another game",
    lsTimeline: "Timeline", lsEmpty: "No goals or red cards yet. They'll appear here the moment the feed reports them.",
    lsSave: "Save image", lsShare: "Share", lsCopy: "Copy caption", lsCopied: "Copied!",
    lsThread: "Thread", lsCopyThread: "Copy thread", lsPlay: "▶ Voiceover", lsStop: "■ Stop",
    lsSharpen: "Sharpen with AI", lsThinking: "Writing…",
    lsMakingVideo: "Creating video…", lsSaveVideo: "Save video", lsShareVideo: "Share video", lsNoVideo: "This browser can't record video. The image is ready to post.",
    lsUpdated: "Updated {time}",
    m_goal: "Goal", m_pen: "Penalty goal", m_og: "Own goal", m_red: "Red card", m_score: "Score", m_update: "Score update", m_take: "Hot take", m_ft: "Full time",
    h_goal: ["{player} scores for {team} at {min}.", "GOAL: {player}, {min}."],
    h_pen: ["{player} scores a penalty for {team} at {min}."],
    h_og: ["Own goal at {min}: {line}."],
    h_red: ["Red card for {player} ({team}) at {min}."],
    h_score: ["{team} score. {line}."],
    h_update: ["{status}: {line}."],
    h_take: ["{note}"],
    c_goal: "{player} scores for {team} at {min}. {line}.",
    c_pen: "{player} scores a penalty for {team} at {min}. {line}.",
    c_og: "Own goal at {min}. {line}.",
    c_red: "{player} ({team}) is sent off at {min}. {line}.",
    c_score: "{team} score ({status}). {line}.",
    c_update: "{status}: {line}.",
    c_take: "My take ({status}, {line}): {note}",
    q_goal: "Who wins this? 👇", q_pen: "Who wins this? 👇", q_og: "Who wins this? 👇", q_red: "Fair call? 👇",
    q_score: "Who wins this? 👇", q_update: "Your prediction? 👇", q_take: "Agree? 👇",
    r_comeback: "{winner} come back from behind to win. {line}.",
    r_late: "Decided by a goal at {min}. {line}.",
    r_blowout: "{winner} win by {diff}. {line}.",
    r_draw: "It finishes level. {line}.",
    r_win: "{winner} win. {line}.",
    r_moments: "Key moments:",
    r_question: "What was the moment of the match? 👇",
    r_story_comeback: "Comeback", r_story_late: "Late winner", r_story_blowout: "Big win", r_story_draw: "Draw", r_story_win: "Win"
  },
  es: {
    heroLiveNow: "En vivo y recientes", heroCta2: "Abrir LIVE Studio", hfBodyT: "Body ID", hfBodyD: "Escaneo de 20 segundos. Tu cuerpo es tu ID.", hfCareerT: "Tu carrera", hfCareerD: "Puestos del deporte para ti, con un plan.", hfLiveT: "LIVE Studio", hfLiveD: "Partidos reales convertidos en posts y videos.",
    lsAiOff: "La escritura con IA se activa cuando se conecte la clave de IA del sitio.", lsAiHooks: "Ganchos", lsAiCaptions: "Textos", lsAiPrompts: "Preguntas para comentarios", lsUse: "Usar esta", lsInUse: "En uso ✓", lsAiAgain: "Más opciones",
    lsBaseball: "Béisbol", lsHockey: "Hockey",
    lsCredit: "Hecho por @ljsoccer01",
    lsCreate: "Crear", lsStyle: "Estilo",
    stHype: "Épico", stBreaking: "Última hora", stClean: "Limpio", stTeam: "Colores del equipo",
    cMatchday: "Día de partido", cPoll: "Encuesta", cScore: "Marcador ahora", cSpot: "Jugador destacado", cRecap: "Resumen final",
    lsDrawOpt: "Empate", lsNoScorers: "Aún no hay goleadores.",
    m_matchday: "Día de partido", m_poll: "¿Quién gana?", m_spot: "Destacado", m_brace: "Doblete", m_hat: "Hat-trick",
    h_matchday: ["{league} · {when}"], c_matchday: "{home} v {away} · {league} · {when}.",
    h_poll: ["{home} v {away} · {when}"], c_poll2: "¿Quién gana {home} v {away}? Comenta 1 por {home} o 2 por {away}. {when}.",
    c_poll3: "¿Quién gana {home} v {away}? Comenta 1 por {home}, X por empate o 2 por {away}. {when}.",
    q_matchday: "¿Quién gana? 👇", q_poll2: "Comenta 1 o 2 👇", q_poll3: "Comenta 1, X o 2 👇",
    h_spot1: ["{player} marca para {team} en el {mins}."], h_spotN: ["{player}: {n} goles para {team} ({mins})."],
    c_spot: "{player} ({team}): {n} gol(es) en {home} v {away}, en el {mins}. {when}: {line}.", q_spot: "Puntúa su partido del 1 al 10 👇",
    h_brace: ["{player} marca otra vez: 2 goles para {team}."], h_hat: ["HAT-TRICK: {player} lleva 3 para {team}."],
    lsFollowingFootball: "Siguiendo en vivo. Cada cambio en el marcador se convierte en publicación automáticamente.",
    lsFollowingBasketball: "Siguiendo en vivo. El marcador se actualiza cada 20 segundos; toca para publicarlo.",
    tabCreator: "LIVE Studio",
    lsKicker: "LIVE Studio",
    lsTitle: "Publica el momento mientras todavía está pasando.",
    lsPick: "Elige un partido real",
    lsSoccer: "Fútbol", lsBasketball: "Baloncesto", lsFootball: "Fútbol americano",
    lsRefresh: "Actualizar",
    lsLoading: "Cargando los partidos de hoy…",
    lsFeedError: "El marcador en vivo no responde. Inténtalo de nuevo en un minuto.",
    lsNoGames: "Hoy no hay partidos de este deporte en el marcador.",
    lsStateIn: "EN VIVO", lsStatePre: "Próximo", lsStatePost: "Final",
    lsSourceNote: "Los marcadores y eventos vienen del marcador público en vivo de ESPN. Las publicaciones solo usan lo que informa.",
    lsFollowing: "Siguiendo en vivo. Los goles y rojas nuevos se convierten en publicaciones automáticamente.",
    lsFinalNote: "Este partido terminó. Las publicaciones usan su resultado oficial.",
    lsPreNote: "Este partido no ha empezado. Las publicaciones aparecerán solas cuando empiece.",
    lsLive: "EN VIVO", lsFT: "FINAL", lsUpcoming: "PRÓXIMO",
    lsPostScore: "Publicar el marcador actual",
    lsTakePh: "Tu opinión (se publica como opinión)…", lsTakeBtn: "Añadir mi opinión",
    lsNewMatch: "Elegir otro partido",
    lsTimeline: "Cronología", lsEmpty: "Aún no hay goles ni rojas. Aparecerán aquí en cuanto el marcador los informe.",
    lsSave: "Guardar imagen", lsShare: "Compartir", lsCopy: "Copiar texto", lsCopied: "¡Copiado!",
    lsThread: "Hilo", lsCopyThread: "Copiar hilo", lsPlay: "▶ Voz en off", lsStop: "■ Parar",
    lsSharpen: "Mejorar con IA", lsThinking: "Escribiendo…",
    lsMakingVideo: "Creando video…", lsSaveVideo: "Guardar video", lsShareVideo: "Compartir video", lsNoVideo: "Este navegador no puede grabar video. La imagen está lista para publicar.",
    lsUpdated: "Actualizado {time}",
    m_goal: "Gol", m_pen: "Gol de penalti", m_og: "Gol en propia", m_red: "Roja", m_score: "Anotación", m_update: "Marcador", m_take: "Opinión", m_ft: "Final",
    h_goal: ["{player} marca para {team} en el {min}.", "GOL: {player}, {min}."],
    h_pen: ["{player} marca de penalti para {team} en el {min}."],
    h_og: ["Gol en propia puerta en el {min}: {line}."],
    h_red: ["Roja para {player} ({team}) en el {min}."],
    h_score: ["{team} anota. {line}."],
    h_update: ["{status}: {line}."],
    h_take: ["{note}"],
    c_goal: "{player} marca para {team} en el {min}. {line}.",
    c_pen: "{player} marca de penalti para {team} en el {min}. {line}.",
    c_og: "Gol en propia puerta en el {min}. {line}.",
    c_red: "{player} ({team}) es expulsado en el {min}. {line}.",
    c_score: "{team} anota ({status}). {line}.",
    c_update: "{status}: {line}.",
    c_take: "Mi opinión ({status}, {line}): {note}",
    q_goal: "¿Quién gana esto? 👇", q_pen: "¿Quién gana esto? 👇", q_og: "¿Quién gana esto? 👇", q_red: "¿Bien pitado? 👇",
    q_score: "¿Quién gana esto? 👇", q_update: "¿Tu pronóstico? 👇", q_take: "¿De acuerdo? 👇",
    r_comeback: "{winner} remonta y gana. {line}.",
    r_late: "Decidido por un gol en el {min}. {line}.",
    r_blowout: "{winner} gana por {diff}. {line}.",
    r_draw: "Termina en empate. {line}.",
    r_win: "{winner} gana. {line}.",
    r_moments: "Momentos clave:",
    r_question: "¿Cuál fue el momento del partido? 👇",
    r_story_comeback: "Remontada", r_story_late: "Gol tardío", r_story_blowout: "Gran victoria", r_story_draw: "Empate", r_story_win: "Victoria"
  },
  zh: {
    heroLiveNow: "直播与最新", heroCta2: "打开 LIVE 工作室", hfBodyT: "Body ID", hfBodyD: "20 秒扫描，你的身体就是你的 ID。", hfCareerT: "职业匹配", hfCareerD: "适合你的体育岗位，附带计划。", hfLiveT: "LIVE 工作室", hfLiveD: "把真实比赛变成帖子和视频。",
    lsAiOff: "网站的 AI 密钥接通后即可使用 AI 写作。", lsAiHooks: "开头钩子", lsAiCaptions: "文案", lsAiPrompts: "评论引导", lsUse: "使用这条", lsInUse: "使用中 ✓", lsAiAgain: "更多选项",
    lsBaseball: "棒球", lsHockey: "冰球",
    lsCredit: "由 @ljsoccer01 制作",
    lsCreate: "创建", lsStyle: "风格",
    stHype: "燃", stBreaking: "快讯", stClean: "简洁", stTeam: "球队配色",
    cMatchday: "比赛日", cPoll: "胜负投票", cScore: "当前比分", cSpot: "球员焦点", cRecap: "全场回顾",
    lsDrawOpt: "平局", lsNoScorers: "暂无进球者。",
    m_matchday: "比赛日", m_poll: "谁会赢？", m_spot: "焦点", m_brace: "梅开二度", m_hat: "帽子戏法",
    h_matchday: ["{league} · {when}"], c_matchday: "{home} v {away} · {league} · {when}。",
    h_poll: ["{home} v {away} · {when}"], c_poll2: "{home} v {away} 谁会赢？{home} 评论 1，{away} 评论 2。{when}。",
    c_poll3: "{home} v {away} 谁会赢？{home} 评论 1，平局评论 X，{away} 评论 2。{when}。",
    q_matchday: "谁会赢？👇", q_poll2: "评论 1 或 2 👇", q_poll3: "评论 1、X 或 2 👇",
    h_spot1: ["{player} 在 {mins} 为{team}进球。"], h_spotN: ["{player}：为{team}打进 {n} 球（{mins}）。"],
    c_spot: "{player}（{team}）：在 {home} v {away} 中打进 {n} 球，时间 {mins}。{when}：{line}。", q_spot: "给这场表现打分 1–10 👇",
    h_brace: ["{player} 再次进球：为{team}打进 2 球。"], h_hat: ["帽子戏法：{player} 为{team}打进 3 球。"],
    lsFollowingFootball: "正在实时跟踪。每次比分变化都会自动生成帖子。",
    lsFollowingBasketball: "正在实时跟踪。比分每 20 秒更新一次；点击即可发布。",
    tabCreator: "LIVE 工作室",
    lsKicker: "LIVE 工作室",
    lsTitle: "在比赛进行时就发布精彩瞬间。",
    lsPick: "选择一场真实比赛",
    lsSoccer: "足球", lsBasketball: "篮球", lsFootball: "美式橄榄球",
    lsRefresh: "刷新",
    lsLoading: "正在加载今天的比赛…",
    lsFeedError: "实时比分源没有响应。请一分钟后再试。",
    lsNoGames: "今天该项目没有比赛。",
    lsStateIn: "直播中", lsStatePre: "未开始", lsStatePost: "已结束",
    lsSourceNote: "比分和事件来自 ESPN 公开实时比分。帖子只使用比分源报告的内容。",
    lsFollowing: "正在实时跟踪。新的进球和红牌会自动生成帖子。",
    lsFinalNote: "比赛已结束。以下帖子使用官方结果。",
    lsPreNote: "比赛尚未开始。开赛后帖子会自动出现。",
    lsLive: "直播中", lsFT: "全场结束", lsUpcoming: "未开始",
    lsPostScore: "发布当前比分",
    lsTakePh: "你的观点（作为个人观点发布）…", lsTakeBtn: "添加我的观点",
    lsNewMatch: "选择其他比赛",
    lsTimeline: "时间线", lsEmpty: "暂无进球或红牌。比分源一报告就会出现在这里。",
    lsSave: "保存图片", lsShare: "分享", lsCopy: "复制文案", lsCopied: "已复制！",
    lsThread: "串文", lsCopyThread: "复制串文", lsPlay: "▶ 配音", lsStop: "■ 停止",
    lsSharpen: "用 AI 润色", lsThinking: "正在撰写…",
    lsMakingVideo: "正在生成视频…", lsSaveVideo: "保存视频", lsShareVideo: "分享视频", lsNoVideo: "此浏览器无法录制视频。图片已可发布。",
    lsUpdated: "更新于 {time}",
    m_goal: "进球", m_pen: "点球进球", m_og: "乌龙球", m_red: "红牌", m_score: "得分", m_update: "比分更新", m_take: "观点", m_ft: "全场结束",
    h_goal: ["{player} 在 {min} 为{team}进球。", "进球：{player}，{min}。"],
    h_pen: ["{player} 在 {min} 为{team}罚进点球。"],
    h_og: ["{min} 出现乌龙球：{line}。"],
    h_red: ["{player}（{team}）在 {min} 吃到红牌。"],
    h_score: ["{team}得分。{line}。"],
    h_update: ["{status}：{line}。"],
    h_take: ["{note}"],
    c_goal: "{player} 在 {min} 为{team}进球。{line}。",
    c_pen: "{player} 在 {min} 为{team}罚进点球。{line}。",
    c_og: "{min} 出现乌龙球。{line}。",
    c_red: "{player}（{team}）在 {min} 被罚下。{line}。",
    c_score: "{team}得分（{status}）。{line}。",
    c_update: "{status}：{line}。",
    c_take: "我的观点（{status}，{line}）：{note}",
    q_goal: "谁会赢？👇", q_pen: "谁会赢？👇", q_og: "谁会赢？👇", q_red: "判得公平吗？👇",
    q_score: "谁会赢？👇", q_update: "你的预测？👇", q_take: "同意吗？👇",
    r_comeback: "{winner} 逆转取胜。{line}。",
    r_late: "{min} 的进球决定胜负。{line}。",
    r_blowout: "{winner} 净胜 {diff}。{line}。",
    r_draw: "双方战平。{line}。",
    r_win: "{winner} 获胜。{line}。",
    r_moments: "关键时刻：",
    r_question: "全场最佳时刻是哪一个？👇",
    r_story_comeback: "逆转", r_story_late: "绝杀", r_story_blowout: "大胜", r_story_draw: "平局", r_story_win: "胜利"
  },
  ar: {
    heroLiveNow: "مباشر وأحدث النتائج", heroCta2: "افتح LIVE Studio", hfBodyT: "Body ID", hfBodyD: "مسح لمدة 20 ثانية. جسمك هو هويتك.", hfCareerT: "مسارك المهني", hfCareerD: "وظائف رياضية تناسبك مع خطة.", hfLiveT: "LIVE Studio", hfLiveD: "مباريات حقيقية تتحول إلى منشورات وفيديوهات.",
    lsAiOff: "تعمل الكتابة بالذكاء الاصطناعي بعد ربط مفتاح الذكاء الاصطناعي للموقع.", lsAiHooks: "افتتاحيات", lsAiCaptions: "نصوص", lsAiPrompts: "أسئلة للتعليقات", lsUse: "استخدم هذا", lsInUse: "قيد الاستخدام ✓", lsAiAgain: "خيارات أكثر",
    lsBaseball: "البيسبول", lsHockey: "الهوكي",
    lsCredit: "صنعه @ljsoccer01",
    lsCreate: "أنشئ", lsStyle: "النمط",
    stHype: "حماسي", stBreaking: "عاجل", stClean: "بسيط", stTeam: "ألوان الفريق",
    cMatchday: "يوم المباراة", cPoll: "استطلاع الفائز", cScore: "النتيجة الآن", cSpot: "نجم المباراة", cRecap: "ملخص نهاية المباراة",
    lsDrawOpt: "تعادل", lsNoScorers: "لا مسجلين بعد.",
    m_matchday: "يوم المباراة", m_poll: "من سيفوز؟", m_spot: "نجم", m_brace: "ثنائية", m_hat: "هاتريك",
    h_matchday: ["{league} · {when}"], c_matchday: "{home} ضد {away} · {league} · {when}.",
    h_poll: ["{home} ضد {away} · {when}"], c_poll2: "من سيفوز {home} ضد {away}؟ اكتب 1 لـ{home} أو 2 لـ{away}. {when}.",
    c_poll3: "من سيفوز {home} ضد {away}؟ اكتب 1 لـ{home} أو X للتعادل أو 2 لـ{away}. {when}.",
    q_matchday: "من سيفوز؟ 👇", q_poll2: "اكتب 1 أو 2 👇", q_poll3: "اكتب 1 أو X أو 2 👇",
    h_spot1: ["{player} يسجل لـ{team} في {mins}."], h_spotN: ["{player}: {n} أهداف لـ{team} ({mins})."],
    c_spot: "{player} ({team}): {n} هدف/أهداف في {home} ضد {away} في {mins}. {when}: {line}.", q_spot: "قيّم أداءه من 1 إلى 10 👇",
    h_brace: ["{player} يسجل مجددًا: هدفان لـ{team}."], h_hat: ["هاتريك: {player} يسجل 3 لـ{team}."],
    lsFollowingFootball: "متابعة مباشرة. كل تغيير في النتيجة يتحول إلى منشور تلقائيًا.",
    lsFollowingBasketball: "متابعة مباشرة. تتحدث النتيجة كل 20 ثانية؛ اضغط لنشرها.",
    tabCreator: "LIVE Studio",
    lsKicker: "LIVE Studio",
    lsTitle: "انشر اللحظة وهي ما زالت تحدث.",
    lsPick: "اختر مباراة حقيقية",
    lsSoccer: "كرة القدم", lsBasketball: "كرة السلة", lsFootball: "كرة القدم الأمريكية",
    lsRefresh: "تحديث",
    lsLoading: "جارٍ تحميل مباريات اليوم…",
    lsFeedError: "مصدر النتائج المباشرة لا يستجيب. حاول مرة أخرى بعد دقيقة.",
    lsNoGames: "لا توجد مباريات لهذه الرياضة اليوم.",
    lsStateIn: "مباشر", lsStatePre: "قادمة", lsStatePost: "انتهت",
    lsSourceNote: "النتائج والأحداث من لوحة نتائج ESPN العامة المباشرة. المنشورات تستخدم فقط ما يذكره المصدر.",
    lsFollowing: "متابعة مباشرة. الأهداف والبطاقات الحمراء الجديدة تتحول إلى منشورات تلقائيًا.",
    lsFinalNote: "انتهت هذه المباراة. المنشورات أدناه تستخدم نتيجتها الرسمية.",
    lsPreNote: "لم تبدأ هذه المباراة بعد. ستظهر المنشورات تلقائيًا عند انطلاقها.",
    lsLive: "مباشر", lsFT: "نهاية المباراة", lsUpcoming: "قادمة",
    lsPostScore: "انشر النتيجة الحالية",
    lsTakePh: "رأيك (يُنشر كرأي شخصي)…", lsTakeBtn: "أضف رأيي",
    lsNewMatch: "اختر مباراة أخرى",
    lsTimeline: "التسلسل الزمني", lsEmpty: "لا أهداف أو بطاقات حمراء بعد. ستظهر هنا فور أن يذكرها المصدر.",
    lsSave: "حفظ الصورة", lsShare: "مشاركة", lsCopy: "نسخ النص", lsCopied: "تم النسخ!",
    lsThread: "سلسلة", lsCopyThread: "نسخ السلسلة", lsPlay: "▶ تعليق صوتي", lsStop: "■ إيقاف",
    lsSharpen: "حسّن بالذكاء الاصطناعي", lsThinking: "جارٍ الكتابة…",
    lsMakingVideo: "جارٍ إنشاء الفيديو…", lsSaveVideo: "حفظ الفيديو", lsShareVideo: "مشاركة الفيديو", lsNoVideo: "لا يستطيع هذا المتصفح تسجيل الفيديو. الصورة جاهزة للنشر.",
    lsUpdated: "آخر تحديث {time}",
    m_goal: "هدف", m_pen: "هدف من ركلة جزاء", m_og: "هدف عكسي", m_red: "بطاقة حمراء", m_score: "تسجيل", m_update: "تحديث النتيجة", m_take: "رأي", m_ft: "نهاية المباراة",
    h_goal: ["{player} يسجل لـ{team} في {min}.", "هدف: {player}، {min}."],
    h_pen: ["{player} يسجل ركلة جزاء لـ{team} في {min}."],
    h_og: ["هدف عكسي في {min}: {line}."],
    h_red: ["بطاقة حمراء لـ{player} ({team}) في {min}."],
    h_score: ["{team} يسجل. {line}."],
    h_update: ["{status}: {line}."],
    h_take: ["{note}"],
    c_goal: "{player} يسجل لـ{team} في {min}. {line}.",
    c_pen: "{player} يسجل ركلة جزاء لـ{team} في {min}. {line}.",
    c_og: "هدف عكسي في {min}. {line}.",
    c_red: "طرد {player} ({team}) في {min}. {line}.",
    c_score: "{team} يسجل ({status}). {line}.",
    c_update: "{status}: {line}.",
    c_take: "رأيي ({status}، {line}): {note}",
    q_goal: "من سيفوز؟ 👇", q_pen: "من سيفوز؟ 👇", q_og: "من سيفوز؟ 👇", q_red: "قرار عادل؟ 👇",
    q_score: "من سيفوز؟ 👇", q_update: "توقعك؟ 👇", q_take: "توافق؟ 👇",
    r_comeback: "{winner} يعود من الخلف ويفوز. {line}.",
    r_late: "حُسمت بهدف في {min}. {line}.",
    r_blowout: "{winner} يفوز بفارق {diff}. {line}.",
    r_draw: "تنتهي بالتعادل. {line}.",
    r_win: "{winner} يفوز. {line}.",
    r_moments: "اللحظات الحاسمة:",
    r_question: "ما هي لحظة المباراة؟ 👇",
    r_story_comeback: "عودة", r_story_late: "هدف متأخر", r_story_blowout: "فوز كبير", r_story_draw: "تعادل", r_story_win: "فوز"
  }
};
Object.keys(I18N_LIVE).forEach((lang) => Object.assign(I18N[lang], I18N_LIVE[lang]));

// ---- Match state (saved on this device) ----

function lsLoad() {
  try {
    const m = JSON.parse(localStorage.getItem(LIVE_KEY));
    return m && m.id ? m : null;
  } catch {
    return null;
  }
}

function lsSave(m) {
  try {
    if (m) localStorage.setItem(LIVE_KEY, JSON.stringify(m));
    else localStorage.removeItem(LIVE_KEY);
  } catch {
    // storage unavailable; the game still follows until the page closes
  }
}

function lsEmoji(type, sport) {
  if (type === "pen" || type === "og") return LS_EMOJI.goal;
  const e = LS_EMOJI[type];
  return typeof e === "string" ? e : e[sport] || "🔥";
}

function lsArr(key) {
  const v = (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key];
  return Array.isArray(v) ? v : [v];
}

function lsFill(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function lsLine(m, hs, as) {
  return `${m.home} ${hs}–${as} ${m.away}`;
}

function lsHashtags(m) {
  return `#${tag(m.home)}v${tag(m.away)} ${m.state === "in" ? "#LIVE " : ""}${LS_HASH[m.sport] || ""} #LJSportMind`.replace(/\s+/g, " ").trim();
}

// Turns the feed's events into moments with the score after each one. If the goals don't add up
// to the official score (e.g. the feed is missing one), per-moment scores are dropped rather than guessed.
function lsMomentsFromFeed(game) {
  let hs = 0, as = 0;
  const moments = game.events.map((ev, i) => {
    const type = ev.type === "red" ? "red" : ev.ownGoal ? "og" : ev.penalty ? "pen" : "goal";
    if (ev.type === "goal") {
      if (ev.team === "h") hs += 1;
      else as += 1;
    }
    return { id: `f${i}-${ev.type}-${ev.minute}-${ev.player}`, type, team: ev.team, player: ev.player, clock: ev.minute, hs, as, minute: parseInt(ev.minute, 10) || 0 };
  });
  const consistent = hs === game.home.score && as === game.away.score;
  moments.forEach((mo) => (mo.scoreKnown = consistent));
  return moments;
}

function lsScoreOf(m, mo) {
  return mo.scoreKnown === false ? null : { hs: mo.hs, as: mo.as };
}

function lsWhen(m) {
  if (m.state === "pre" && m.start) return new Date(m.start).toLocaleString(currentLang, { weekday: "short", hour: "numeric", minute: "2-digit" });
  return m.detail || "";
}

// Goals by one player up to (and including) a given moment, from the feed only. Own goals don't count.
function lsPlayerGoals(m, player, upTo) {
  const goals = [];
  for (const mo of m.moments) {
    if ((mo.type === "goal" || mo.type === "pen") && mo.player === player) goals.push(mo);
    if (upTo && mo.id === upTo) break;
  }
  return goals;
}

// Hook and caption for one moment, from feed facts only.
function lsMomentText(m, mo) {
  const team = mo.team === "h" ? m.home : mo.team === "a" ? m.away : "";
  const sc = lsScoreOf(m, mo);
  const line = sc ? lsLine(m, sc.hs, sc.as) : `${m.home} v ${m.away}`;
  const goals = mo.player ? lsPlayerGoals(m, mo.player, mo.type === "spot" ? null : mo.id) : [];
  const vars = {
    team, player: mo.player || team, min: mo.clock, line, status: mo.status || m.detail, note: mo.note || "",
    league: m.leagueName || "", when: lsWhen(m), home: m.home, away: m.away, n: goals.length, mins: goals.map((g) => g.clock).join(", ")
  };
  let hookKey = `h_${mo.type}`, capKey = `c_${mo.type}`;
  if (mo.type === "goal" || mo.type === "pen") {
    if (goals.length === 2) hookKey = "h_brace";
    if (goals.length >= 3) hookKey = "h_hat";
  }
  if (mo.type === "spot") hookKey = goals.length > 1 ? "h_spotN" : "h_spot1";
  if (mo.type === "poll") capKey = m.sport === "soccer" ? "c_poll3" : "c_poll2";
  const hooks = lsArr(hookKey);
  const hook = lsFill(hooks[(mo.variant || 0) % hooks.length], vars);
  const caption = `${lsFill(lsArr(capKey)[0], vars)}\n\n${lsHashtags(m)}\n${t("lsCredit")}`;
  return { hook, caption, goals };
}

// The story of the result, only from what the feed shows: draw, comeback, late winner, big win or win.
function lsStory(m) {
  const { hs, as } = m;
  if (hs === as) return "draw";
  const winner = hs > as ? "h" : "a";
  const known = m.moments.filter((mo) => mo.scoreKnown && ["goal", "pen", "og"].includes(mo.type));
  if (known.some((mo) => (winner === "h" ? mo.hs < mo.as : mo.as < mo.hs))) return "comeback";
  const big = { soccer: 3, basketball: 20, football: 21, baseball: 6, hockey: 4 }[m.sport] || 3;
  if (Math.abs(hs - as) >= big) return "blowout";
  const last = known[known.length - 1];
  if (m.sport === "soccer" && last && last.minute >= 85 && Math.abs(hs - as) === 1 && last.team === winner) return "late";
  return "win";
}

function lsRecap(m) {
  const story = lsStory(m);
  const winner = m.hs > m.as ? m.home : m.away;
  const line = lsLine(m, m.hs, m.as);
  const lateGoal = m.moments.filter((mo) => mo.scoreKnown && ["goal", "pen", "og"].includes(mo.type)).pop();
  const hook = lsFill(t(`r_${story}`), { winner, line, diff: Math.abs(m.hs - m.as), min: lateGoal ? lateGoal.clock : "" });
  const key = m.moments.filter((mo) => mo.type !== "take" && mo.type !== "update").slice(0, 8);
  const row = (mo) => `${mo.clock} ${lsEmoji(mo.type, m.sport)} ${t(`m_${mo.type}`)} · ${mo.player || (mo.team === "h" ? m.home : m.away)}`;
  const caption = `${hook}\n\n${key.length ? `${t("r_moments")}\n${key.map(row).join("\n")}\n\n` : ""}${t("r_question")}\n\n${lsHashtags(m)}\n${t("lsCredit")}`;
  const takes = m.moments.filter((mo) => mo.type === "take").map((mo) => `💬 ${mo.note}`);
  const thread = [hook, ...key.map(row), ...takes, `${t("r_question")} ${t("lsCredit")}`]
    .map((x, i, all) => `${i + 1}/${all.length} ${x}`).join("\n\n");
  const voice = [hook, ...key.map((mo) => lsMomentText(m, mo).hook), t("r_question")].join(" ");
  return { story, hook, caption, thread, voice, key, row };
}

// ---- 9:16 graphic ----

// Wraps on spaces; a "word" wider than the line (e.g. Japanese or Chinese, which don't use spaces)
// is broken between characters instead.
function lsWrap(ctx, text, maxWidth) {
  const pieces = [];
  String(text).split(/\s+/).filter(Boolean).forEach((word) => {
    if (ctx.measureText(word).width <= maxWidth) return pieces.push({ t: word, space: true });
    [...word].forEach((ch, i) => pieces.push({ t: ch, space: i === 0 }));
  });
  const lines = [];
  let line = "";
  pieces.forEach(({ t: w, space }) => {
    const test = line ? `${line}${space ? " " : ""}${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function lsFit(ctx, text, maxWidth, size, weight, family) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`;
    s -= 6;
  } while (ctx.measureText(text).width > maxWidth && s > 40);
}

// Visual styles. Every style shows the same facts; only the look changes.
function lsTheme(name, opts) {
  const hex = (h, fb) => (/^[0-9a-f]{6}$/i.test(h || "") ? `#${h}` : fb);
  const rgb = (h) => {
    const n = parseInt(h.slice(1), 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  };
  if (name === "breaking") {
    return { bg: ["#0b0b0d", "#0b0b0d"], glow: "229, 56, 59", head: ["#ffffff", "#ffffff"], text: "#ffffff", sub: "#d6d6da", accent: "#e5383b", onAccent: "#ffffff", lines: "rgba(255, 255, 255, 0.05)", board: "rgba(255, 255, 255, 0.06)", stroke: "rgba(229, 56, 59, 0.7)", band: true, ticker: true };
  }
  if (name === "clean") {
    return { bg: ["#f6f4ef", "#ebe7de"], glow: null, head: ["#0b0b0d", "#2a2c33"], text: "#0b0b0d", sub: "#3a3d46", accent: "#c9974a", onAccent: "#0b0b0d", lines: "rgba(0, 0, 0, 0.05)", board: "rgba(0, 0, 0, 0.04)", stroke: "rgba(0, 0, 0, 0.18)", light: true };
  }
  if (name === "team") {
    const c = hex(opts.color, "#c9974a");
    const alt = hex(opts.alt, "#ffffff");
    const altUsable = alt.toLowerCase() !== c.toLowerCase() && alt.toLowerCase() !== "#000000";
    return { bg: [c, "#050608"], glow: rgb(c), head: ["#ffffff", "#ffffff"], text: "#ffffff", sub: "rgba(255, 255, 255, 0.85)", accent: altUsable ? alt : "#ffffff", onAccent: "#0b0b0d", lines: "rgba(255, 255, 255, 0.07)", board: "rgba(0, 0, 0, 0.35)", stroke: "rgba(255, 255, 255, 0.5)", team: true };
  }
  return { bg: ["#050608", "#050608"], glow: "233, 199, 123", head: ["#f6e1a6", "#9c6f2f"], text: "#f3f1ea", sub: "#d8d6cf", accent: "#e9c77b", onAccent: "#0b0b0d", lines: "rgba(233, 199, 123, 0.08)", board: "rgba(255, 255, 255, 0.05)", stroke: "rgba(233, 199, 123, 0.5)" };
}

// One frame of a post. p is time in seconds since the clip started; Infinity draws the finished still.
// Layout: a fixed top bar and footer, and a measured middle stack (hook, emoji, headline, team, panel,
// list or prompt) that is scaled down as a whole when it doesn't fit, so nothing overlaps or gets cut.
// Every line of text is also shrunk (and, as a last resort, shortened with …) to fit its width.
const LS_W = 1080, LS_H = 1920;
const lsEase = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const lsBack = (x) => {
  const k = Math.min(Math.max(x, 0), 1), c = 1.70158;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};
const lsSpan = (p, start, dur) => (p - start) / dur;

// Sets ctx.font to the largest size (down to min) where text fits maxWidth; returns the text,
// shortened with … only if it still doesn't fit at the minimum size.
function lsFitText(ctx, text, maxWidth, size, weight, family, min = 26) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && s > min) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

// Wraps text into at most maxLines lines at the largest font size (down to min) that fits.
function lsFitLines(ctx, text, maxWidth, size, weight, family, maxLines, min = 34) {
  for (let s = size; s >= min; s -= 2) {
    ctx.font = `${weight} ${s}px ${family}`;
    const lines = lsWrap(ctx, text, maxWidth);
    if (lines.length <= maxLines && lines.every((ln) => ctx.measureText(ln).width <= maxWidth)) return { lines, size: s };
  }
  ctx.font = `${weight} ${min}px ${family}`;
  const lines = lsWrap(ctx, text, maxWidth).slice(0, maxLines);
  lines[lines.length - 1] = lsFitText(ctx, lines[lines.length - 1], maxWidth, min, weight, family, min);
  return { lines, size: min };
}

function lsDraw(ctx, m, opts, p) {
  const W = LS_W, H = LS_H;
  const th = lsTheme(opts.theme, opts);
  const display = '"Space Grotesk", "Inter", system-ui, sans-serif';
  const body = '"Inter", system-ui, sans-serif';
  const emojiFont = 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  const still = p === Infinity;
  const kind = opts.kind || "moment";
  const headFill = (y0, y1) => {
    const g = ctx.createLinearGradient(0, y0, W, y1);
    g.addColorStop(0, th.head[0]);
    g.addColorStop(1, th.head[1]);
    return g;
  };

  // ---- Background, impact flash and slow drift ----
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, th.bg[0]);
  bg.addColorStop(th.team ? 0.55 : 1, th.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const flash = still ? 0 : Math.max(0, 1 - p / 0.6);
  if (th.glow) {
    const breathe = still ? 0 : 0.06 * Math.sin(p * 2.4);
    const glow = ctx.createRadialGradient(W / 2, 760, 40, W / 2, 760, 900 + flash * 300);
    glow.addColorStop(0, `rgba(${th.glow}, ${(opts.hot ? 0.38 : 0.22) + flash * 0.5 + breathe})`);
    glow.addColorStop(1, `rgba(${th.glow}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  } else if (flash > 0) {
    ctx.fillStyle = `rgba(201, 151, 74, ${flash * 0.25})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.strokeStyle = th.lines;
  ctx.lineWidth = 2;
  const drift = still ? 0 : (p * 40) % 90;
  for (let x = -H; x < W + 90; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x - drift, H);
    ctx.lineTo(x - drift + H, 0);
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ---- Top bar: status + clock, or a news band for "breaking" ----
  const top = still ? 1 : lsEase(lsSpan(p, 0, 0.5));
  ctx.save();
  ctx.translate(0, (1 - top) * -160);
  ctx.globalAlpha = top;
  if (th.band) {
    ctx.fillStyle = th.accent;
    ctx.fillRect(0, 70, W, 130);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    const left = lsFitText(ctx, opts.final ? opts.status : "BREAKING", W * 0.55, 72, 900, display, 36);
    ctx.fillText(left, 70, 138);
    ctx.textAlign = "right";
    const right = lsFitText(ctx, opts.clock || "", W * 0.35, 64, 700, display, 30);
    ctx.fillText(right, W - 70, 138);
  } else {
    const status = lsFitText(ctx, opts.status || "", W * 0.5, 40, 800, body, 26);
    const pw = ctx.measureText(status).width + 110;
    ctx.fillStyle = opts.final || kind === "matchday" ? th.accent : "#e5383b";
    ctx.beginPath();
    ctx.roundRect(80, 120, pw, 84, 42);
    ctx.fill();
    const blink = still || opts.final ? 1 : 0.55 + 0.45 * Math.cos(p * 6);
    ctx.globalAlpha = top * blink;
    ctx.fillStyle = opts.final || kind === "matchday" ? th.onAccent : "#ffffff";
    ctx.beginPath();
    ctx.arc(124, 162, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = top;
    ctx.textAlign = "left";
    ctx.fillText(status, 152, 164);
    ctx.textAlign = "right";
    ctx.fillStyle = th.text;
    const clock = lsFitText(ctx, opts.clock || "", W - 80 - (80 + pw) - 40, 76, 700, display, 30);
    ctx.fillText(clock, W - 80, 166);
  }
  ctx.restore();
  ctx.textAlign = "center";

  // ---- Footer: news ticker ("breaking") and credit ----
  const tickerTop = H - 330;
  if (th.ticker && opts.ticker) {
    const ty = tickerTop + 40;
    ctx.fillStyle = th.accent;
    ctx.fillRect(0, tickerTop, W, 80);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, tickerTop, W, 80);
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 42px ${body}`;
    ctx.textAlign = "left";
    const text = `${opts.ticker}   •   `;
    const tw = ctx.measureText(text).width;
    const off = still ? 0 : (p * 220) % tw;
    for (let x = 40 - off; x < W; x += tw) ctx.fillText(text, x, ty + 2);
    ctx.restore();
    ctx.textAlign = "center";
  }
  const cr = still ? 1 : lsEase(lsSpan(p, 2.6, 0.6));
  ctx.globalAlpha = cr;
  ctx.fillStyle = th.light ? "#9c6f2f" : th.team ? "#ffffff" : "#e9c77b";
  ctx.font = `700 44px ${display}`;
  ctx.fillText(lsFitText(ctx, opts.credit || "Made by @ljsoccer01", W - 160, 44, 700, display, 28), W / 2, H - 120);
  ctx.globalAlpha = 1;

  // ---- Middle stack: measure every block, then scale the stack to fit between the bars ----
  const safeTop = 240;
  const safeBottom = (th.ticker && opts.ticker ? tickerTop : H - 180) - 30;
  const textW = W - 160;
  const blocks = [];

  let hookFit = null;
  if (opts.hook) {
    hookFit = lsFitLines(ctx, opts.hook, textW - 40, 58, 800, display, 3, 34);
    blocks.push({ key: "hook", h: hookFit.lines.length * (hookFit.size * 1.25) + 16 });
  }
  if (opts.emoji) blocks.push({ key: "emoji", h: 200 });
  ctx.font = `900 210px ${display}`;
  const headline = lsFitText(ctx, opts.headline || "", textW, 210, 900, display, 70);
  const headSize = parseInt(ctx.font.match(/(\d+)px/)[1], 10);
  blocks.push({ key: "headline", h: headSize * 1.05, size: headSize, text: headline });
  if (opts.team) blocks.push({ key: "team", h: 96 });
  if (kind === "matchday") blocks.push({ key: "matchday", h: 3 * 130 });
  else if (kind === "poll") blocks.push({ key: "poll", h: (opts.options || []).length * 150 });
  else if (kind === "spotlight") blocks.push({ key: "spot", h: 220 });
  else blocks.push({ key: "board", h: 220 });
  const listRows = opts.list ? opts.list.slice(0, 6) : null;
  if (listRows) blocks.push({ key: "list", h: listRows.length * 64 + 10 });
  else if (opts.prompt) blocks.push({ key: "prompt", h: 128 });

  const avail = safeBottom - safeTop;
  const gap = 34;
  const natural = blocks.reduce((sum, b) => sum + b.h, 0) + gap * (blocks.length - 1);
  const k = Math.min(1, avail / natural);
  // Spare room is shared out as extra spacing (capped), so short posts don't bunch at the top.
  const spare = Math.max(0, avail - natural * k);
  const extra = Math.min(70, spare / (blocks.length + 1));
  let y = safeTop + extra + Math.max(0, spare - extra * (blocks.length + 1)) / 2;
  const at = {};
  blocks.forEach((b) => {
    at[b.key] = { y: y + (b.h * k) / 2, h: b.h * k };
    y += b.h * k + gap * k + extra;
  });

  // Draws a block centred at its slot, scaled by k, with its own entrance animation.
  const block = (key, draw) => {
    if (!at[key]) return;
    ctx.save();
    ctx.translate(W / 2, at[key].y);
    ctx.scale(k, k);
    draw();
    ctx.restore();
  };

  // Hook: on screen from the first frame (the first second decides whether people keep watching).
  block("hook", () => {
    const h = still ? 1 : lsEase(lsSpan(p, 0, 0.25));
    ctx.globalAlpha = h;
    ctx.font = `800 ${hookFit.size}px ${display}`;
    const lh = hookFit.size * 1.25;
    const y0 = -((hookFit.lines.length - 1) * lh) / 2;
    hookFit.lines.forEach((ln, i) => {
      const w = ctx.measureText(ln).width + 36;
      ctx.fillStyle = th.light ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.55)";
      ctx.beginPath();
      ctx.roundRect(-w / 2, y0 + i * lh - lh / 2 + 4, w, lh - 8, 14);
      ctx.fill();
      ctx.fillStyle = th.text;
      ctx.fillText(ln, 0, y0 + i * lh + 2);
    });
  });

  block("emoji", () => {
    const pop = still ? 1 : lsBack(lsSpan(p, 0.15, 0.6));
    if (pop <= 0) return;
    ctx.scale(pop, pop);
    ctx.font = `180px ${emojiFont}`;
    ctx.fillText(opts.emoji, 0, 0);
  });

  block("headline", () => {
    const slam = still ? 1 : lsEase(lsSpan(p, 0.45, 0.4));
    if (slam <= 0) return;
    const shake = still || p < 0.85 ? 0 : Math.max(0, 1 - lsSpan(p, 0.85, 0.35)) * Math.sin(p * 70) * 12;
    ctx.translate(shake, 0);
    const sc = 1 + (1 - slam) * 1.4;
    ctx.scale(sc, sc);
    ctx.globalAlpha = slam;
    const b = blocks.find((x) => x.key === "headline");
    ctx.font = `900 ${b.size}px ${display}`;
    ctx.fillStyle = headFill(-100, 100);
    ctx.fillText(b.text, 0, 0);
  });

  const sub = still ? 1 : lsEase(lsSpan(p, 1.0, 0.5));
  block("team", () => {
    ctx.globalAlpha = sub;
    ctx.fillStyle = th.text;
    const text = lsFitText(ctx, opts.team.toUpperCase(), textW, 76, 700, display, 34);
    ctx.fillText(text, 0, (1 - sub) * 40);
  });

  const rise = still ? 1 : lsEase(lsSpan(p, 1.3, 0.55));
  const panel = (h) => {
    ctx.fillStyle = th.board;
    ctx.strokeStyle = th.stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-(W - 140) / 2, -h / 2, W - 140, h, 36);
    ctx.fill();
    ctx.stroke();
  };

  block("board", () => {
    if (rise <= 0) return;
    ctx.globalAlpha = rise;
    ctx.translate(0, (1 - rise) * 120);
    panel(220);
    // Score in the middle gets the room it needs; team names share what's left. If the names would
    // have to shrink below a readable size, they move above the score, each with half the width.
    const scoreText = opts.hs === null || opts.hs === undefined ? "v" : `${opts.hs}–${opts.as}`;
    ctx.font = `800 120px ${display}`;
    const scoreTxt = lsFitText(ctx, scoreText, 380, 120, 800, display, 60);
    const scoreFont = ctx.font;
    const scoreW = ctx.measureText(scoreTxt).width;
    const sideW = (W - 140 - 80 - scoreW - 60) / 2;
    const fitsAt = (name, w) => {
      ctx.font = `700 40px ${body}`;
      return ctx.measureText(name).width <= w;
    };
    const stacked = !(fitsAt(m.home, sideW) && fitsAt(m.away, sideW));
    ctx.fillStyle = th.text;
    let scoreY = 6;
    if (stacked) {
      const half = (W - 140) / 2 - 50;
      ctx.textAlign = "left";
      ctx.fillText(lsFitText(ctx, m.home, half, 48, 700, body, 26), -(W - 140) / 2 + 40, -62);
      ctx.textAlign = "right";
      ctx.fillText(lsFitText(ctx, m.away, half, 48, 700, body, 26), (W - 140) / 2 - 40, -62);
      scoreY = 40;
    } else {
      ctx.textAlign = "left";
      ctx.fillText(lsFitText(ctx, m.home, sideW, 54, 700, body, 40), -(W - 140) / 2 + 40, 0);
      ctx.textAlign = "right";
      ctx.fillText(lsFitText(ctx, m.away, sideW, 54, 700, body, 40), (W - 140) / 2 - 40, 0);
    }
    ctx.textAlign = "center";
    const sp = still ? 1 : lsBack(lsSpan(p, 1.6, 0.5));
    ctx.translate(0, scoreY);
    ctx.scale(Math.max(sp, 0.01), Math.max(sp, 0.01));
    ctx.font = scoreFont;
    ctx.fillStyle = headFill(-60, 60);
    ctx.fillText(scoreTxt, 0, 0);
  });

  block("spot", () => {
    if (rise <= 0) return;
    ctx.globalAlpha = rise;
    ctx.translate(0, (1 - rise) * 120);
    panel(220);
    ctx.fillStyle = th.text;
    ctx.fillText(lsFitText(ctx, opts.detailLine || "", W - 240, 64, 800, display, 30), 0, 0);
  });

  block("matchday", () => {
    [opts.homeName, "VS", opts.awayName].forEach((txt, i) => {
      const a = still ? 1 : lsEase(lsSpan(p, 1.1 + i * 0.25, 0.5));
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate((1 - a) * (i === 1 ? 0 : i === 0 ? -200 : 200), (i - 1) * 130);
      if (i === 1) {
        ctx.fillStyle = th.accent;
        ctx.font = `800 64px ${display}`;
        ctx.fillText(txt, 0, 0);
      } else {
        ctx.fillStyle = th.text;
        ctx.fillText(lsFitText(ctx, String(txt || "").toUpperCase(), textW, 120, 900, display, 40), 0, 0);
      }
      ctx.restore();
    });
  });

  block("poll", () => {
    const list = opts.options || [];
    list.forEach((o, i) => {
      const a = still ? 1 : lsBack(lsSpan(p, 1.1 + i * 0.25, 0.45));
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      ctx.translate(0, (i - (list.length - 1) / 2) * 150);
      ctx.scale(Math.max(a, 0.01), Math.max(a, 0.01));
      const w = W - 180;
      ctx.fillStyle = th.board;
      ctx.strokeStyle = th.stroke;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -58, w, 116, 58);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = th.accent;
      ctx.beginPath();
      ctx.arc(-w / 2 + 66, 0, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = th.onAccent;
      ctx.font = `900 50px ${display}`;
      ctx.fillText(o.key, -w / 2 + 66, 3);
      ctx.fillStyle = th.text;
      ctx.textAlign = "left";
      ctx.fillText(lsFitText(ctx, o.label, w - 200, 56, 700, body, 26), -w / 2 + 140, 3);
      ctx.restore();
    });
  });

  block("list", () => {
    const rowsH = listRows.length * 64;
    ctx.fillStyle = th.sub;
    ctx.textAlign = "left";
    listRows.forEach((row, i) => {
      const a = still ? 1 : lsEase(lsSpan(p, 2.0 + i * 0.35, 0.4));
      if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.fillText(lsFitText(ctx, row, W - 240, 46, 600, body, 26), -(W - 220) / 2 + (1 - a) * 60, -rowsH / 2 + 32 + i * 64);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
  });

  block("prompt", () => {
    const q = still ? 1 : lsBack(lsSpan(p, 2.2, 0.5));
    if (q <= 0) return;
    const pulse = still ? 1 : 1 + 0.04 * Math.sin(Math.max(0, p - 2.7) * 5);
    ctx.scale(Math.max(q, 0.01) * pulse, Math.max(q, 0.01) * pulse);
    const text = lsFitText(ctx, opts.prompt, W - 260, 68, 800, display, 32);
    const w = ctx.measureText(text).width + 80;
    ctx.fillStyle = th.accent;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -60, w, 120, 60);
    ctx.fill();
    ctx.fillStyle = th.onAccent;
    ctx.fillText(text, 0, 4);
  });
  ctx.globalAlpha = 1;
}

function lsCard(m, opts) {
  const c = document.createElement("canvas");
  c.width = LS_W;
  c.height = LS_H;
  lsDraw(c.getContext("2d"), m, opts, Infinity);
  return c;
}

// ---- Auto video: the same graphic, animated, recorded on the device ----

const LS_VIDEO_SECS = 6;

function lsVideoType() {
  if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) return null;
  const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || null;
}

function lsRecord(m, opts) {
  const type = lsVideoType();
  if (!type) return Promise.reject(new Error("unsupported"));
  return new Promise((resolve, reject) => {
    const c = document.createElement("canvas");
    c.width = 720;
    c.height = 1280;
    const ctx = c.getContext("2d");
    ctx.scale(720 / LS_W, 1280 / LS_H);
    const stream = c.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 5000000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
    rec.onerror = () => reject(new Error("record"));
    rec.onstop = () => resolve({ blob: new Blob(chunks, { type: type.split(";")[0] }), ext: type.startsWith("video/mp4") ? "mp4" : "webm" });
    const start = performance.now();
    // A timer, not requestAnimationFrame, so the clip keeps rendering if the phone switches apps.
    const frame = () => {
      const p = (performance.now() - start) / 1000;
      lsDraw(ctx, m, opts, p);
      if (p >= LS_VIDEO_SECS) {
        clearInterval(timer);
        rec.stop();
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    lsDraw(ctx, m, opts, 0);
    rec.start(250);
    const timer = setInterval(frame, 1000 / 30);
  });
}

// ---- Interface ----

(function liveStudio() {
  const panel = document.getElementById("creatorPanel");
  const setup = document.getElementById("lsSetup");
  const gamesBox = document.getElementById("lsGames");
  const live = document.getElementById("lsLive");
  const drop = document.getElementById("lsDrop");
  const timeline = document.getElementById("lsTimeline");
  let match = lsLoad();
  let sport = (match && match.sport) || "soccer";
  let games = null; // null = loading, [] = none, or the list
  let feedError = false;
  let shown = null; // moment id, or "ft"
  let poll = 0;
  let listUpdatedAt = null;
  const STYLES = ["hype", "breaking", "clean", "team"];
  let style = "hype";
  try {
    style = STYLES.includes(localStorage.getItem("ljsportmind_live_style")) ? localStorage.getItem("ljsportmind_live_style") : "hype";
  } catch {
    // keep the default style
  }

  function save() {
    lsSave(match);
  }

  function btn(text, cls, onClick) {
    const b = el("button", cls, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function translate() {
    document.querySelectorAll("#creatorPanel [data-i18n], .hero-x [data-i18n]:not([data-i18n=heroCta])").forEach((n) => (n.textContent = t(n.dataset.i18n)));
    panel.querySelectorAll("[data-i18n-placeholder]").forEach((n) => (n.placeholder = t(n.dataset.i18nPlaceholder)));
    document.querySelectorAll('[data-i18n="tabCreator"]').forEach((n) => (n.textContent = t("tabCreator")));
    render();
  }

  // ---- Game picker ----

  // silent = background refresh: keep the current list on screen and swap in the new scores.
  async function loadGames(silent) {
    if (silent !== true) {
      games = null;
      feedError = false;
      renderGames();
    }
    const wanted = sport;
    // Try twice before showing an error: the feed occasionally blips for a second.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`/api/live?sport=${wanted}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        games = data.games || [];
        feedError = false;
        break;
      } catch {
        games = [];
        feedError = true;
        if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
      }
    }
    if (wanted !== sport) return;
    listUpdatedAt = feedError ? listUpdatedAt : new Date();
    renderGames();
  }

  function stateLabel(state) {
    return t(state === "in" ? "lsStateIn" : state === "post" ? "lsStatePost" : "lsStatePre");
  }

  function renderGames() {
    document.querySelectorAll(".ls-sport").forEach((b) => b.classList.toggle("active", b.dataset.sport === sport));
    document.getElementById("lsListUpdated").textContent = listUpdatedAt
      ? tf("lsUpdated", { time: listUpdatedAt.toLocaleTimeString(currentLang, { hour: "numeric", minute: "2-digit", second: "2-digit" }) })
      : "";
    gamesBox.innerHTML = "";
    if (games === null) return gamesBox.append(el("p", "ls-empty", t("lsLoading")));
    if (feedError) {
      gamesBox.append(el("p", "ls-empty", t("lsFeedError")));
      return gamesBox.append(btn(t("lsRefresh"), "secondary", loadGames));
    }
    if (!games.length) return gamesBox.append(el("p", "ls-empty", t("lsNoGames")));
    games.forEach((g) => {
      const b = btn("", `ls-game state-${g.state}`, () => follow(g));
      const teams = el("span", "ls-game-teams");
      teams.append(el("span", "", g.home.name), el("strong", "", g.state === "pre" ? "v" : `${g.home.score}–${g.away.score}`), el("span", "", g.away.name));
      const meta = el("span", "ls-game-meta");
      meta.append(el("span", `ls-badge ${g.state}`, stateLabel(g.state)), el("span", "", `${g.leagueName} · ${g.state === "pre" ? new Date(g.start).toLocaleTimeString(currentLang, { hour: "numeric", minute: "2-digit" }) : g.detail}`));
      b.append(meta, teams);
      gamesBox.append(b);
    });
  }

  // ---- Following a game ----

  function applyGame(g, announce) {
    const before = new Set(match.moments.map((mo) => mo.id));
    const feed = lsMomentsFromFeed(g);
    feed.forEach((mo) => {
      const existing = match.moments.find((x) => x.id === mo.id);
      if (existing) Object.assign(existing, { hs: mo.hs, as: mo.as, scoreKnown: mo.scoreKnown });
      else match.moments.push({ ...mo, variant: Math.floor(Math.random() * 4) });
    });
    // Football, baseball and hockey have no event feed here, so each change in the official score becomes a "score" moment.
    if (announce && match.updatedAt && ["football", "baseball", "hockey"].includes(match.sport) && match.state === "in" && (g.home.score !== match.hs || g.away.score !== match.as)) {
      const team = g.home.score > match.hs ? "h" : "a";
      match.moments.push({
        id: `s${g.home.score}-${g.away.score}`, type: "score", team, player: "", clock: g.detail, status: g.detail,
        hs: g.home.score, as: g.away.score, scoreKnown: true, minute: 0, variant: 0
      });
    }
    const wasLive = match.state !== "post";
    Object.assign(match, {
      hs: g.home.score, as: g.away.score, state: g.state, detail: g.detail, updatedAt: new Date().toISOString(),
      leagueName: g.leagueName, start: g.start, colors: { h: [g.home.color, g.home.alt], a: [g.away.color, g.away.alt] }
    });
    save();
    const fresh = match.moments.filter((mo) => !before.has(mo.id));
    if (announce && wasLive && g.state === "post") {
      shown = "ft";
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    } else if (announce && fresh.length) {
      shown = fresh[fresh.length - 1].id;
      if (navigator.vibrate) navigator.vibrate(40);
    }
    render();
  }

  async function refreshGame(announce) {
    if (!match) return;
    try {
      const res = await fetch(`/api/live?sport=${match.sport}&league=${encodeURIComponent(match.league)}&id=${encodeURIComponent(match.id)}`);
      const data = await res.json();
      if (!res.ok || !data.game) throw new Error(data.error);
      applyGame(data.game, announce);
    } catch {
      document.getElementById("lsStatusNote").textContent = t("lsFeedError");
    }
  }

  function startPolling() {
    clearInterval(poll);
    poll = setInterval(() => {
      if (match && match.state !== "post" && panel.classList.contains("active") && !document.hidden) refreshGame(true);
    }, LIVE_POLL_MS);
  }

  async function follow(g) {
    match = { id: g.id, league: g.league, leagueName: g.leagueName, start: g.start, sport: g.sport, home: g.home.name, away: g.away.name, hs: 0, as: 0, state: g.state, detail: g.detail, moments: [] };
    shown = null;
    save();
    render();
    live.scrollIntoView({ behavior: "smooth", block: "start" });
    await refreshGame(false);
    const feed = match.moments.filter((mo) => mo.type !== "take" && mo.type !== "update");
    shown = match.state === "post" ? "ft" : feed.length ? feed[feed.length - 1].id : null;
    render();
    startPolling();
  }

  // ---- Live view ----

  function renderBoard() {
    document.getElementById("lsHomeName").textContent = match.home;
    document.getElementById("lsAwayName").textContent = match.away;
    document.getElementById("lsHomeScore").textContent = match.state === "pre" ? "–" : match.hs;
    document.getElementById("lsAwayScore").textContent = match.state === "pre" ? "–" : match.as;
    document.getElementById("lsClock").textContent = match.detail || "";
    document.getElementById("lsStatus").textContent = t(match.state === "in" ? "lsLive" : match.state === "post" ? "lsFT" : "lsUpcoming");
    live.classList.toggle("is-ended", match.state === "post");
    live.classList.toggle("is-paused", match.state === "pre");
    const followKey = ["football", "baseball", "hockey"].includes(match.sport) ? "lsFollowingFootball" : match.sport === "basketball" ? "lsFollowingBasketball" : "lsFollowing";
    document.getElementById("lsStatusNote").textContent = t(match.state === "in" ? followKey : match.state === "post" ? "lsFinalNote" : "lsPreNote");
    document.getElementById("lsUpdated").textContent = match.updatedAt ? tf("lsUpdated", { time: new Date(match.updatedAt).toLocaleTimeString(currentLang, { hour: "numeric", minute: "2-digit", second: "2-digit" }) }) : "";
    document.getElementById("lsTakeForm").hidden = match.state === "pre";
    renderCreate();
    renderStyles();
  }

  function teamOf(mo) {
    return mo.team === "h" ? match.home : mo.team === "a" ? match.away : "";
  }

  function renderTimeline() {
    timeline.innerHTML = "";
    if (match.state === "post" && match.moments.length) {
      const li = el("li", shown === "ft" ? "active" : "");
      const b = btn("", "ls-tl-btn", () => showDrop("ft"));
      b.append(el("span", "ls-tl-min", "FT"), el("span", "ls-emoji", LS_EMOJI.ft), el("span", "ls-tl-text", t("m_ft")), el("span", "ls-tl-score", `${match.hs}–${match.as}`));
      li.append(b);
      timeline.append(li);
    }
    if (!match.moments.length) {
      timeline.append(el("li", "ls-empty", t("lsEmpty")));
      return;
    }
    match.moments.slice().reverse().forEach((mo) => {
      const sc = lsScoreOf(match, mo);
      const li = el("li", mo.id === shown ? "active" : "");
      const b = btn("", "ls-tl-btn", () => showDrop(mo.id));
      const text = mo.type === "take" ? mo.note : ["update", "matchday", "poll"].includes(mo.type) ? t(`m_${mo.type}`) : `${t(`m_${mo.type}`)} · ${mo.player || teamOf(mo)}`;
      b.append(el("span", "ls-tl-min", mo.clock), el("span", "ls-emoji", lsEmoji(mo.type, match.sport)), el("span", "ls-tl-text", text), el("span", "ls-tl-score", sc ? `${sc.hs}–${sc.as}` : ""));
      li.append(b);
      timeline.append(li);
    });
  }

  // Each moment's media: the still right away, then a short animated video recorded on the device.
  const videos = new Map(); // key -> Promise<{ url, file }>
  let videoQueue = Promise.resolve();

  function videoFor(key, opts, name) {
    if (!videos.has(key)) {
      const snapshot = { home: match.home, away: match.away };
      const job = videoQueue.then(() => lsRecord(snapshot, opts)).then(({ blob, ext }) => {
        const file = new File([blob], `${name}.${ext}`, { type: blob.type });
        return { url: URL.createObjectURL(blob), file };
      });
      videoQueue = job.catch(() => {});
      videos.set(key, job);
    }
    return videos.get(key);
  }

  function mediaBlock(key, opts, name) {
    const canvas = lsCard(match, opts);
    const wrap = el("div", "ls-card-wrap");
    const img = document.createElement("img");
    img.className = "ls-card-img";
    img.alt = "";
    img.src = canvas.toDataURL("image/png");
    wrap.append(img);
    const actions = el("div", "actions ls-drop-actions");
    const share = (file) => {
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file] }).catch(() => {});
    };
    const imgLink = el("a", "secondary ls-dl", t("lsSave"));
    imgLink.href = img.src;
    imgLink.download = `${name}.png`;
    actions.append(imgLink);
    if (!lsVideoType()) {
      wrap.append(el("p", "ls-note", t("lsNoVideo")));
      if (navigator.canShare) actions.append(btn(t("lsShare"), "secondary", () => canvas.toBlob((b) => share(new File([b], `${name}.png`, { type: "image/png" })))));
      return { wrap, actions };
    }
    const badge = el("span", "ls-making", t("lsMakingVideo"));
    wrap.append(badge);
    videoFor(key, opts, name).then(({ url, file }) => {
      if (!wrap.isConnected) return;
      const video = document.createElement("video");
      video.className = "ls-card-img";
      video.src = url;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      img.replaceWith(video);
      video.play().catch(() => {});
      badge.remove();
      const vLink = el("a", "btn-gold ls-dl", t("lsSaveVideo"));
      vLink.href = url;
      vLink.download = file.name;
      actions.prepend(vLink);
      if (navigator.canShare && navigator.canShare({ files: [file] })) actions.insertBefore(btn(t("lsShareVideo"), "secondary", () => share(file)), vLink.nextSibling);
    }).catch(() => {
      badge.textContent = t("lsNoVideo");
    });
    return { wrap, actions };
  }

  function copyBtn(label, text) {
    const b = btn(t(label), "secondary", async () => {
      try {
        await navigator.clipboard.writeText(text);
        b.textContent = t("lsCopied");
        setTimeout(() => (b.textContent = t(label)), 1500);
      } catch {
        // clipboard blocked; the text is on screen to copy by hand
      }
    });
    return b;
  }

  function showDrop(id) {
    shown = id;
    renderDrop();
    renderTimeline();
    drop.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function fileBase() {
    return `ljsportmind-${tag(match.home)}-${tag(match.away)}`;
  }

  function renderDrop() {
    drop.innerHTML = "";
    if (!shown) return;
    if (shown === "ft") return renderRecap();
    const mo = match.moments.find((x) => x.id === shown);
    if (!mo) return;
    const text = lsMomentText(match, mo);
    const ai = mo.ai || {};
    const hook = ai.hook || text.hook;
    const caption = ai.caption ? `${ai.caption}\n${t("lsCredit")}` : text.caption;
    const opts = { ...momentOpts(mo, text), hook, ticker: hook };
    if (ai.prompt && opts.prompt) opts.prompt = ai.prompt;
    const { wrap, actions } = mediaBlock(`${match.id}|${mo.id}|${style}|${currentLang}|${hook}|${opts.prompt}`, opts, `${fileBase()}-${tag(mo.clock)}-${mo.type}`);
    const body = el("div", "ls-drop-body");
    body.append(el("p", "ls-hook", hook), el("p", "ls-caption", caption));
    actions.append(copyBtn("lsCopy", caption));
    body.append(actions, aiPanel(mo, liveFacts(mo, text), (pick) => {
      mo.ai = { ...(mo.ai || {}), ...pick };
      save();
      renderDrop();
    }));
    const card = el("div", "card ls-drop");
    card.append(wrap, body);
    drop.append(card);
  }

  // Facts for the AI, in English and taken only from the feed (plus the user's own take, marked as opinion).
  const TYPE_NAMES = { goal: "goal", pen: "penalty goal", og: "own goal", red: "red card", score: "score change", update: "score update", take: "hot take", matchday: "matchday preview", poll: "who-wins poll", spot: "player spotlight" };
  function gameFacts() {
    return {
      sport: match.sport, league: match.leagueName || "", home: match.home, away: match.away,
      status: match.detail || "", score: match.state === "pre" ? "not started" : `${match.home} ${match.hs}–${match.as} ${match.away}`
    };
  }

  function liveFacts(mo, text) {
    const sc = lsScoreOf(match, mo);
    const parts = [TYPE_NAMES[mo.type] || mo.type];
    if (mo.player) parts.push(`player: ${mo.player}`);
    if (teamOf(mo)) parts.push(`team: ${teamOf(mo)}`);
    if (mo.clock && !["matchday", "poll"].includes(mo.type)) parts.push(`time: ${mo.clock}`);
    if (sc && !["matchday", "poll"].includes(mo.type)) parts.push(`score after it: ${match.home} ${sc.hs}–${sc.as} ${match.away}`);
    if (text.goals && text.goals.length > 1 && mo.player) parts.push(`${mo.player}'s goals in this game: ${text.goals.map((g) => g.clock).join(", ")}`);
    const feedEvents = match.moments.filter((x) => ["goal", "pen", "og", "red"].includes(x.type))
      .map((x) => `${x.clock} ${TYPE_NAMES[x.type]}${x.player ? ` ${x.player}` : ""} (${teamOf(x)})`).join("; ");
    return { ...gameFacts(), type: TYPE_NAMES[mo.type] || mo.type, moment: parts.join(", "), events: feedEvents, take: mo.type === "take" ? mo.note : "" };
  }

  function parseAiOptions(text) {
    try {
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      const list = (v) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 5) : []);
      return { hooks: list(json.hooks), captions: list(json.captions), prompts: list(json.prompts) };
    } catch {
      return null;
    }
  }

  // "Sharpen with AI": several hooks, captions and comment prompts to pick from. "Use this" swaps it into the post.
  function aiPanel(mo, facts, onPick) {
    const box = el("div", "ls-ai-panel needs-ai");
    const out = el("div", "ls-ai-out");
    const current = (mo ? mo.ai : match.ftAi) || {};
    const go = btn(`✨ ${t("lsSharpen")}`, "ls-ai-btn", async () => {
      go.disabled = true;
      out.innerHTML = "";
      out.append(el("p", "ls-empty", t("lsThinking")));
      const reply = await callAssistant({ mode: "live", live: facts });
      go.disabled = false;
      go.textContent = `✨ ${t("lsAiAgain")}`;
      out.innerHTML = "";
      if (!reply.text) {
        out.append(el("p", "ls-ai-note", reply.code === "not_configured" ? t("lsAiOff") : reply.error));
        return;
      }
      const options = parseAiOptions(reply.text);
      if (!options) {
        out.append(el("p", "ls-caption", reply.text));
        return;
      }
      const group = (titleKey, items, field) => {
        if (!items.length) return;
        out.append(el("p", "ls-sub", t(titleKey)));
        items.forEach((item) => {
          const row = el("div", `ls-ai-opt ${current[field] === item ? "in-use" : ""}`);
          row.append(el("p", "", item));
          const acts = el("div", "ls-ai-acts");
          acts.append(btn(current[field] === item ? t("lsInUse") : t("lsUse"), "ls-chip", () => onPick({ [field]: item })), copyBtn("lsCopy", item));
          row.append(acts);
          out.append(row);
        });
      };
      group("lsAiHooks", options.hooks, "hook");
      group("lsAiCaptions", options.captions, "caption");
      group("lsAiPrompts", options.prompts, "prompt");
    });
    box.append(go, out);
    return box;
  }

  function colorsFor(team) {
    const c = (match.colors && match.colors[team || "h"]) || [];
    return { color: c[0] || "", alt: c[1] || "" };
  }

  function statusLabel() {
    return t(match.state === "post" ? "lsFT" : match.state === "pre" ? "lsUpcoming" : "lsLive");
  }

  // What to draw for each kind of post. Every value comes from the feed or from what the user typed as a take.
  function momentOpts(mo, text) {
    const sc = lsScoreOf(match, mo);
    const base = { theme: style, credit: t("lsCredit"), ...colorsFor(mo.team), status: statusLabel(), clock: mo.clock, emoji: lsEmoji(mo.type, match.sport), hook: text.hook, ticker: text.hook };
    if (mo.type === "matchday") {
      return { ...base, kind: "matchday", status: statusLabel(), clock: mo.clock, headline: t("m_matchday").toUpperCase(), homeName: match.home, awayName: match.away, prompt: t("q_matchday") };
    }
    if (mo.type === "poll") {
      const opts3 = [{ key: "1", label: match.home }, { key: "X", label: t("lsDrawOpt") }, { key: "2", label: match.away }];
      const options = match.sport === "soccer" ? opts3 : [opts3[0], opts3[2]];
      return { ...base, kind: "poll", headline: t("m_poll").toUpperCase(), options, prompt: t(match.sport === "soccer" ? "q_poll3" : "q_poll2") };
    }
    if (mo.type === "spot") {
      const n = text.goals.length;
      const headline = (n >= 3 ? t("m_hat") : n === 2 ? t("m_brace") : t("m_goal")).toUpperCase() + "!";
      return { ...base, kind: "spotlight", headline, team: `${mo.player} · ${teamOf(mo)}`, detailLine: `⚽ ${text.goals.map((g) => g.clock).join(" · ")}`, prompt: t("q_spot"), hot: true };
    }
    let label = t(`m_${mo.type}`);
    if (mo.type === "goal" || mo.type === "pen") {
      if (text.goals.length === 2) label = t("m_brace");
      if (text.goals.length >= 3) label = t("m_hat");
    }
    return {
      ...base, kind: "moment",
      headline: `${label.toUpperCase()}${["goal", "pen"].includes(mo.type) ? "!" : ""}`,
      team: mo.type === "update" || mo.type === "take" ? "" : mo.player ? `${mo.player} · ${teamOf(mo)}` : teamOf(mo),
      hs: sc ? sc.hs : null, as: sc ? sc.as : null, prompt: t(`q_${mo.type}`), hot: ["goal", "pen", "og"].includes(mo.type)
    };
  }

  function scorers() {
    const seen = new Map();
    match.moments.forEach((mo) => {
      if ((mo.type === "goal" || mo.type === "pen") && mo.player && !seen.has(mo.player)) seen.set(mo.player, mo.team);
    });
    return [...seen.entries()];
  }

  // The "Create" options: post types beyond the automatic event posts.
  function renderCreate() {
    const box = document.getElementById("lsCreateTiles");
    box.innerHTML = "";
    const tile = (emoji, key, onClick, hidden) => {
      if (hidden) return;
      const b = btn("", "ls-tile", onClick);
      b.append(el("span", "ls-tile-emoji", emoji), el("span", "", t(key)));
      box.append(b);
    };
    tile("🗓️", "cMatchday", () => addOwnMoment("matchday"));
    tile("🗳️", "cPoll", () => addOwnMoment("poll"), match.state === "post");
    tile("📊", "cScore", async () => {
      await refreshGame(false);
      addOwnMoment("update");
    }, match.state === "pre");
    tile("⭐", "cSpot", () => {
      const row = document.getElementById("lsSpotRow");
      row.hidden = !row.hidden;
      renderSpotRow();
    }, match.sport !== "soccer" || match.state === "pre");
    tile("🏁", "cRecap", () => showDrop("ft"), match.state !== "post");
  }

  function renderSpotRow() {
    const row = document.getElementById("lsSpotRow");
    row.innerHTML = "";
    const list = scorers();
    if (!list.length) return row.append(el("p", "ls-empty", t("lsNoScorers")));
    list.forEach(([player, team]) => {
      const n = lsPlayerGoals(match, player).length;
      row.append(btn(`⭐ ${player}${n > 1 ? ` ×${n}` : ""}`, "ls-chip", () => {
        row.hidden = true;
        addOwnMoment("spot", "", { player, team });
      }));
    });
  }

  function renderStyles() {
    const box = document.getElementById("lsStyles");
    box.innerHTML = "";
    STYLES.forEach((st) => {
      const b = btn(t(`st${st[0].toUpperCase()}${st.slice(1)}`), `ls-chip ${st === style ? "active" : ""}`, () => {
        style = st;
        try {
          localStorage.setItem("ljsportmind_live_style", st);
        } catch {
          // style won't persist
        }
        renderStyles();
        renderDrop();
      });
      b.dataset.style = st;
      box.append(b);
    });
  }

  function renderRecap() {
    const r = lsRecap(match);
    const rows = r.key.map((mo) => `${mo.clock} ${t(`m_${mo.type}`)} · ${mo.player || teamOf(mo)}`);
    const ai = match.ftAi || {};
    const hook = ai.hook || r.hook;
    const caption = ai.caption ? `${ai.caption}\n${t("lsCredit")}` : r.caption;
    const opts = {
      theme: style, credit: t("lsCredit"), ...colorsFor(match.hs >= match.as ? "h" : "a"), ticker: hook,
      status: t("lsFT"), clock: "FT", emoji: LS_EMOJI.ft, headline: t(`r_story_${r.story}`).toUpperCase(),
      team: "", hs: match.hs, as: match.as, hook, list: rows.length ? rows : null, prompt: rows.length ? "" : (ai.prompt || t("r_question")), final: true, hot: true
    };
    const { wrap, actions } = mediaBlock(`${match.id}|ft|${match.moments.length}|${style}|${currentLang}|${hook}`, opts, `${fileBase()}-full-time`);
    const body = el("div", "ls-drop-body");
    body.append(el("p", "ls-hook", hook), el("p", "ls-caption", caption));
    actions.append(copyBtn("lsCopy", caption));
    body.append(actions);
    body.append(el("p", "ls-sub", t("lsThread")), el("p", "ls-caption ls-thread", r.thread));
    const more = el("div", "actions ls-drop-actions");
    more.append(copyBtn("lsCopyThread", r.thread));
    if ("speechSynthesis" in window) {
      const play = btn(t("lsPlay"), "secondary", () => {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
          play.textContent = t("lsPlay");
          return;
        }
        const u = new SpeechSynthesisUtterance(r.voice);
        u.lang = SPEECH_LANGS[currentLang] || "en-US";
        u.onend = () => (play.textContent = t("lsPlay"));
        speechSynthesis.speak(u);
        play.textContent = t("lsStop");
      });
      more.append(play);
    }
    body.append(more, aiPanel(null, {
      ...gameFacts(), type: "full-time recap", story: t(`r_story_${r.story}`),
      events: rows.join("; ") || "none reported", take: match.moments.filter((mo) => mo.type === "take").map((mo) => mo.note).join("; ")
    }, (pick) => {
      match.ftAi = { ...(match.ftAi || {}), ...pick };
      save();
      renderDrop();
    }));
    const card = el("div", "card ls-drop ls-recap");
    card.append(wrap, body);
    drop.append(card);
  }

  function render() {
    setup.hidden = !!match;
    live.hidden = !match;
    if (!match) {
      drop.innerHTML = "";
      renderGames();
      return;
    }
    renderBoard();
    renderTimeline();
    renderDrop();
  }

  function addOwnMoment(type, note, extra) {
    if (!match || (match.state === "pre" && !["matchday", "poll"].includes(type))) return;
    const mo = {
      id: `u${Date.now().toString(36)}`, type, note: note || "", team: null, player: "", ...(extra || {}),
      clock: match.sport === "soccer" ? (match.detail.match(/\d+'(\+\d+')?/) || [match.detail])[0] : match.detail,
      status: match.detail, hs: match.hs, as: match.as, scoreKnown: true, minute: 0, variant: 0
    };
    if (type === "matchday" || type === "poll") mo.clock = lsWhen(match);
    match.moments.push(mo);
    save();
    showDrop(mo.id);
  }

  document.querySelectorAll(".ls-sport").forEach((b) => b.addEventListener("click", () => {
    sport = b.dataset.sport;
    loadGames();
  }));
  document.getElementById("lsRefreshBtn").addEventListener("click", loadGames);
  document.getElementById("lsTakeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("lsTakeInput");
    const note = input.value.trim();
    if (!note) return;
    input.value = "";
    addOwnMoment("take", note);
  });
  document.getElementById("lsNewBtn").addEventListener("click", () => {
    clearInterval(poll);
    match = null;
    shown = null;
    save();
    render();
    if (!games || !games.length) loadGames();
  });

  // Opening the studio (or coming back to the app) refreshes the list or the followed game straight away.
  const refreshNow = () => {
    if (match && match.state !== "post") refreshGame(true);
    else if (!match) loadGames(!!(games && games.length));
  };
  document.querySelectorAll('.tab[data-tab="creator"]').forEach((tab) => tab.addEventListener("click", refreshNow));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && panel.classList.contains("active")) refreshNow();
  });
  // The game list keeps itself up to date too: scores, new kickoffs and finals every 30 seconds.
  setInterval(() => {
    if (!match && games && panel.classList.contains("active") && !document.hidden) loadGames(true);
  }, LIST_POLL_MS);

  // A finished game left open from an earlier day gives way to today's list.
  if (match && match.state === "post" && match.updatedAt && Date.now() - new Date(match.updatedAt).getTime() > 6 * 3600 * 1000) {
    match = null;
    save();
  }

  if (match) {
    const feed = match.moments.filter((mo) => mo.type !== "take" && mo.type !== "update");
    shown = match.state === "post" ? "ft" : feed.length ? feed[feed.length - 1].id : null;
    startPolling();
  }
  // ---- Intro: live-scores strip and LIVE Studio shortcuts ----
  const heroTicker = document.getElementById("heroTicker");
  const heroRun = document.getElementById("heroTickerRun");
  let heroGames = [];
  function renderHeroTicker() {
    if (!heroGames.length) {
      heroTicker.hidden = true;
      return;
    }
    heroRun.innerHTML = "";
    const item = (g) => {
      const span = el("span", `hero-tk ${g.state}`);
      span.append(
        el("span", "hero-tk-state", g.state === "in" ? `● ${g.detail}` : t("lsStatePost")),
        el("span", "", `${g.home.name} ${g.home.score}–${g.away.score} ${g.away.name}`),
        el("span", "hero-tk-league", g.leagueName)
      );
      return span;
    };
    // Two copies side by side make the scroll loop seamlessly.
    for (let copy = 0; copy < 2; copy++) heroGames.forEach((g) => heroRun.append(item(g)));
    heroRun.style.animationDuration = `${Math.max(20, heroGames.length * 6)}s`;
    heroTicker.hidden = false;
  }
  async function loadHeroTicker() {
    try {
      const lists = await Promise.all(["soccer", "basketball", "football", "hockey", "baseball"].map((sp) =>
        fetch(`/api/live?sport=${sp}`).then((r) => (r.ok ? r.json() : { games: [] })).catch(() => ({ games: [] }))));
      // Live games first, then finals, taking turns across sports so the strip isn't all one league.
      const mix = (state) => {
        const pools = lists.map((d) => (d.games || []).filter((g) => g.state === state));
        const out = [];
        for (let i = 0; pools.some((pl) => pl[i]); i++) pools.forEach((pl) => pl[i] && out.push(pl[i]));
        return out;
      };
      heroGames = [...mix("in"), ...mix("post")].slice(0, 14);
    } catch {
      heroGames = [];
    }
    renderHeroTicker();
  }
  const openLive = () => {
    document.querySelector('.tab[data-tab="creator"]').click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  document.getElementById("heroLiveBtn").addEventListener("click", openLive);
  document.getElementById("heroLiveCard").addEventListener("click", openLive);
  loadHeroTicker();
  setInterval(() => !document.hidden && loadHeroTicker(), 60000);

  document.getElementById("langSelect").addEventListener("change", () => {
    translate();
    renderHeroTicker();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => match && renderDrop());
  translate();
})();
