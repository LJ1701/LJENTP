const LANG_KEY = "ljsportmind_lang";
let currentLang = localStorage.getItem(LANG_KEY) || "en";

const I18N = {
  en: {
    tagline: "Discover Your Path. Create Your Impact.",
    tabPassport: "Sports Passport",
    tabCreator: "Creator Studio",
    pNameLabel: "Name",
    pNamePlaceholder: "e.g. Luis Juarez",
    pLocationLabel: "Location",
    pLocationPlaceholder: "e.g. Los Angeles, CA",
    pRoleLabel: "Current role / experience",
    rolePlayer: "Player",
    roleFormerPlayer: "Former Player",
    roleCoach: "Coach",
    roleStudent: "Student",
    roleContentCreator: "Content Creator",
    roleFan: "Fan / Enthusiast",
    roleOther: "Other",
    skillsLabel: "Skills (select all that apply)",
    skillVideoEditing: "Video Editing",
    skillWriting: "Writing",
    skillCoaching: "Coaching",
    skillDataAnalytics: "Data & Analytics",
    skillSocialMedia: "Social Media",
    skillPlayingExperience: "Playing Experience",
    skillEventManagement: "Event Management",
    skillMarketingSales: "Marketing & Sales",
    skillPhotographyDesign: "Photography / Design",
    skillBroadcasting: "Broadcasting / On-Camera",
    interestsLabel: "Interests (select all that apply)",
    interestContentCreation: "Content Creation",
    interestCoachingDev: "Coaching & Player Development",
    interestScouting: "Scouting & Analytics",
    interestJournalism: "Journalism & Broadcasting",
    interestMarketing: "Marketing & Sponsorship",
    interestEventOps: "Event Operations",
    interestFrontOffice: "Front Office / Team Ops",
    interestPersonalBrand: "Personal Brand Building",
    pGoalLabel: "Career goal",
    goalMedia: "Break into sports media / content",
    goalCoach: "Become a coach",
    goalFrontOffice: "Work in a team front office",
    goalBrand: "Build my own personal brand",
    goalAnalytics: "Become a scout / analyst",
    goalExplore: "Still exploring",
    findMyFit: "Find My Fit",
    yourPassport: "Your Sports Passport",
    teamALabel: "Team A",
    teamAPlaceholder: "e.g. Arsenal",
    teamBLabel: "Team B",
    teamBPlaceholder: "e.g. Chelsea",
    scoreALabel: "Score A",
    scoreBLabel: "Score B",
    sportLabel: "Sport",
    sportSoccer: "Soccer",
    sportBasketball: "Basketball",
    sportFootball: "Football",
    sportBaseball: "Baseball",
    sportOther: "Other",
    momentTypeLabel: "What kind of moment was it?",
    momentComeback: "Comeback",
    momentBlowout: "Blowout",
    momentBuzzer: "Last-Minute / Buzzer-Beater Winner",
    momentUpset: "Upset",
    momentControversial: "Controversial Call",
    momentMilestone: "Milestone / Record",
    momentClose: "Close, Back-and-Forth Game",
    momentOther: "Other",
    keyMomentLabel: "Key moment",
    keyMomentPlaceholder: "e.g. 89th-minute equalizer off a corner kick",
    observationLabel: "Your take / observation (optional)",
    observationPlaceholder: "e.g. Their defense fell apart after the red card",
    generateContent: "Generate Content Ideas",
    regenerate: "Regenerate",
    contentHook: "Content Hook",
    videoIdea: "Short-Form Video Idea",
    engagementQuestion: "Engagement Question",
    captionLabel: "Caption",
    voiceoverScript: "Voiceover Script",
    playVoiceover: "▶ Play Voiceover",
    stopVoiceover: "■ Stop",
    copyScript: "Copy Script",
    ttsWarning: "Your browser doesn't support built-in text-to-speech playback. You can still read/copy the script above.",
    nextStepLabel: "Next step:",
    matchedOnLabel: "Matched on:",
    selectMoreSkills: "Select a few more skills or interests to see career path matches.",
    copiedLabel: "Copied!",
    youFallback: "You",
    beatHook: "Hook",
    beatSetup: "Setup",
    beatMoment: "The Moment",
    beatYourTake: "Your Take",
    beatCTA: "CTA",
    tailoredFor: "Tailored for {name} — {goal}",
    defaultTakeLine: "This is exactly the kind of moment that decides games.",
    setupLine: "{teamA} {scoreA} - {scoreB} {teamB}. Here's what happened."
  },
  es: {
    tagline: "Descubre Tu Camino. Crea Tu Impacto.",
    tabPassport: "Pasaporte Deportivo",
    tabCreator: "Estudio Creativo",
    pNameLabel: "Nombre",
    pNamePlaceholder: "ej. Luis Juárez",
    pLocationLabel: "Ubicación",
    pLocationPlaceholder: "ej. Los Ángeles, CA",
    pRoleLabel: "Rol / experiencia actual",
    rolePlayer: "Jugador",
    roleFormerPlayer: "Ex-Jugador",
    roleCoach: "Entrenador",
    roleStudent: "Estudiante",
    roleContentCreator: "Creador de Contenido",
    roleFan: "Aficionado",
    roleOther: "Otro",
    skillsLabel: "Habilidades (selecciona todas las que apliquen)",
    skillVideoEditing: "Edición de Video",
    skillWriting: "Escritura",
    skillCoaching: "Entrenamiento",
    skillDataAnalytics: "Datos y Análisis",
    skillSocialMedia: "Redes Sociales",
    skillPlayingExperience: "Experiencia como Jugador",
    skillEventManagement: "Gestión de Eventos",
    skillMarketingSales: "Marketing y Ventas",
    skillPhotographyDesign: "Fotografía / Diseño",
    skillBroadcasting: "Locución / Frente a Cámara",
    interestsLabel: "Intereses (selecciona todos los que apliquen)",
    interestContentCreation: "Creación de Contenido",
    interestCoachingDev: "Entrenamiento y Desarrollo de Jugadores",
    interestScouting: "Scouting y Análisis",
    interestJournalism: "Periodismo y Locución",
    interestMarketing: "Marketing y Patrocinios",
    interestEventOps: "Operaciones de Eventos",
    interestFrontOffice: "Front Office / Operaciones de Equipo",
    interestPersonalBrand: "Construcción de Marca Personal",
    pGoalLabel: "Objetivo profesional",
    goalMedia: "Entrar en medios deportivos / contenido",
    goalCoach: "Convertirme en entrenador",
    goalFrontOffice: "Trabajar en la oficina de un equipo",
    goalBrand: "Construir mi propia marca personal",
    goalAnalytics: "Convertirme en scout / analista",
    goalExplore: "Aún explorando",
    findMyFit: "Encontrar Mi Camino",
    yourPassport: "Tu Pasaporte Deportivo",
    teamALabel: "Equipo A",
    teamAPlaceholder: "ej. Arsenal",
    teamBLabel: "Equipo B",
    teamBPlaceholder: "ej. Chelsea",
    scoreALabel: "Marcador A",
    scoreBLabel: "Marcador B",
    sportLabel: "Deporte",
    sportSoccer: "Fútbol",
    sportBasketball: "Baloncesto",
    sportFootball: "Fútbol Americano",
    sportBaseball: "Béisbol",
    sportOther: "Otro",
    momentTypeLabel: "¿Qué tipo de momento fue?",
    momentComeback: "Remontada",
    momentBlowout: "Paliza",
    momentBuzzer: "Victoria de Último Minuto",
    momentUpset: "Sorpresa",
    momentControversial: "Jugada Polémica",
    momentMilestone: "Hito / Récord",
    momentClose: "Partido Cerrado y Reñido",
    momentOther: "Otro",
    keyMomentLabel: "Momento clave",
    keyMomentPlaceholder: "ej. Empate al minuto 89 de tiro de esquina",
    observationLabel: "Tu opinión / observación (opcional)",
    observationPlaceholder: "ej. Su defensa se desmoronó tras la tarjeta roja",
    generateContent: "Generar Ideas de Contenido",
    regenerate: "Regenerar",
    contentHook: "Gancho de Contenido",
    videoIdea: "Idea de Video Corto",
    engagementQuestion: "Pregunta de Interacción",
    captionLabel: "Descripción",
    voiceoverScript: "Guion de Voz en Off",
    playVoiceover: "▶ Reproducir Voz en Off",
    stopVoiceover: "■ Detener",
    copyScript: "Copiar Guion",
    ttsWarning: "Tu navegador no admite la reproducción de voz integrada. Aún puedes leer/copiar el guion de arriba.",
    nextStepLabel: "Siguiente paso:",
    matchedOnLabel: "Coincide con:",
    selectMoreSkills: "Selecciona algunas habilidades o intereses más para ver coincidencias de carreras.",
    copiedLabel: "¡Copiado!",
    youFallback: "Tú",
    beatHook: "Gancho",
    beatSetup: "Contexto",
    beatMoment: "El Momento",
    beatYourTake: "Tu Opinión",
    beatCTA: "Llamado a la Acción",
    tailoredFor: "Personalizado para {name} — {goal}",
    defaultTakeLine: "Este es exactamente el tipo de momento que decide los partidos.",
    setupLine: "{teamA} {scoreA} - {scoreB} {teamB}. Esto es lo que pasó."
  },
  zh: {
    tagline: "发现你的方向，创造你的影响力。",
    tabPassport: "体育护照",
    tabCreator: "创作工作室",
    pNameLabel: "姓名",
    pNamePlaceholder: "例如：路易斯·华雷斯",
    pLocationLabel: "所在地",
    pLocationPlaceholder: "例如：洛杉矶，加利福尼亚州",
    pRoleLabel: "当前身份/经历",
    rolePlayer: "球员",
    roleFormerPlayer: "退役球员",
    roleCoach: "教练",
    roleStudent: "学生",
    roleContentCreator: "内容创作者",
    roleFan: "球迷/爱好者",
    roleOther: "其他",
    skillsLabel: "技能（可多选）",
    skillVideoEditing: "视频剪辑",
    skillWriting: "写作",
    skillCoaching: "教练指导",
    skillDataAnalytics: "数据与分析",
    skillSocialMedia: "社交媒体",
    skillPlayingExperience: "球员经验",
    skillEventManagement: "赛事管理",
    skillMarketingSales: "市场与销售",
    skillPhotographyDesign: "摄影/设计",
    skillBroadcasting: "解说/镜头表现",
    interestsLabel: "兴趣（可多选）",
    interestContentCreation: "内容创作",
    interestCoachingDev: "教练与球员发展",
    interestScouting: "球探与数据分析",
    interestJournalism: "新闻与解说",
    interestMarketing: "市场与赞助",
    interestEventOps: "赛事运营",
    interestFrontOffice: "球队管理层/运营",
    interestPersonalBrand: "打造个人品牌",
    pGoalLabel: "职业目标",
    goalMedia: "进入体育媒体/内容行业",
    goalCoach: "成为教练",
    goalFrontOffice: "在球队管理层工作",
    goalBrand: "打造我自己的个人品牌",
    goalAnalytics: "成为球探/分析师",
    goalExplore: "还在探索中",
    findMyFit: "找到我的方向",
    yourPassport: "你的体育护照",
    teamALabel: "球队 A",
    teamAPlaceholder: "例如：阿森纳",
    teamBLabel: "球队 B",
    teamBPlaceholder: "例如：切尔西",
    scoreALabel: "比分 A",
    scoreBLabel: "比分 B",
    sportLabel: "运动项目",
    sportSoccer: "足球",
    sportBasketball: "篮球",
    sportFootball: "美式橄榄球",
    sportBaseball: "棒球",
    sportOther: "其他",
    momentTypeLabel: "这是什么类型的时刻？",
    momentComeback: "逆转",
    momentBlowout: "大胜",
    momentBuzzer: "绝杀/最后一刻取胜",
    momentUpset: "爆冷",
    momentControversial: "争议判罚",
    momentMilestone: "里程碑/纪录",
    momentClose: "势均力敌的胶着比赛",
    momentOther: "其他",
    keyMomentLabel: "关键时刻",
    keyMomentPlaceholder: "例如：第89分钟角球扳平比分",
    observationLabel: "你的看法/观察（可选）",
    observationPlaceholder: "例如：红牌之后他们的防线崩溃了",
    generateContent: "生成内容创意",
    regenerate: "重新生成",
    contentHook: "内容开场白",
    videoIdea: "短视频创意",
    engagementQuestion: "互动问题",
    captionLabel: "文案",
    voiceoverScript: "配音脚本",
    playVoiceover: "▶ 播放配音",
    stopVoiceover: "■ 停止",
    copyScript: "复制脚本",
    ttsWarning: "你的浏览器不支持内置语音朗读。你仍然可以阅读/复制上面的脚本。",
    nextStepLabel: "下一步：",
    matchedOnLabel: "匹配依据：",
    selectMoreSkills: "请再选择一些技能或兴趣，以查看职业方向匹配结果。",
    copiedLabel: "已复制！",
    youFallback: "你",
    beatHook: "开场",
    beatSetup: "背景",
    beatMoment: "关键时刻",
    beatYourTake: "你的看法",
    beatCTA: "行动号召",
    tailoredFor: "为{name}定制 — {goal}",
    defaultTakeLine: "这正是决定比赛走向的关键时刻。",
    setupLine: "{teamA} {scoreA} - {scoreB} {teamB}。事情是这样的。"
  }
};

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

