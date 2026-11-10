// Daily posts: live scores, previews and the videos on screen are always free. Saving or sharing a post
// uses one of the day's posts; Free gives 3 a day. Paid plans sell more posts per day instead of a flat
// premium price, and are shown as "coming soon" until accounts and payments exist. The count is kept on
// this device and resets at local midnight. People the owner gives a code to (at most 20) unlock
// unlimited posts by opening the app with #owner and entering it; /api/owner checks it on the server.

const LS_USAGE_KEY = "ljlive_usage";
const LS_OWNER_KEY = "ljlive_owner";
const LS_FREE_POSTS = 3;
const LS_PLANS = [
  { name: "lsPlanFree", desc: "lsPlanFreeD", price: "lsPriceFree", current: true },
  { name: "lsPlanDay", desc: "lsPlanDayD", price: "lsPriceDay" },
  { name: "lsPlanCreator", desc: "lsPlanCreatorD", price: "lsPriceCreator" },
  { name: "lsPlanPro", desc: "lsPlanProD", price: "lsPricePro" }
];

(function usageStrings() {
  const I18N_USAGE = {
    en: {
      lsMeter: "{n} of {total} free posts left today", lsMeterOut: "Today's free posts are used. Live scores and previews stay free.",
      lsPlansLink: "See plans", lsPlansTitle: "Post more today",
      lsPlansSub: "Live scores and previews are always free. You only pay for more saved or shared posts per day.",
      lsPlanFree: "Free", lsPlanFreeD: "3 posts a day", lsPlanDay: "Day Pass", lsPlanDayD: "25 posts for today",
      lsPlanCreator: "Creator", lsPlanCreatorD: "15 posts every day", lsPlanPro: "Pro", lsPlanProD: "50 posts every day",
      lsPriceFree: "$0", lsPriceDay: "$0.99 once", lsPriceCreator: "$2.99/month", lsPricePro: "$6.99/month",
      lsSoon: "Coming soon", lsCurrent: "Your plan", lsClose: "Close", lsResets: "Free posts reset at midnight.", lsPromo: "Watch the promo",
      lsOwner: "Unlimited · {name}", lsOwnerTitle: "Unlimited access", lsOwnerCode: "Access code", lsOwnerGo: "Unlock",
      lsOwnerBad: "That code isn't right.", lsOwnerWait: "Too many tries. Wait 15 minutes and try again.", lsOwnerNotSet: "Unlimited access isn't set up on the server yet.", lsOwnerErr: "Couldn't check the code. Try again."
    },
    es: {
      lsMeter: "{n} de {total} publicaciones gratis disponibles hoy", lsMeterOut: "Ya usaste las publicaciones gratis de hoy. Los marcadores en vivo y las vistas previas siguen siendo gratis.",
      lsPlansLink: "Ver planes", lsPlansTitle: "Publica más hoy",
      lsPlansSub: "Los marcadores en vivo y las vistas previas siempre son gratis. Solo pagas por más publicaciones guardadas o compartidas al día.",
      lsPlanFree: "Gratis", lsPlanFreeD: "3 publicaciones al día", lsPlanDay: "Pase de un día", lsPlanDayD: "25 publicaciones para hoy",
      lsPlanCreator: "Creador", lsPlanCreatorD: "15 publicaciones cada día", lsPlanPro: "Pro", lsPlanProD: "50 publicaciones cada día",
      lsPriceFree: "$0", lsPriceDay: "$0.99 una vez", lsPriceCreator: "$2.99/mes", lsPricePro: "$6.99/mes",
      lsSoon: "Próximamente", lsCurrent: "Tu plan", lsClose: "Cerrar", lsResets: "Las publicaciones gratis se renuevan a medianoche.", lsPromo: "Ver el anuncio",
      lsOwner: "Ilimitado · {name}", lsOwnerTitle: "Acceso ilimitado", lsOwnerCode: "Código de acceso", lsOwnerGo: "Desbloquear",
      lsOwnerBad: "Ese código no es correcto.", lsOwnerWait: "Demasiados intentos. Espera 15 minutos y vuelve a intentarlo.", lsOwnerNotSet: "El acceso ilimitado aún no está configurado en el servidor.", lsOwnerErr: "No se pudo comprobar el código. Inténtalo de nuevo."
    },
    zh: {
      lsMeter: "今天还剩 {n}/{total} 次免费发布", lsMeterOut: "今天的免费发布次数已用完。实时比分和预览仍然免费。",
      lsPlansLink: "查看方案", lsPlansTitle: "今天发布更多",
      lsPlansSub: "实时比分和预览永远免费。你只需为每天更多的保存或分享付费。",
      lsPlanFree: "免费", lsPlanFreeD: "每天 3 次发布", lsPlanDay: "日通行证", lsPlanDayD: "今天 25 次发布",
      lsPlanCreator: "创作者", lsPlanCreatorD: "每天 15 次发布", lsPlanPro: "专业版", lsPlanProD: "每天 50 次发布",
      lsPriceFree: "$0", lsPriceDay: "$0.99 一次", lsPriceCreator: "$2.99/月", lsPricePro: "$6.99/月",
      lsSoon: "即将推出", lsCurrent: "当前方案", lsClose: "关闭", lsResets: "免费次数在午夜重置。", lsPromo: "观看宣传片"
    },
    ar: {
      lsMeter: "تبقّى {n} من {total} منشورات مجانية اليوم", lsMeterOut: "استخدمت منشورات اليوم المجانية. النتائج المباشرة والمعاينات تبقى مجانية.",
      lsPlansLink: "عرض الخطط", lsPlansTitle: "انشر أكثر اليوم",
      lsPlansSub: "النتائج المباشرة والمعاينات مجانية دائمًا. تدفع فقط مقابل منشورات إضافية تحفظها أو تشاركها يوميًا.",
      lsPlanFree: "مجاني", lsPlanFreeD: "3 منشورات يوميًا", lsPlanDay: "تذكرة اليوم", lsPlanDayD: "25 منشورًا لليوم",
      lsPlanCreator: "صانع محتوى", lsPlanCreatorD: "15 منشورًا كل يوم", lsPlanPro: "احترافي", lsPlanProD: "50 منشورًا كل يوم",
      lsPriceFree: "$0", lsPriceDay: "$0.99 مرة واحدة", lsPriceCreator: "$2.99/شهريًا", lsPricePro: "$6.99/شهريًا",
      lsSoon: "قريبًا", lsCurrent: "خطتك", lsClose: "إغلاق", lsResets: "تتجدد المنشورات المجانية عند منتصف الليل.", lsPromo: "شاهد الإعلان"
    },
    fr: {
      lsMeter: "{n} publications gratuites sur {total} restantes aujourd'hui", lsMeterOut: "Tes publications gratuites du jour sont utilisées. Les scores en direct et les aperçus restent gratuits.",
      lsPlansLink: "Voir les offres", lsPlansTitle: "Publie plus aujourd'hui",
      lsPlansSub: "Les scores en direct et les aperçus sont toujours gratuits. Tu ne paies que pour plus de publications enregistrées ou partagées par jour.",
      lsPlanFree: "Gratuit", lsPlanFreeD: "3 publications par jour", lsPlanDay: "Pass journée", lsPlanDayD: "25 publications pour aujourd'hui",
      lsPlanCreator: "Créateur", lsPlanCreatorD: "15 publications chaque jour", lsPlanPro: "Pro", lsPlanProD: "50 publications chaque jour",
      lsPriceFree: "$0", lsPriceDay: "$0.99 une fois", lsPriceCreator: "$2.99/mois", lsPricePro: "$6.99/mois",
      lsSoon: "Bientôt", lsCurrent: "Ton offre", lsClose: "Fermer", lsResets: "Les publications gratuites se renouvellent à minuit.", lsPromo: "Voir la pub"
    },
    pt: {
      lsMeter: "{n} de {total} posts grátis restantes hoje", lsMeterOut: "Os posts grátis de hoje acabaram. Placares ao vivo e prévias continuam grátis.",
      lsPlansLink: "Ver planos", lsPlansTitle: "Poste mais hoje",
      lsPlansSub: "Placares ao vivo e prévias são sempre grátis. Você só paga por mais posts salvos ou compartilhados por dia.",
      lsPlanFree: "Grátis", lsPlanFreeD: "3 posts por dia", lsPlanDay: "Passe diário", lsPlanDayD: "25 posts para hoje",
      lsPlanCreator: "Criador", lsPlanCreatorD: "15 posts todo dia", lsPlanPro: "Pro", lsPlanProD: "50 posts todo dia",
      lsPriceFree: "$0", lsPriceDay: "$0.99 uma vez", lsPriceCreator: "$2.99/mês", lsPricePro: "$6.99/mês",
      lsSoon: "Em breve", lsCurrent: "Seu plano", lsClose: "Fechar", lsResets: "Os posts grátis renovam à meia-noite.", lsPromo: "Ver o anúncio"
    },
    de: {
      lsMeter: "Noch {n} von {total} kostenlosen Posts heute", lsMeterOut: "Die kostenlosen Posts für heute sind verbraucht. Live-Ergebnisse und Vorschauen bleiben kostenlos.",
      lsPlansLink: "Pläne ansehen", lsPlansTitle: "Heute mehr posten",
      lsPlansSub: "Live-Ergebnisse und Vorschauen sind immer kostenlos. Du zahlst nur für mehr gespeicherte oder geteilte Posts pro Tag.",
      lsPlanFree: "Kostenlos", lsPlanFreeD: "3 Posts pro Tag", lsPlanDay: "Tagespass", lsPlanDayD: "25 Posts für heute",
      lsPlanCreator: "Creator", lsPlanCreatorD: "15 Posts jeden Tag", lsPlanPro: "Pro", lsPlanProD: "50 Posts jeden Tag",
      lsPriceFree: "$0", lsPriceDay: "$0.99 einmalig", lsPriceCreator: "$2.99/Monat", lsPricePro: "$6.99/Monat",
      lsSoon: "Demnächst", lsCurrent: "Dein Plan", lsClose: "Schließen", lsResets: "Kostenlose Posts werden um Mitternacht zurückgesetzt.", lsPromo: "Werbespot ansehen"
    },
    it: {
      lsMeter: "{n} di {total} post gratuiti rimasti oggi", lsMeterOut: "Hai usato i post gratuiti di oggi. Risultati in diretta e anteprime restano gratis.",
      lsPlansLink: "Vedi i piani", lsPlansTitle: "Pubblica di più oggi",
      lsPlansSub: "Risultati in diretta e anteprime sono sempre gratis. Paghi solo per più post salvati o condivisi al giorno.",
      lsPlanFree: "Gratis", lsPlanFreeD: "3 post al giorno", lsPlanDay: "Pass giornaliero", lsPlanDayD: "25 post per oggi",
      lsPlanCreator: "Creator", lsPlanCreatorD: "15 post ogni giorno", lsPlanPro: "Pro", lsPlanProD: "50 post ogni giorno",
      lsPriceFree: "$0", lsPriceDay: "$0.99 una volta", lsPriceCreator: "$2.99/mese", lsPricePro: "$6.99/mese",
      lsSoon: "In arrivo", lsCurrent: "Il tuo piano", lsClose: "Chiudi", lsResets: "I post gratuiti si azzerano a mezzanotte.", lsPromo: "Guarda lo spot"
    },
    hi: {
      lsMeter: "आज {total} में से {n} फ़्री पोस्ट बाकी", lsMeterOut: "आज की फ़्री पोस्ट खत्म हो गईं। लाइव स्कोर और प्रीव्यू फ़्री रहते हैं।",
      lsPlansLink: "प्लान देखें", lsPlansTitle: "आज और पोस्ट करें",
      lsPlansSub: "लाइव स्कोर और प्रीव्यू हमेशा फ़्री हैं। आप सिर्फ़ हर दिन ज़्यादा सेव या शेयर की गई पोस्ट के लिए भुगतान करते हैं।",
      lsPlanFree: "फ़्री", lsPlanFreeD: "हर दिन 3 पोस्ट", lsPlanDay: "डे पास", lsPlanDayD: "आज के लिए 25 पोस्ट",
      lsPlanCreator: "क्रिएटर", lsPlanCreatorD: "हर दिन 15 पोस्ट", lsPlanPro: "प्रो", lsPlanProD: "हर दिन 50 पोस्ट",
      lsPriceFree: "$0", lsPriceDay: "$0.99 एक बार", lsPriceCreator: "$2.99/महीना", lsPricePro: "$6.99/महीना",
      lsSoon: "जल्द आ रहा है", lsCurrent: "आपका प्लान", lsClose: "बंद करें", lsResets: "फ़्री पोस्ट आधी रात को रीसेट होती हैं।", lsPromo: "प्रोमो देखें"
    },
    ja: {
      lsMeter: "今日の無料投稿 残り{n}/{total}", lsMeterOut: "今日の無料投稿を使い切りました。ライブスコアとプレビューは引き続き無料です。",
      lsPlansLink: "プランを見る", lsPlansTitle: "今日もっと投稿",
      lsPlansSub: "ライブスコアとプレビューはいつでも無料。1日に保存・共有できる投稿数を増やすときだけ料金がかかります。",
      lsPlanFree: "無料", lsPlanFreeD: "1日3投稿", lsPlanDay: "1日パス", lsPlanDayD: "今日25投稿",
      lsPlanCreator: "クリエイター", lsPlanCreatorD: "毎日15投稿", lsPlanPro: "プロ", lsPlanProD: "毎日50投稿",
      lsPriceFree: "$0", lsPriceDay: "$0.99（1回）", lsPriceCreator: "$2.99/月", lsPricePro: "$6.99/月",
      lsSoon: "近日公開", lsCurrent: "現在のプラン", lsClose: "閉じる", lsResets: "無料投稿は深夜0時にリセットされます。", lsPromo: "プロモを見る"
    }
  };
  Object.keys(I18N_USAGE).forEach((lang) => (I18N[lang] = Object.assign(I18N[lang] || {}, I18N_USAGE[lang])));
  // Locale files that load later merge their own text in; keep these strings on top.
  const originalRegister = registerLocale;
  registerLocale = function (code, pack) {
    originalRegister(code, pack);
    if (I18N_USAGE[code]) Object.assign(I18N[code], I18N_USAGE[code]);
  };
  // core.js labels the footer before these strings exist; label the promo link again now.
  document.querySelectorAll('.app-chrome [data-i18n="lsPromo"]').forEach((n) => (n.textContent = t("lsPromo")));
})();

