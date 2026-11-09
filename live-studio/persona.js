// Clutch, LJ LIVE's hype persona (rules in persona.md). Two modes: "screen" (non-narrator: Clutch's line
// becomes the big on-screen text and leads the caption) and "voice" (narrator: a voice-over script with a
// read-aloud preview; the saved video stays silent). Lines only fill in facts from the feed (team, player,
// minute, score) or the user's own take, so Clutch can hype but never invent. English and Spanish for
// now; other languages keep the standard lines.

const PERSONA = {
  name: "Clutch",
  intro: { en: "Clutch here, live.", es: "Aquí Clutch, en vivo." },
  catchphrase: { en: "It's LIVE. Post it first.", es: "Es EN VIVO. Publícalo primero." },
  lines: {
    en: {
      goal: ["{player}! {min}. Get in! {line}.", "Who else? {player} at {min}. {line}.", "{team} strike! {player}, {min}. {line}."],
      pen: ["Ice cold from the spot. {player}, {min}. {line}.", "{player} steps up and buries it. {line}."],
      og: ["Disaster at the back. Own goal, {min}. {line}.", "Gift-wrapped. Own goal at {min}. {line}."],
      red: ["Off you go! Red card for {player}, {min}.", "Down to ten. {player} sees red at {min}."],
      score: ["The scoreboard moves. {line}.", "Here we go. {line}."],
      update: ["Check the board: {line}.", "Live and latest: {line}."],
      matchday: ["It's matchday. {home} v {away}. Don't blink.", "Big one coming: {home} v {away}. {when}."],
      poll: ["Your call: {home} or {away}? Drop it in the comments.", "Pick a side: {home} or {away}."],
      spot: ["All eyes on {player}. Difference-maker today.", "{player} is on fire today."],
      take: ["Hot take from the stands: {note}", "My take, no filter: {note}"],
      ft_draw: ["Honours even. {line}."],
      ft_win: ["Job done for {winner}. {line}."],
      ft_comeback: ["What a comeback from {winner}! {line}."],
      ft_blowout: ["Statement win. {winner} run riot: {line}."],
      ft_late: ["Late, late drama! {winner} snatch it. {line}."]
    },
    es: {
      goal: ["¡{player}! Minuto {min}. ¡Golazo! {line}.", "¿Quién si no? {player} en el {min}. {line}.", "¡Golpe de {team}! {player}, minuto {min}. {line}."],
      pen: ["Sangre fría desde los once metros. {player}, minuto {min}. {line}.", "{player} no perdona desde el punto de penalti. {line}."],
      og: ["Desastre atrás. Autogol en el {min}. {line}.", "Regalo inesperado: autogol en el {min}. {line}."],
      red: ["¡A la calle! Roja para {player} en el {min}.", "Se quedan con diez. Roja para {player}, minuto {min}."],
      score: ["¡Se mueve el marcador! {line}.", "Aquí vamos. {line}."],
      update: ["Mira el marcador: {line}.", "En vivo y al día: {line}."],
      matchday: ["Día de partido: {home} contra {away}. Que nadie parpadee.", "Se viene un partidazo: {home} contra {away}. {when}."],
      poll: ["Tú decides: ¿{home} o {away}? Déjalo en los comentarios.", "Elige bando: {home} o {away}."],
      spot: ["Todas las miradas en {player}. Hoy marca la diferencia.", "{player} está encendido hoy."],
      take: ["Opinión caliente desde la grada: {note}", "Mi opinión, sin filtro: {note}"],
      ft_draw: ["Reparto de puntos. {line}."],
      ft_win: ["Misión cumplida para {winner}. {line}."],
      ft_comeback: ["¡Qué remontada de {winner}! {line}."],
      ft_blowout: ["Victoria de autoridad: {winner} arrasa. {line}."],
      ft_late: ["¡Drama al final! {winner} se lo lleva. {line}."]
    }
  }
};