const TEMPLATES = {
  en: {
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
  },
  es: {
    comeback: {
      hook: [
        "Nadie esperaba que {teamA} se llevara la victoria después de ir perdiendo temprano.",
        "{teamA} parecía acabado... hasta que no lo estuvo.",
        "Así se remonta un marcador: {teamA} vs {teamB}."
      ],
      video: [
        "Análisis cuadro por cuadro del momento exacto en que {teamA} le dio la vuelta al partido.",
        "\"El Punto de Quiebre\" — un resumen de 45 segundos de {keyMoment}.",
        "Reacciona a la remontada: reproduce el video de {keyMoment} y congela las reacciones."
      ],
      question: [
        "¿{teamB} se vino abajo, o {teamA} simplemente lo quiso más?",
        "¿Cuál fue el verdadero punto de quiebre — {keyMoment}, o algo anterior?"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}. ¿Fuera del partido? Esta vez no. 🔥 #{teamATag} #{teamBTag} #Remontada"
      ]
    },
    blowout: {
      hook: [
        "{teamA} no solo venció a {teamB} — mandó un mensaje.",
        "{scoreA} - {scoreB}. No hay otra forma de decirlo: una victoria contundente para {teamA}."
      ],
      video: [
        "Las 3 mejores jugadas de la dominación de {teamA}, centradas en {keyMoment}.",
        "\"¿Cómo se salió tanto de control?\" — explicación rápida de {keyMoment}."
      ],
      question: [
        "¿{teamB} está en problemas después de un resultado así, o fue solo una mala noche?",
        "¿Fue {keyMoment} el momento en que el partido se les escapó?"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}. Dominio total. #{teamATag} #{teamBTag} #Highlights"
      ]
    },
    buzzer: {
      hook: [
        "Con segundos restantes, {teamA} hizo lo impensable.",
        "{teamA} vs {teamB} se decidió en la última jugada — y no decepcionó."
      ],
      video: [
        "Repetición en cámara lenta de {keyMoment} con cronómetro en pantalla.",
        "\"¿Dónde estabas cuando pasó esto?\" — reacciona a {keyMoment}."
      ],
      question: [
        "El mejor momento de último minuto que has visto esta temporada — ¿{keyMoment} está en tu top?",
        "¿La defensa de {teamB} en esa última jugada fue un error táctico o solo mala suerte?"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}. Hasta el final. 😱 #{teamATag} #{teamBTag} #MomentoClutch"
      ]
    },
    upset: {
      hook: [
        "Nadie tenía a {teamA} ganando este partido. Nadie.",
        "{teamA} sorprendió a todos al vencer a {teamB}."
      ],
      video: [
        "\"La Sorpresa\" — video resumen centrado en {keyMoment}.",
        "Video de reacción: viendo a los fanáticos de {teamB} procesar {keyMoment} en vivo."
      ],
      question: [
        "La sorpresa más grande de la temporada hasta ahora — ¿este resultado cambia cómo clasificas a estos equipos?",
        "¿{teamB} estaba sobrevalorado desde el principio?"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}. NADIE lo vio venir. #{teamATag} #{teamBTag} #Sorpresa"
      ]
    },
    controversial: {
      hook: [
        "Esta jugada va a ser lo único de lo que hable todo el mundo sobre {teamA} vs {teamB}.",
        "Olvida el marcador por un segundo — {keyMoment} es de lo que todos están discutiendo."
      ],
      video: [
        "Análisis desde múltiples ángulos de {keyMoment} — que decida la audiencia.",
        "\"¿Fue la decisión correcta?\" — repetición en cámara lenta de {keyMoment}."
      ],
      question: [
        "¿Decisión correcta o robo? Dame tu opinión honesta sobre {keyMoment}.",
        "¿{keyMoment} cambia el resultado si el árbitro lo hace bien?"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}. Todos hablan de {keyMoment}. 👀 #{teamATag} #{teamBTag} #Polémica"
      ]
    },
    milestone: {
      hook: [
        "Se hizo historia en {teamA} vs {teamB}.",
        "Este es un momento que los fanáticos de {teamA} recordarán por mucho tiempo."
      ],
      video: [
        "Video estilo destacados de carrera centrado en {keyMoment}.",
        "\"Un Momento Histórico\" — clip corto tipo documental sobre {keyMoment}."
      ],
      question: [
        "¿Dónde ubicas a {keyMoment} entre los mejores momentos que has visto esta temporada?",
        "¿Este hito cambia cómo deberíamos hablar de este equipo/jugador?"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}. Un momento para los libros de historia. 🏆 #{teamATag} #{teamBTag} #Hito"
      ]
    },
    close: {
      hook: [
        "{teamA} vs {teamB} se definió hasta el final.",
        "Nadie pudo separar a {teamA} y {teamB} hasta el último momento."
      ],
      video: [
        "Resumen de ida y vuelta: cada cambio clave en {teamA} vs {teamB}, centrado en {keyMoment}.",
        "\"¿Qué tan cerrado estuvo este partido?\" — análisis de {keyMoment} y lo que significó."
      ],
      question: [
        "¿Ganó el equipo correcto, o debió haber sido al revés?",
        "¿Cuál fue la verdadera diferencia — {keyMoment}, u otra cosa?"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}. Un clásico instantáneo. #{teamATag} #{teamBTag} #PartidoCerrado"
      ]
    },
    other: {
      hook: [
        "{teamA} vs {teamB} nos dejó mucho de qué hablar.",
        "Esto es lo que más destacó de {teamA} vs {teamB}."
      ],
      video: [
        "Resumen rápido centrado en {keyMoment}.",
        "Video análisis: por qué {keyMoment} importó."
      ],
      question: [
        "¿Qué opinas de {keyMoment}?",
        "¿Qué tan importante es {keyMoment} en el panorama general?"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}. #{teamATag} #{teamBTag} #Highlights"
      ]
    }
  },
  zh: {
    comeback: {
      hook: [
        "没人想到{teamA}在早早落后的情况下还能笑到最后。",
        "{teamA}看起来已经出局了——直到他们没有。",
        "这就是如何逆转比分：{teamA} 对阵 {teamB}。"
      ],
      video: [
        "逐帧解析{teamA}扭转比赛的关键瞬间。",
        "《转折点》——{keyMoment}的45秒回顾。",
        "回看逆转时刻：播放{keyMoment}的片段并定格球迷反应。"
      ],
      question: [
        "是{teamB}崩盘了，还是{teamA}更想赢？",
        "真正的转折点是{keyMoment}，还是更早之前？"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}。就这么放弃？这次不会。🔥 #{teamATag} #{teamBTag} #逆转"
      ]
    },
    blowout: {
      hook: [
        "{teamA}不只是击败了{teamB}——他们传递了一个信号。",
        "{scoreA} - {scoreB}。没有别的说法：{teamA}拿下了一场统治级的胜利。"
      ],
      video: [
        "{teamA}统治全场的三大高光时刻，围绕{keyMoment}展开。",
        "《怎么会输这么多？》——关于{keyMoment}的快速解析。"
      ],
      question: [
        "这样的比分之后，{teamB}是不是遇到麻烦了，还是只是状态不好的一晚？",
        "{keyMoment}是不是比赛失控的开始？"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}。全面碾压。#{teamATag} #{teamBTag} #精彩集锦"
      ]
    },
    buzzer: {
      hook: [
        "在最后几秒，{teamA}做到了不可思议的事情。",
        "{teamA} 对阵 {teamB} 一直战到最后一攻——毫不让人失望。"
      ],
      video: [
        "{keyMoment}的慢动作回放，配上倒计时效果。",
        "《这一刻你在哪里？》——回看{keyMoment}的反应。"
      ],
      question: [
        "本赛季你见过的最佳绝杀时刻——{keyMoment}排得上号吗？",
        "{teamB}在最后一攻的防守是战术失误还是纯粹运气不好？"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}。惊险到最后一刻。😱 #{teamATag} #{teamBTag} #绝杀时刻"
      ]
    },
    upset: {
      hook: [
        "没有人认为{teamA}会赢下这场比赛。没有人。",
        "{teamA}击败{teamB}，震惊了所有人。"
      ],
      video: [
        "《爆冷时刻》——围绕{keyMoment}制作的回顾视频。",
        "反应视频：看{teamB}球迷如何面对{keyMoment}。"
      ],
      question: [
        "本赛季目前为止最大的爆冷——这个结果会改变你对这两支球队的排名吗？",
        "{teamB}是不是一直都被高估了？"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}。完全没想到。#{teamATag} #{teamBTag} #爆冷"
      ]
    },
    controversial: {
      hook: [
        "这个判罚将成为{teamA}对{teamB}比赛后唯一的话题。",
        "先别管比分——大家都在争论{keyMoment}。"
      ],
      video: [
        "多角度解析{keyMoment}——让观众自己判断。",
        "《判罚正确吗？》——{keyMoment}的慢动作回看。"
      ],
      question: [
        "判罚正确还是抢劫？说说你对{keyMoment}的真实看法。",
        "如果裁判判对了，{keyMoment}会改变结果吗？"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}。大家都在讨论{keyMoment}。👀 #{teamATag} #{teamBTag} #争议判罚"
      ]
    },
    milestone: {
      hook: [
        "{teamA}对{teamB}的比赛中诞生了历史性的一刻。",
        "这是{teamA}球迷会长久铭记的时刻。"
      ],
      video: [
        "围绕{keyMoment}制作的生涯高光式剪辑。",
        "《历史性的一刻》——关于{keyMoment}的纪录片风格短片。"
      ],
      question: [
        "{keyMoment}在你本赛季看过的最佳时刻中排第几？",
        "这个里程碑会改变我们谈论这支球队/球员的方式吗？"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}。载入史册的一刻。🏆 #{teamATag} #{teamBTag} #里程碑"
      ]
    },
    close: {
      hook: [
        "{teamA}对{teamB}的比赛一直战到最后。",
        "直到最后一刻，谁都无法拉开{teamA}和{teamB}的差距。"
      ],
      video: [
        "拉锯战回顾：{teamA}对{teamB}的每一个关键转折，聚焦{keyMoment}。",
        "《这场比赛有多胶着？》——解析{keyMoment}及其意义。"
      ],
      question: [
        "赢球的是应该赢的一方，还是结果本该相反？",
        "真正的分水岭是{keyMoment}，还是别的原因？"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}。经典一战。#{teamATag} #{teamBTag} #胶着比赛"
      ]
    },
    other: {
      hook: [
        "{teamA}对{teamB}的比赛给了我们很多话题。",
        "这是{teamA}对{teamB}比赛中最突出的地方。"
      ],
      video: [
        "围绕{keyMoment}的快速回顾。",
        "解析视频：为什么{keyMoment}很重要。"
      ],
      question: [
        "你怎么看{keyMoment}？",
        "从大局来看，{keyMoment}有多重要？"
      ],
      caption: [
        "{teamA} {scoreA} - {scoreB} {teamB}。#{teamATag} #{teamBTag} #精彩集锦"
      ]
    }
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
  const langSet = TEMPLATES[currentLang] || TEMPLATES.en;
  const set = langSet[data.momentType] || langSet.other;
  return {
    hook: fill(pick(set.hook), data),
    video: fill(pick(set.video), data),
    question: fill(pick(set.question), data),
    caption: fill(pick(set.caption), data)
  };
}

