// Home and pricing text for the "proof, not advice" positioning: the hero, the comparison with an AI
// chatbot, and pricing that is free for athletes and paid by schools and clubs. It also replaces the
// older pricing strings (proIntro, proJoin, pricingNote) in every language.

(function homeText() {
  const I18N_HOME = {
    en: {
      hmEyebrow: "Sports careers · by LJSOCCER", hmTitleA: "Advice is everywhere.", hmTitleB: "Proof isn't.",
      hmSub: "Find the sports career that fits you, prove you can do it with LJ Coach Certification, and show employers a certificate they can see.",
      hmCtaProof: "Get certified", hmCredKicker: "Certification", hmCredId: "Example credential",
      hmCmpTitle: "Why not just ask an AI chatbot?", hmCmpBot: "AI chatbot", hmCmpUs: "LJSportMind", hmPartly: "Partly",
      hmCmpR1: "Career ideas from what you tell it", hmCmpR2: "Saves your Passport, matches and plan",
      hmCmpR3: "Graded certification levels, the same for everyone", hmCmpR4: "Certificate with a credential ID for LinkedIn",
      hmCmpR5: "Passing a level updates your matches and plan", hmCmpR6: "Physical-fit check for coaching and game-day roles",
      hmCmpLine: "A chatbot repeats what you tell it. LJSportMind proves it.",
      hmAthT: "Athletes", hmAthPrice: "Free", hmAthD: "Passport, career matches, plan, LJ Coach Certification and Body ID.",
      hmSchT: "Schools & clubs", hmSchPrice: "Team license", hmSchD: "Every athlete gets it free. Coming next: a staff view of anonymous progress and certified skills across the team.",
      proIntro: "Free for athletes. Schools and clubs license it for their teams.", proIntroLive: "Free for athletes. Schools and clubs license it for their teams.",
      pricingNote: "School pricing is being tested with athletic departments.", proJoin: "Get it for my school or club"
    },
    es: {
      hmEyebrow: "Carreras en el deporte · por LJSOCCER", hmTitleA: "Consejos hay en todas partes.", hmTitleB: "Pruebas, no.",
      hmSub: "Encuentra la carrera deportiva que encaja contigo, demuestra que puedes hacerlo con la Certificación LJ Coach y enseña a las empresas un certificado que pueden ver.",
      hmCtaProof: "Certificarme", hmCredKicker: "Certificación", hmCredId: "Credencial de ejemplo",
      hmCmpTitle: "¿Por qué no preguntarle a un chatbot de IA?", hmCmpBot: "Chatbot de IA", hmCmpUs: "LJSportMind", hmPartly: "En parte",
      hmCmpR1: "Ideas de carrera a partir de lo que le cuentas", hmCmpR2: "Guarda tu Pasaporte, tus coincidencias y tu plan",
      hmCmpR3: "Niveles de certificación calificados, iguales para todos", hmCmpR4: "Certificado con ID de credencial para LinkedIn",
      hmCmpR5: "Aprobar un nivel actualiza tus coincidencias y tu plan", hmCmpR6: "Revisión física para puestos de entrenador y de día de partido",
      hmCmpLine: "Un chatbot repite lo que le cuentas. LJSportMind lo demuestra.",
      hmAthT: "Deportistas", hmAthPrice: "Gratis", hmAthD: "Pasaporte, carreras compatibles, plan, Certificación LJ Coach y Body ID.",
      hmSchT: "Escuelas y clubes", hmSchPrice: "Licencia de equipo", hmSchD: "Cada deportista lo usa gratis. Próximamente: una vista para el personal con el progreso anónimo y las habilidades certificadas de todo el equipo.",
      proIntro: "Gratis para deportistas. Las escuelas y los clubes lo licencian para sus equipos.", proIntroLive: "Gratis para deportistas. Las escuelas y los clubes lo licencian para sus equipos.",
      pricingNote: "El precio para escuelas se está probando con departamentos deportivos.", proJoin: "Lo quiero para mi escuela o club"
    },
    zh: {
      hmEyebrow: "体育职业 · LJSOCCER 出品", hmTitleA: "建议随处可得。", hmTitleB: "证明却不是。",
      hmSub: "找到适合你的体育职业，用 LJ 教练认证证明你的能力，并向雇主展示一份看得见的证书。",
      hmCtaProof: "获取认证", hmCredKicker: "认证", hmCredId: "示例证书",
      hmCmpTitle: "为什么不直接问 AI 聊天机器人？", hmCmpBot: "AI 聊天机器人", hmCmpUs: "LJSportMind", hmPartly: "部分",
      hmCmpR1: "根据你说的内容给出职业建议", hmCmpR2: "保存你的护照、匹配结果和计划",
      hmCmpR3: "人人相同、有评分的认证级别", hmCmpR4: "带证书编号、可添加到 LinkedIn 的证书",
      hmCmpR5: "通过级别会自动更新匹配和计划", hmCmpR6: "教练和比赛日岗位的身体适配检查",
      hmCmpLine: "聊天机器人只会重复你说的话。LJSportMind 帮你证明。",
      hmAthT: "运动员", hmAthPrice: "免费", hmAthD: "护照、职业匹配、计划、LJ 教练认证和 Body ID。",
      hmSchT: "学校和俱乐部", hmSchPrice: "团队授权", hmSchD: "每位运动员都可免费使用。即将推出：工作人员可查看全队的匿名进度和已认证技能。",
      proIntro: "运动员免费。学校和俱乐部为球队购买授权。", proIntroLive: "运动员免费。学校和俱乐部为球队购买授权。",
      pricingNote: "学校定价正在与体育部门一起测试。", proJoin: "为我的学校或俱乐部申请"
    },
    ar: {
      hmEyebrow: "المهن الرياضية · من LJSOCCER", hmTitleA: "النصائح في كل مكان.", hmTitleB: "الإثبات ليس كذلك.",
      hmSub: "اعثر على المهنة الرياضية التي تناسبك، وأثبت قدرتك عليها بشهادة LJ Coach، واعرض على أصحاب العمل شهادة يمكنهم رؤيتها.",
      hmCtaProof: "احصل على الشهادة", hmCredKicker: "شهادة", hmCredId: "شهادة نموذجية",
      hmCmpTitle: "لماذا لا تسأل روبوت دردشة بالذكاء الاصطناعي؟", hmCmpBot: "روبوت دردشة", hmCmpUs: "LJSportMind", hmPartly: "جزئيًا",
      hmCmpR1: "أفكار مهنية مما تخبره به", hmCmpR2: "يحفظ جوازك ومساراتك وخطتك",
      hmCmpR3: "مستويات شهادة مُقيَّمة وموحّدة للجميع", hmCmpR4: "شهادة برقم اعتماد لـ LinkedIn",
      hmCmpR5: "اجتياز مستوى يحدّث مساراتك وخطتك", hmCmpR6: "فحص الملاءمة البدنية لأدوار التدريب ويوم المباراة",
      hmCmpLine: "روبوت الدردشة يكرر ما تقوله. LJSportMind يثبته.",
      hmAthT: "الرياضيون", hmAthPrice: "مجاني", hmAthD: "الجواز والمسارات المهنية والخطة وشهادة LJ Coach وBody ID.",
      hmSchT: "المدارس والأندية", hmSchPrice: "ترخيص للفريق", hmSchD: "كل رياضي يستخدمه مجانًا. قريبًا: عرض للطاقم يُظهر التقدم المجهول الهوية والمهارات المعتمدة للفريق كله.",
      proIntro: "مجاني للرياضيين. المدارس والأندية ترخّصه لفرقها.", proIntroLive: "مجاني للرياضيين. المدارس والأندية ترخّصه لفرقها.",
      pricingNote: "يجري اختبار تسعير المدارس مع الإدارات الرياضية.", proJoin: "أريده لمدرستي أو نادي"
    },
    fr: {
      hmEyebrow: "Métiers du sport · par LJSOCCER", hmTitleA: "Les conseils sont partout.", hmTitleB: "Les preuves, non.",
      hmSub: "Trouve le métier du sport qui te correspond, prouve que tu sais le faire avec la Certification LJ Coach, et montre aux employeurs un certificat qu'ils peuvent voir.",
      hmCtaProof: "Me certifier", hmCredKicker: "Certification", hmCredId: "Certificat d'exemple",
      hmCmpTitle: "Pourquoi ne pas simplement demander à un chatbot IA ?", hmCmpBot: "Chatbot IA", hmCmpUs: "LJSportMind", hmPartly: "En partie",
      hmCmpR1: "Des idées de métiers selon ce que tu lui dis", hmCmpR2: "Enregistre ton Passeport, tes métiers et ton plan",
      hmCmpR3: "Des niveaux de certification notés, les mêmes pour tous", hmCmpR4: "Un certificat avec un identifiant pour LinkedIn",
      hmCmpR5: "Réussir un niveau met à jour tes métiers et ton plan", hmCmpR6: "Vérification physique pour les métiers d'entraîneur et de jour de match",
      hmCmpLine: "Un chatbot répète ce que tu lui dis. LJSportMind le prouve.",
      hmAthT: "Sportifs", hmAthPrice: "Gratuit", hmAthD: "Passeport, métiers compatibles, plan, Certification LJ Coach et Body ID.",
      hmSchT: "Écoles et clubs", hmSchPrice: "Licence d'équipe", hmSchD: "Chaque sportif l'utilise gratuitement. Bientôt : une vue pour le staff avec la progression anonyme et les compétences certifiées de toute l'équipe.",
      proIntro: "Gratuit pour les sportifs. Les écoles et les clubs le prennent sous licence pour leurs équipes.", proIntroLive: "Gratuit pour les sportifs. Les écoles et les clubs le prennent sous licence pour leurs équipes.",
      pricingNote: "Le prix pour les écoles est en test avec des départements sportifs.", proJoin: "Je le veux pour mon école ou mon club"
    },
    pt: {
      hmEyebrow: "Carreiras no esporte · por LJSOCCER", hmTitleA: "Conselho tem em todo lugar.", hmTitleB: "Prova, não.",
      hmSub: "Encontre a carreira no esporte que combina com você, prove que sabe fazer com a Certificação LJ Coach e mostre aos empregadores um certificado que eles podem ver.",
      hmCtaProof: "Quero me certificar", hmCredKicker: "Certificação", hmCredId: "Credencial de exemplo",
      hmCmpTitle: "Por que não perguntar a um chatbot de IA?", hmCmpBot: "Chatbot de IA", hmCmpUs: "LJSportMind", hmPartly: "Em parte",
      hmCmpR1: "Ideias de carreira a partir do que você conta", hmCmpR2: "Salva seu Passaporte, suas funções e seu plano",
      hmCmpR3: "Níveis de certificação avaliados, iguais para todos", hmCmpR4: "Certificado com ID de credencial para o LinkedIn",
      hmCmpR5: "Passar de nível atualiza suas funções e seu plano", hmCmpR6: "Checagem física para funções de treinador e de dia de jogo",
      hmCmpLine: "Um chatbot repete o que você conta. O LJSportMind prova.",
      hmAthT: "Atletas", hmAthPrice: "Grátis", hmAthD: "Passaporte, funções compatíveis, plano, Certificação LJ Coach e Body ID.",
      hmSchT: "Escolas e clubes", hmSchPrice: "Licença de equipe", hmSchD: "Todo atleta usa grátis. Em breve: uma visão para a equipe técnica com o progresso anônimo e as habilidades certificadas de todo o time.",
      proIntro: "Grátis para atletas. Escolas e clubes licenciam para suas equipes.", proIntroLive: "Grátis para atletas. Escolas e clubes licenciam para suas equipes.",
      pricingNote: "O preço para escolas está sendo testado com departamentos esportivos.", proJoin: "Quero para minha escola ou clube"
    },
    de: {
      hmEyebrow: "Sportkarrieren · von LJSOCCER", hmTitleA: "Ratschläge gibt es überall.", hmTitleB: "Nachweise nicht.",
      hmSub: "Finde den Sportberuf, der zu dir passt, beweise mit der LJ Coach Zertifizierung, dass du es kannst, und zeig Arbeitgebern ein Zertifikat, das sie sehen können.",
      hmCtaProof: "Zertifizieren lassen", hmCredKicker: "Zertifizierung", hmCredId: "Beispielnachweis",
      hmCmpTitle: "Warum nicht einfach einen KI-Chatbot fragen?", hmCmpBot: "KI-Chatbot", hmCmpUs: "LJSportMind", hmPartly: "Teilweise",
      hmCmpR1: "Berufsideen aus dem, was du ihm erzählst", hmCmpR2: "Speichert deinen Pass, deine Berufe und deinen Plan",
      hmCmpR3: "Bewertete Zertifizierungsstufen, für alle gleich", hmCmpR4: "Zertifikat mit Nachweis-ID für LinkedIn",
      hmCmpR5: "Eine bestandene Stufe aktualisiert Berufe und Plan", hmCmpR6: "Körper-Check für Trainer- und Spieltagsberufe",
      hmCmpLine: "Ein Chatbot wiederholt, was du ihm sagst. LJSportMind beweist es.",
      hmAthT: "Sportler", hmAthPrice: "Kostenlos", hmAthD: "Pass, passende Berufe, Plan, LJ Coach Zertifizierung und Body ID.",
      hmSchT: "Schulen & Vereine", hmSchPrice: "Teamlizenz", hmSchD: "Jeder Sportler nutzt es kostenlos. Als Nächstes: eine Ansicht für Betreuer mit anonymem Fortschritt und zertifizierten Fähigkeiten im ganzen Team.",
      proIntro: "Kostenlos für Sportler. Schulen und Vereine lizenzieren es für ihre Teams.", proIntroLive: "Kostenlos für Sportler. Schulen und Vereine lizenzieren es für ihre Teams.",
      pricingNote: "Die Preise für Schulen werden mit Sportabteilungen getestet.", proJoin: "Für meine Schule oder meinen Verein"
    },
    it: {
      hmEyebrow: "Carriere nello sport · di LJSOCCER", hmTitleA: "I consigli sono ovunque.", hmTitleB: "Le prove no.",
      hmSub: "Trova la carriera nello sport adatta a te, dimostra di saperla fare con la Certificazione LJ Coach e mostra ai datori di lavoro un certificato che possono vedere.",
      hmCtaProof: "Certificami", hmCredKicker: "Certificazione", hmCredId: "Credenziale di esempio",
      hmCmpTitle: "Perché non chiedere a un chatbot IA?", hmCmpBot: "Chatbot IA", hmCmpUs: "LJSportMind", hmPartly: "In parte",
      hmCmpR1: "Idee di carriera da ciò che gli racconti", hmCmpR2: "Salva il tuo Passaporto, i ruoli e il piano",
      hmCmpR3: "Livelli di certificazione valutati, uguali per tutti", hmCmpR4: "Certificato con ID credenziale per LinkedIn",
      hmCmpR5: "Superare un livello aggiorna ruoli e piano", hmCmpR6: "Controllo fisico per i ruoli da allenatore e da giorno partita",
      hmCmpLine: "Un chatbot ripete ciò che gli dici. LJSportMind lo dimostra.",
      hmAthT: "Atleti", hmAthPrice: "Gratis", hmAthD: "Passaporto, ruoli compatibili, piano, Certificazione LJ Coach e Body ID.",
      hmSchT: "Scuole e club", hmSchPrice: "Licenza di squadra", hmSchD: "Ogni atleta lo usa gratis. In arrivo: una vista per lo staff con i progressi anonimi e le competenze certificate di tutta la squadra.",
      proIntro: "Gratis per gli atleti. Scuole e club lo prendono in licenza per le loro squadre.", proIntroLive: "Gratis per gli atleti. Scuole e club lo prendono in licenza per le loro squadre.",
      pricingNote: "Il prezzo per le scuole è in fase di test con i dipartimenti sportivi.", proJoin: "Lo voglio per la mia scuola o il mio club"
    },
    hi: {
      hmEyebrow: "स्पोर्ट्स करियर · LJSOCCER द्वारा", hmTitleA: "सलाह हर जगह है।", hmTitleB: "सबूत नहीं।",
      hmSub: "अपने लिए सही स्पोर्ट्स करियर खोजें, LJ Coach प्रमाणन से साबित करें कि आप यह कर सकते हैं, और नियोक्ताओं को ऐसा प्रमाणपत्र दिखाएँ जिसे वे देख सकें।",
      hmCtaProof: "प्रमाणन लें", hmCredKicker: "प्रमाणन", hmCredId: "उदाहरण प्रमाणपत्र",
      hmCmpTitle: "सीधे किसी AI चैटबॉट से क्यों न पूछें?", hmCmpBot: "AI चैटबॉट", hmCmpUs: "LJSportMind", hmPartly: "आंशिक",
      hmCmpR1: "आपकी बताई बातों से करियर के सुझाव", hmCmpR2: "आपका पासपोर्ट, मिलान और प्लान सेव करता है",
      hmCmpR3: "सबके लिए एक जैसे, अंकित प्रमाणन स्तर", hmCmpR4: "LinkedIn के लिए क्रेडेंशियल ID वाला प्रमाणपत्र",
      hmCmpR5: "स्तर पास करने पर मिलान और प्लान अपडेट होते हैं", hmCmpR6: "कोचिंग और मैच-डे भूमिकाओं के लिए शारीरिक जाँच",
      hmCmpLine: "चैटबॉट वही दोहराता है जो आप बताते हैं। LJSportMind उसे साबित करता है।",
      hmAthT: "खिलाड़ी", hmAthPrice: "फ़्री", hmAthD: "पासपोर्ट, करियर मिलान, प्लान, LJ Coach प्रमाणन और Body ID।",
      hmSchT: "स्कूल और क्लब", hmSchPrice: "टीम लाइसेंस", hmSchD: "हर खिलाड़ी इसे फ़्री में इस्तेमाल करता है। जल्द ही: स्टाफ़ के लिए पूरी टीम की गुमनाम प्रगति और प्रमाणित कौशल का व्यू।",
      proIntro: "खिलाड़ियों के लिए फ़्री। स्कूल और क्लब अपनी टीमों के लिए इसका लाइसेंस लेते हैं।", proIntroLive: "खिलाड़ियों के लिए फ़्री। स्कूल और क्लब अपनी टीमों के लिए इसका लाइसेंस लेते हैं।",
      pricingNote: "स्कूलों की कीमत खेल विभागों के साथ परखी जा रही है।", proJoin: "मेरे स्कूल या क्लब के लिए चाहिए"
    },
    ja: {
      hmEyebrow: "スポーツキャリア · LJSOCCER", hmTitleA: "アドバイスはどこにでもある。", hmTitleB: "証明はそうじゃない。",
      hmSub: "自分に合うスポーツの仕事を見つけ、LJ Coach認定で実力を証明し、雇用主に見せられる修了証を手に入れよう。",
      hmCtaProof: "認定を受ける", hmCredKicker: "認定", hmCredId: "認定証の例",
      hmCmpTitle: "AIチャットボットに聞けば十分では？", hmCmpBot: "AIチャットボット", hmCmpUs: "LJSportMind", hmPartly: "一部",
      hmCmpR1: "伝えた内容からキャリアのアイデア", hmCmpR2: "パスポート・マッチ・プランを保存",
      hmCmpR3: "全員共通の採点つき認定レベル", hmCmpR4: "LinkedIn用の認定ID付き修了証",
      hmCmpR5: "合格するとマッチとプランが自動更新", hmCmpR6: "コーチや試合日の仕事向けの身体チェック",
      hmCmpLine: "チャットボットは伝えたことを繰り返すだけ。LJSportMindは証明する。",
      hmAthT: "アスリート", hmAthPrice: "無料", hmAthD: "パスポート、キャリアマッチ、プラン、LJ Coach認定、Body ID。",
      hmSchT: "学校・クラブ", hmSchPrice: "チームライセンス", hmSchD: "アスリートは全員無料。次に登場：チーム全体の匿名の進捗と認定スキルを見られるスタッフ用ビュー。",
      proIntro: "アスリートは無料。学校やクラブがチーム向けにライセンスします。", proIntroLive: "アスリートは無料。学校やクラブがチーム向けにライセンスします。",
      pricingNote: "学校向けの価格は体育部門と一緒に検証中です。", proJoin: "自分の学校・クラブに導入したい"
    }
  };
  Object.keys(I18N_HOME).forEach((lang) => (I18N[lang] = Object.assign(I18N[lang] || {}, I18N_HOME[lang])));
  // Locale files that load later bring the older pricing text; put this text back on top.
  const originalRegister = registerLocale;
  registerLocale = function (code, pack) {
    originalRegister(code, pack);
    if (I18N_HOME[code]) Object.assign(I18N[code], I18N_HOME[code]);
  };
  // The page was translated before this file loaded, so translate the new text now and on each change.
  const translate = () => document.querySelectorAll("[data-i18n]").forEach((n) => {
    if (I18N.en[n.dataset.i18n] !== undefined) n.textContent = t(n.dataset.i18n);
  });
  translate();
  document.getElementById("proIntroText").textContent = t("proIntro");
  document.getElementById("langSelect").addEventListener("change", () => setTimeout(translate));
})();