(function personaStrings() {
  const I18N_HYPE = {
    en: { hpScreen: "On-screen hype", hpVoice: "Narrator", hpScript: "Clutch's voice-over", hpCopy: "Copy script", hpNoAudio: "Saved videos are silent: record this script yourself or use TikTok's text-to-speech.", hpLangNote: "Clutch speaks English and Spanish for now; other languages use the standard lines." },
    es: { hpScreen: "Texto en pantalla", hpVoice: "Narrador", hpScript: "Voz en off de Clutch", hpCopy: "Copiar guion", hpNoAudio: "Los videos guardados no tienen sonido: graba este guion o usa la voz de TikTok.", hpLangNote: "Clutch habla inglés y español por ahora; otros idiomas usan los textos normales." },
    zh: { hpScreen: "屏幕文字", hpVoice: "解说", hpScript: "Clutch 的配音稿", hpCopy: "复制稿子", hpNoAudio: "保存的视频没有声音：请自己录下这段稿子，或使用 TikTok 的文字转语音。", hpLangNote: "Clutch 目前只说英语和西班牙语；其他语言使用标准文案。" },
    ar: { hpScreen: "نص على الشاشة", hpVoice: "معلّق", hpScript: "تعليق Clutch الصوتي", hpCopy: "نسخ النص", hpNoAudio: "الفيديوهات المحفوظة بلا صوت: سجّل هذا النص بنفسك أو استخدم تحويل النص إلى كلام في TikTok.", hpLangNote: "يتحدث Clutch الإنجليزية والإسبانية حاليًا؛ اللغات الأخرى تستخدم النصوص العادية." },
    fr: { hpScreen: "Texte à l'écran", hpVoice: "Narrateur", hpScript: "Voix off de Clutch", hpCopy: "Copier le script", hpNoAudio: "Les vidéos enregistrées sont muettes : enregistre ce script toi-même ou utilise la synthèse vocale de TikTok.", hpLangNote: "Clutch parle anglais et espagnol pour l'instant ; les autres langues utilisent les textes standard." },
    pt: { hpScreen: "Texto na tela", hpVoice: "Narrador", hpScript: "Locução do Clutch", hpCopy: "Copiar roteiro", hpNoAudio: "Os vídeos salvos não têm som: grave este roteiro ou use a voz do TikTok.", hpLangNote: "Clutch fala inglês e espanhol por enquanto; outros idiomas usam os textos padrão." },
    de: { hpScreen: "Text im Bild", hpVoice: "Sprecher", hpScript: "Clutchs Voice-over", hpCopy: "Skript kopieren", hpNoAudio: "Gespeicherte Videos sind stumm: Sprich das Skript selbst ein oder nutze die Text-zu-Sprache von TikTok.", hpLangNote: "Clutch spricht vorerst Englisch und Spanisch; andere Sprachen nutzen die Standardtexte." },
    it: { hpScreen: "Testo a schermo", hpVoice: "Narratore", hpScript: "Voce fuori campo di Clutch", hpCopy: "Copia il testo", hpNoAudio: "I video salvati sono muti: registra tu questo testo o usa la sintesi vocale di TikTok.", hpLangNote: "Per ora Clutch parla inglese e spagnolo; le altre lingue usano i testi standard." },
    hi: { hpScreen: "स्क्रीन पर टेक्स्ट", hpVoice: "नैरेटर", hpScript: "Clutch का वॉइस-ओवर", hpCopy: "स्क्रिप्ट कॉपी करें", hpNoAudio: "सेव किए गए वीडियो में आवाज़ नहीं होती: यह स्क्रिप्ट खुद रिकॉर्ड करें या TikTok का टेक्स्ट-टू-स्पीच इस्तेमाल करें।", hpLangNote: "Clutch अभी अंग्रेज़ी और स्पैनिश बोलता है; बाकी भाषाओं में सामान्य टेक्स्ट है।" },
    ja: { hpScreen: "画面テキスト", hpVoice: "ナレーター", hpScript: "Clutchのナレーション原稿", hpCopy: "原稿をコピー", hpNoAudio: "保存した動画は無音です。この原稿を自分で録音するか、TikTokの読み上げ機能を使ってください。", hpLangNote: "Clutchは今のところ英語とスペイン語のみ。他の言語は通常の文を使います。" }
  };
  Object.keys(I18N_HYPE).forEach((lang) => (I18N[lang] = Object.assign(I18N[lang] || {}, I18N_HYPE[lang])));
  const originalRegister = registerLocale;
  registerLocale = function (code, pack) {
    originalRegister(code, pack);
    if (I18N_HYPE[code]) Object.assign(I18N[code], I18N_HYPE[code]);
  };
})();

const LS_HYPE_KEY = "ljlive_hype";

function lsHypeMode() {
  try {
    return localStorage.getItem(LS_HYPE_KEY) === "voice" ? "voice" : "screen";
  } catch {
    return "screen";
  }
}

function lsSetHypeMode(mode) {
  try {
    localStorage.setItem(LS_HYPE_KEY, mode);
  } catch {
    // mode won't persist
  }
}

// Clutch's line for a moment type (or "ft_<story>" for full time), or null when Clutch doesn't speak
// the current language. `variant` picks between lines so repeated moments don't sound the same.
function lsHype(kind, vars, variant = 0) {
  const lines = PERSONA.lines[currentLang] && PERSONA.lines[currentLang][kind];
  if (!lines) return null;
  return lsFill(lines[variant % lines.length], vars).replace(/\s+/g, " ").trim();
}

// The narrator script: Clutch's intro, the line, and the sign-off.
function lsNarration(line) {
  const lang = PERSONA.intro[currentLang] ? currentLang : null;
  return lang ? `${PERSONA.intro[lang]} ${line} ${PERSONA.catchphrase[lang]}` : line;
}