const GOAL_CTA = {
  en: {
    media: "Follow for more breakdowns like this.",
    coach: "Save this if you coach — bring it to practice.",
    frontoffice: "Follow for more film breakdowns like this.",
    brand: "Follow along as I build this out.",
    analytics: "Follow for more data-backed takes.",
    explore: "Follow for more breakdowns like this."
  },
  es: {
    media: "Sígueme para más análisis como este.",
    coach: "Guarda esto si entrenas — llévalo a la práctica.",
    frontoffice: "Sígueme para más análisis de video.",
    brand: "Sígueme mientras construyo esto.",
    analytics: "Sígueme para más análisis basados en datos.",
    explore: "Sígueme para más análisis como este."
  },
  zh: {
    media: "关注我获取更多类似解析。",
    coach: "如果你是教练，收藏这条带到训练中用。",
    frontoffice: "关注我获取更多录像分析。",
    brand: "关注我，一起见证成长过程。",
    analytics: "关注我获取更多数据驱动的观点。",
    explore: "关注我获取更多类似解析。"
  }
};

function generateScript(data, out) {
  const passport = loadPassport();
  const ctaMap = GOAL_CTA[currentLang] || GOAL_CTA.en;
  const ctaLine = ctaMap[passport && passport.goal] || ctaMap.explore;

  return [
    { time: "0:00–0:03", label: t("beatHook"), text: out.hook },
    {
      time: "0:03–0:08",
      label: t("beatSetup"),
      text: fill(t("setupLine"), data)
    },
    { time: "0:08–0:20", label: t("beatMoment"), text: data.keyMoment + "." },
    {
      time: "0:20–0:28",
      label: t("beatYourTake"),
      text: data.observation || t("defaultTakeLine")
    },
    {
      time: "0:28–0:35",
      label: t("beatCTA"),
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
    utterance.lang = currentLang === "es" ? "es-ES" : currentLang === "zh" ? "zh-CN" : "en-US";
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
    copyScriptBtn.textContent = t("copiedLabel");
    setTimeout(() => (copyScriptBtn.textContent = t("copyScript")), 1500);
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

const CAREER_PATHS = {
  en: [
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
  ],
  es: [
    {
      name: "Creador de Contenido Deportivo",
      blurb: "Construir una audiencia convirtiendo partidos, jugadores y opiniones en contenido de formato corto.",
      nextStep: "Publica una pieza de contenido a la semana usando la pestaña Estudio Creativo.",
      tags: ["video editing", "social media", "writing", "photography / design", "content creation", "personal brand building"]
    },
    {
      name: "Analista de Video / Medios de un Equipo",
      blurb: "Analizar video para un equipo o programa, apoyando el entrenamiento y el desarrollo de jugadores.",
      nextStep: "Ofrécete a editar video para un club local o un equipo universitario para armar tu portafolio.",
      tags: ["video editing", "data & analytics", "coaching", "coaching & player development"]
    },
    {
      name: "Periodista / Locutor Deportivo",
      blurb: "Cubrir partidos e historias a través de la escritura o el trabajo frente a cámara.",
      nextStep: "Comienza tu propia serie de crónicas o resúmenes post-partido con tu propio estilo.",
      tags: ["writing", "broadcasting / on-camera", "content creation", "journalism & broadcasting"]
    },
    {
      name: "Entrenador Juvenil o de Club",
      blurb: "Formar jugadores directamente, usando tu propia experiencia como jugador.",
      nextStep: "Ofrécete como entrenador asistente en un equipo juvenil o de club local.",
      tags: ["coaching", "playing experience", "event management", "coaching & player development"]
    },
    {
      name: "Scouting / Análisis",
      blurb: "Evaluar talento y rendimiento usando datos y conocimiento del juego.",
      nextStep: "Empieza a registrar tus propias notas de scouting o estadísticas de los partidos que ves.",
      tags: ["data & analytics", "playing experience", "scouting & analytics"]
    },
    {
      name: "Marketing y Patrocinios",
      blurb: "Conectar marcas, patrocinadores y audiencias dentro del deporte.",
      nextStep: "Estudia cómo un equipo o atleta que sigues maneja su contenido de patrocinio.",
      tags: ["marketing & sales", "social media", "content creation", "marketing & sponsorship"]
    },
    {
      name: "Operaciones de Eventos",
      blurb: "Gestionar la logística detrás de partidos, torneos y eventos deportivos.",
      nextStep: "Ofrécete como voluntario para ayudar a organizar un torneo o evento local.",
      tags: ["event management", "event operations"]
    },
    {
      name: "Front Office / Operaciones de Equipo",
      blurb: "Trabajar detrás de escena para un equipo u organización.",
      nextStep: "Busca prácticas profesionales o roles de medio tiempo en clubes o franquicias locales.",
      tags: ["data & analytics", "marketing & sales", "event management", "playing experience", "front office / team ops"]
    }
  ],
  zh: [
    {
      name: "体育内容创作者",
      blurb: "把比赛、球员和观点转化为短视频内容，从而积累观众。",
      nextStep: "每周使用创作工作室标签发布一条内容。",
      tags: ["video editing", "social media", "writing", "photography / design", "content creation", "personal brand building"]
    },
    {
      name: "球队视频/媒体分析师",
      blurb: "为球队或项目剪辑分析比赛录像，支持教练工作和球员发展。",
      nextStep: "主动为当地俱乐部或大学球队剪辑录像，积累作品集。",
      tags: ["video editing", "data & analytics", "coaching", "coaching & player development"]
    },
    {
      name: "体育记者/解说员",
      blurb: "通过写作或镜头前的工作报道比赛和故事。",
      nextStep: "用自己的风格开始做赛后战报或复盘系列内容。",
      tags: ["writing", "broadcasting / on-camera", "content creation", "journalism & broadcasting"]
    },
    {
      name: "青少年或俱乐部教练",
      blurb: "利用自己的球员经历，直接培养球员。",
      nextStep: "在当地青少年或俱乐部球队担任助理教练志愿者。",
      tags: ["coaching", "playing experience", "event management", "coaching & player development"]
    },
    {
      name: "球探/数据分析",
      blurb: "利用数据和比赛知识评估球员天赋和表现。",
      nextStep: "开始记录你观看比赛时的球探笔记或数据。",
      tags: ["data & analytics", "playing experience", "scouting & analytics"]
    },
    {
      name: "市场营销与赞助",
      blurb: "在体育领域连接品牌、赞助商和观众。",
      nextStep: "研究你关注的球队或运动员是如何做赞助内容的。",
      tags: ["marketing & sales", "social media", "content creation", "marketing & sponsorship"]
    },
    {
      name: "赛事运营",
      blurb: "负责比赛、锦标赛和体育赛事背后的后勤工作。",
      nextStep: "自愿协助组织当地的锦标赛或活动。",
      tags: ["event management", "event operations"]
    },
    {
      name: "球队管理层/运营",
      blurb: "在球队或机构幕后工作。",
      nextStep: "寻找当地俱乐部或球队的实习或兼职机会。",
      tags: ["data & analytics", "marketing & sales", "event management", "playing experience", "front office / team ops"]
    }
  ]
};

const GOAL_TAGS = {
  media: ["content creation", "journalism & broadcasting"],
  coach: ["coaching & player development"],
  frontoffice: ["front office / team ops"],
  brand: ["personal brand building", "content creation"],
  analytics: ["scouting & analytics"],
  explore: []
};

const GOAL_LABELS = {
  en: {
    media: "breaking into sports media / content",
    coach: "becoming a coach",
    frontoffice: "working in a team front office",
    brand: "building a personal brand",
    analytics: "becoming a scout / analyst",
    explore: "still exploring options"
  },
  es: {
    media: "entrar en medios deportivos / contenido",
    coach: "convertirse en entrenador/a",
    frontoffice: "trabajar en la oficina de un equipo",
    brand: "construir una marca personal",
    analytics: "convertirse en scout / analista",
    explore: "seguir explorando opciones"
  },
  zh: {
    media: "进入体育媒体/内容行业",
    coach: "成为教练",
    frontoffice: "在球队管理层工作",
    brand: "打造个人品牌",
    analytics: "成为球探/分析师",
    explore: "继续探索方向"
  }
};

const ROLE_LABELS = {
  en: { player: "player", formerplayer: "former player", coach: "coach", student: "student", contentcreator: "content creator", fan: "fan", other: "other" },
  es: { player: "jugador/a", formerplayer: "ex-jugador/a", coach: "entrenador/a", student: "estudiante", contentcreator: "creador/a de contenido", fan: "aficionado/a", other: "otro/a" },
  zh: { player: "球员", formerplayer: "退役球员", coach: "教练", student: "学生", contentcreator: "内容创作者", fan: "球迷", other: "其他" }
};

const TAG_LABELS = {
  "video editing": { en: "Video Editing", es: "Edición de Video", zh: "视频剪辑" },
  "writing": { en: "Writing", es: "Escritura", zh: "写作" },
  "coaching": { en: "Coaching", es: "Entrenamiento", zh: "教练指导" },
  "data & analytics": { en: "Data & Analytics", es: "Datos y Análisis", zh: "数据与分析" },
  "social media": { en: "Social Media", es: "Redes Sociales", zh: "社交媒体" },
  "playing experience": { en: "Playing Experience", es: "Experiencia como Jugador", zh: "球员经验" },
  "event management": { en: "Event Management", es: "Gestión de Eventos", zh: "赛事管理" },
  "marketing & sales": { en: "Marketing & Sales", es: "Marketing y Ventas", zh: "市场与销售" },
  "photography / design": { en: "Photography / Design", es: "Fotografía / Diseño", zh: "摄影/设计" },
  "broadcasting / on-camera": { en: "Broadcasting / On-Camera", es: "Locución / Frente a Cámara", zh: "解说/镜头表现" },
  "content creation": { en: "Content Creation", es: "Creación de Contenido", zh: "内容创作" },
  "coaching & player development": { en: "Coaching & Player Development", es: "Entrenamiento y Desarrollo de Jugadores", zh: "教练与球员发展" },
  "scouting & analytics": { en: "Scouting & Analytics", es: "Scouting y Análisis", zh: "球探与数据分析" },
  "journalism & broadcasting": { en: "Journalism & Broadcasting", es: "Periodismo y Locución", zh: "新闻与解说" },
  "marketing & sponsorship": { en: "Marketing & Sponsorship", es: "Marketing y Patrocinios", zh: "市场与赞助" },
  "event operations": { en: "Event Operations", es: "Operaciones de Eventos", zh: "赛事运营" },
  "front office / team ops": { en: "Front Office / Team Ops", es: "Front Office / Operaciones de Equipo", zh: "球队管理层/运营" },
  "personal brand building": { en: "Personal Brand Building", es: "Construcción de Marca Personal", zh: "打造个人品牌" }
};

function tagLabel(value) {
  return (TAG_LABELS[value] && TAG_LABELS[value][currentLang]) || value;
}

const PASSPORT_KEY = "ljsportmind_passport";

function getCheckedValues(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map((el) => el.value);
}

function matchCareerPaths(userTags) {
  const paths = CAREER_PATHS[currentLang] || CAREER_PATHS.en;
  return paths.map((path) => {
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
    list.innerHTML = `<div class="match-card"><p>${t("selectMoreSkills")}</p></div>`;
    return;
  }
  matches.forEach((m) => {
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = `
      <h4>${m.name}</h4>
      <p>${m.blurb}</p>
      <p><strong>${t("nextStepLabel")}</strong> ${m.nextStep}</p>
      <p class="matched-tags">${t("matchedOnLabel")} ${m.matched.map(tagLabel).join(", ")}</p>
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
  document.getElementById("pRole").value = data.role || "player";
  document.getElementById("pGoal").value = data.goal || "explore";
  document.querySelectorAll("#pSkills input").forEach((el) => {
    el.checked = (data.skills || []).includes(el.value);
  });
  document.querySelectorAll("#pInterests input").forEach((el) => {
    el.checked = (data.interests || []).includes(el.value);
  });
}

function buildSummary(name, location, roleLabel, goalLabel) {
  if (currentLang === "es") {
    const loc = location ? ` de ${location}` : "";
    return `${name}${loc} es ${roleLabel}, con el objetivo de ${goalLabel}.`;
  }
  if (currentLang === "zh") {
    const loc = location ? `（来自${location}）` : "";
    return `${name}${loc}目前是${roleLabel}，目标是${goalLabel}。`;
  }
  const loc = location ? ` from ${location}` : "";
  return `${name}${loc} is a ${roleLabel}, working toward ${goalLabel}.`;
}

function renderPassportSummaryAndMatches(data) {
  const roleLabels = ROLE_LABELS[currentLang] || ROLE_LABELS.en;
  const goalLabels = GOAL_LABELS[currentLang] || GOAL_LABELS.en;
  const namePart = data.name || t("youFallback");

  document.getElementById("passportSummary").textContent = buildSummary(
    namePart,
    data.location,
    roleLabels[data.role] || data.role,
    goalLabels[data.goal] || data.goal
  );

  const userTags = [...(data.skills || []), ...(data.interests || []), ...(GOAL_TAGS[data.goal] || [])];
  renderMatches(matchCareerPaths(userTags));
}

const passportForm = document.getElementById("passportForm");
const passportResults = document.getElementById("passportResults");
const passportBanner = document.getElementById("passportBanner");

function renderPassportBanner(data) {
  if (!data || !data.name) {
    passportBanner.hidden = true;
    return;
  }
  const goalLabels = GOAL_LABELS[currentLang] || GOAL_LABELS.en;
  const goalLabel = goalLabels[data.goal] || goalLabels.explore;
  passportBanner.textContent = t("tailoredFor").replace("{name}", data.name).replace("{goal}", goalLabel);
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
  renderPassportSummaryAndMatches(data);

  passportResults.hidden = false;
  passportResults.scrollIntoView({ behavior: "smooth" });
});

// ---- Language switching ----

const langSelect = document.getElementById("langSelect");
langSelect.value = currentLang;

function applyLanguage(lang) {
  currentLang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // localStorage unavailable; language choice won't persist
  }
  document.documentElement.lang = lang;
  langSelect.value = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  const passport = loadPassport();
  if (passport) {
    renderPassportBanner(passport);
    if (!passportResults.hidden) renderPassportSummaryAndMatches(passport);
  }
  if (lastData && !results.hidden) render();
}

langSelect.addEventListener("change", () => applyLanguage(langSelect.value));

applyLanguage(currentLang);