function lsDay() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function lsUsage() {
  try {
    const u = JSON.parse(localStorage.getItem(LS_USAGE_KEY));
    if (u && u.day === lsDay()) return u;
  } catch {
    // storage unavailable; start a fresh day
  }
  return { day: lsDay(), used: 0 };
}

// Unlimited access: { code, name } saved on this device after the server accepted the code.
let lsAccess = null;
try {
  const saved = JSON.parse(localStorage.getItem(LS_OWNER_KEY) || "null");
  if (saved && saved.code) lsAccess = saved;
} catch {
  // old "1" flag or storage blocked: no access until a code is entered
}

function lsIsOwner() {
  return !!lsAccess;
}

function lsSetAccess(access) {
  lsAccess = access;
  try {
    if (access) localStorage.setItem(LS_OWNER_KEY, JSON.stringify(access));
    else localStorage.removeItem(LS_OWNER_KEY);
  } catch {
    // storage unavailable; access lasts until the page closes
  }
  lsRefreshMeters();
}

// Re-check the saved code each time the app opens. If the owner removed this person, access ends here.
// If the check can't run (offline), keep the current state.
async function lsCheckAccess() {
  if (!lsAccess) return;
  try {
    const res = await fetch("/api/owner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: lsAccess.code }) });
    if (res.status === 401 || res.status === 503) {
      lsSetAccess(null);
      document.querySelectorAll(".ls-meter").forEach((n) => n.replaceWith(lsMeter()));
      return;
    }
    const body = await res.json().catch(() => ({}));
    if (body.owner && body.name !== lsAccess.name) lsSetAccess({ code: lsAccess.code, name: body.name });
  } catch {
    // offline: keep access for now
  }
}
lsCheckAccess();

function lsPostsLeft() {
  if (lsIsOwner()) return Infinity;
  return Math.max(0, LS_FREE_POSTS - lsUsage().used);
}

function lsMeterText() {
  if (lsIsOwner()) return tf("lsOwner", { name: lsAccess.name || "" });
  const left = lsPostsLeft();
  return left ? tf("lsMeter", { n: left, total: LS_FREE_POSTS }) : t("lsMeterOut");
}

function lsRefreshMeters() {
  document.querySelectorAll(".ls-meter").forEach((n) => {
    n.classList.toggle("out", !lsPostsLeft());
    n.querySelector(".ls-meter-text").textContent = lsMeterText();
  });
}

// Call before a save or share. Uses one of today's posts and returns true, or opens the plans and
// returns false (cancelling the click when given its event).
function lsUsePost(event) {
  if (!lsPostsLeft()) {
    if (event) event.preventDefault();
    lsOpenPlans();
    return false;
  }
  if (lsIsOwner()) return true;
  const u = lsUsage();
  u.used += 1;
  try {
    localStorage.setItem(LS_USAGE_KEY, JSON.stringify(u));
  } catch {
    // storage unavailable; the post still goes through
  }
  lsRefreshMeters();
  return true;
}

function lsMeter() {
  const p = el("p", `ls-meter${lsPostsLeft() ? "" : " out"}`);
  p.append(el("span", "ls-meter-text", lsMeterText()));
  if (lsIsOwner()) return p;
  const link = el("button", "link-btn", t("lsPlansLink"));
  link.type = "button";
  link.addEventListener("click", lsOpenPlans);
  p.append(" ", link);
  return p;
}

// Opening the app with #owner asks for an access code; a match turns on unlimited posts for this device.
function lsOpenOwner() {
  const dialog = document.createElement("dialog");
  dialog.className = "ls-plans ls-owner";
  const form = el("form", "");
  const input = document.createElement("input");
  input.type = "password";
  input.autocomplete = "current-password";
  input.placeholder = t("lsOwnerCode");
  input.setAttribute("aria-label", t("lsOwnerCode"));
  const msg = el("p", "ls-plans-sub", "");
  msg.setAttribute("aria-live", "polite");
  const go = el("button", "btn-gold", t("lsOwnerGo"));
  go.type = "submit";
  const close = el("button", "secondary", t("lsClose"));
  close.type = "button";
  close.addEventListener("click", () => dialog.close());
  const actions = el("div", "actions");
  actions.append(go, close);
  form.append(el("h3", "", t("lsOwnerTitle")), input, msg, actions);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    go.disabled = true;
    try {
      const res = await fetch("/api/owner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: input.value }) });
      const body = await res.json().catch(() => ({}));
      if (body.owner) {
        lsSetAccess({ code: input.value, name: body.name || "" });
        document.querySelectorAll(".ls-meter .link-btn").forEach((b) => b.remove());
        msg.textContent = lsMeterText();
        setTimeout(() => dialog.close(), 900);
      } else {
        msg.textContent = t(body.error === "not_set" ? "lsOwnerNotSet" : body.error === "too_many" ? "lsOwnerWait" : "lsOwnerBad");
      }
    } catch {
      msg.textContent = t("lsOwnerErr");
    }
    go.disabled = false;
  });
  dialog.addEventListener("close", () => dialog.remove());
  // Drop #owner from the address straight away, so a reload or shared link doesn't reopen this.
  history.replaceState(null, "", location.pathname + location.search);
  dialog.append(form);
  document.body.append(dialog);
  dialog.showModal();
  input.focus();
}
if (location.hash === "#owner") window.addEventListener("load", lsOpenOwner);

function lsOpenPlans() {
  let dialog = document.getElementById("lsPlans");
  if (dialog) dialog.remove();
  dialog = document.createElement("dialog");
  dialog.id = "lsPlans";
  dialog.className = "ls-plans";
  dialog.setAttribute("aria-labelledby", "lsPlansTitle");
  const head = el("h3", "", t("lsPlansTitle"));
  head.id = "lsPlansTitle";
  const grid = el("div", "ls-plan-grid");
  LS_PLANS.forEach((plan) => {
    const card = el("div", `ls-plan${plan.current ? " current" : ""}`);
    card.append(el("p", "ls-plan-name", t(plan.name)), el("p", "ls-plan-price", t(plan.price)), el("p", "ls-plan-desc", t(plan.desc)),
      el("span", "ls-plan-tag", t(plan.current ? "lsCurrent" : "lsSoon")));
    grid.append(card);
  });
  const close = el("button", "secondary", t("lsClose"));
  close.type = "button";
  close.addEventListener("click", () => dialog.close());
  dialog.append(head, el("p", "ls-plans-sub", t("lsPlansSub")), grid, el("p", "ls-plans-sub", `${lsMeterText()} ${t("lsResets")}`), close);
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
  document.body.append(dialog);
  dialog.showModal();
}
