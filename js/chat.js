(() => {
  const chatWindow = document.getElementById("chatWindow");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSend");
  if (!chatWindow || !input || !sendBtn) return;

  // Helpers for language and i18n keys
  const t = (key) => window.i18n?.t?.(key);
  const getLang = () => window.i18n?.getLanguage?.() || document.documentElement.lang || "uz";

  const getSelectedAiId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ai") || "free";
  };

  const findAi = (id) => (window.AI_DATA || []).find((ai) => ai.id === id) || (window.AI_DATA || [])[0];

  // Translation session (explicit source/target selection)
  let translateSession = { source: null, target: null };

  // Add a chat bubble and keep the view scrolled to the bottom
  const addBubble = (text, isUser = false, isTyping = false) => {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble${isUser ? " user" : ""}${isTyping ? " typing" : ""}`;
    bubble.innerText = text;
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return bubble;
  };

  // Simple safety check for harmful requests
  const isUnsafe = (text) => {
    const lower = text.toLowerCase();
    const hacking = ["hack", "ddos", "phish", "keylogger", "malware", "exploit"];
    const violence = ["kill", "bomb", "weapon", "stab", "shoot", "murder"];
    const selfHarm = ["suicide", "self harm", "kill myself", "o'zimni", "o`zimni", "o?zimni"];

    const hasMatch = (list) => list.some((word) => lower.includes(word));
    return hasMatch(hacking) || hasMatch(violence) || hasMatch(selfHarm);
  };

  const safetyReply = () => {
    const lang = getLang();
    if (lang === "ru") return t("chat.safety.ru") || "Я не могу помочь с этим. Давайте обсудим безопасный вариант.";
    if (lang === "en") return t("chat.safety.en") || "I can't help with that. Let's find a safe alternative.";
    return t("chat.safety.uz") || "Bunday so'rovga yordam bera olmayman. Xavfsiz variantni ko'rib chiqamiz.";
  };

  const ROLE_BY_AI = {
    study: "study",
    tech: "tech",
    translate: "translate",
    finance: "money",
    marketing: "business",
    design: "it",
    legal: "docs",
    health: "life",
    travel: "life",
    free: "free"
  };

  const ROLE_LABELS = {
    uz: {
      study: "study",
      tech: "tech",
      translate: "translate",
      write: "write",
      money: "money",
      business: "business",
      it: "it",
      life: "life",
      docs: "docs",
      free: "free"
    },
    ru: {
      study: "study",
      tech: "tech",
      translate: "translate",
      write: "write",
      money: "money",
      business: "business",
      it: "it",
      life: "life",
      docs: "docs",
      free: "free"
    },
    en: {
      study: "study",
      tech: "tech",
      translate: "translate",
      write: "write",
      money: "money",
      business: "business",
      it: "it",
      life: "life",
      docs: "docs",
      free: "free"
    }
  };

  const detectRoleByMessage = (text) => {
    const lower = text.toLowerCase();
    const has = (list) => list.some((word) => lower.includes(word));

    if (has(["tarjima", "translate", "перев", "ingliz", "рус", "uzbek", "en ", "ru ", "uz "])) return "translate";
    if (has(["dars", "o'qish", "imtihon", "study", "lesson", "exam", "учеб", "экзам"])) return "study";
    if (has(["telefon", "kompyuter", "noutbuk", "wifi", "laptop", "pc", "device", "устрой", "телефон", "комп"])) return "tech";
    if (has(["ariza", "xabar", "post", "matn yoz", "write", "letter", "заявлен", "сообщен", "пост"])) return "write";
    if (has(["pul", "daromad", "ish top", "money", "income", "заработ", "доход"])) return "money";
    if (has(["biznes", "mijoz", "sotuv", "business", "sales", "клиент", "продаж"])) return "business";
    if (has(["it", "program", "texno", "айти", "технолог"])) return "it";
    if (has(["hayot", "stress", "motiv", "life", "жизн", "стресс"])) return "life";
    if (has(["hujjat", "shartnoma", "contract", "документ", "договор"])) return "docs";

    return null;
  };

  const formatReply = (summary, steps, warning, question) => {
    const parts = [];
    if (summary) parts.push(summary);
    if (steps?.length) {
      parts.push(steps.map((step, i) => `${i + 1}) ${step}`).join("\n"));
    }
    if (warning) parts.push(warning);
    if (question) parts.push(question);
    return parts.join("\n");
  };

  // Per-AI mock responses (3-5 steps + final question)
  const RESPONSES = {
    free: {
      uz: { steps: ["Qisqa qilib vazifani yozing.", "Asosiy maqsadni ayting.", "Men sodda reja beraman."], question: "Qaysi natijani xohlaysiz?" },
      ru: { steps: ["Коротко опишите задачу.", "Укажите цель.", "Я дам простой план."], question: "Какой результат нужен?" },
      en: { steps: ["Briefly describe the task.", "Tell me the goal.", "I'll give a simple plan."], question: "What result do you want?" }
    },
    tech: {
      uz: { steps: ["Muammoni qisqa yozing.", "Qurilmani qayta yoqing.", "Xato kodi bo'lsa yuboring."], question: "Qaysi qurilmada muammo bor?" },
      ru: { steps: ["Кратко опишите проблему.", "Перезагрузите устройство.", "Пришлите код ошибки."], question: "На каком устройстве проблема?" },
      en: { steps: ["Briefly describe the issue.", "Restart the device.", "Share any error code."], question: "Which device has the problem?" }
    },
    study: {
      uz: { steps: ["Mavzuni ayting.", "Muddatingizni yozing.", "Kunlik reja tuzamiz."], question: "Qaysi fan bo'yicha?" },
      ru: { steps: ["Назовите тему.", "Укажите срок.", "Составим план по дням."], question: "По какому предмету?" },
      en: { steps: ["Tell me the topic.", "Share the deadline.", "We'll build a daily plan."], question: "Which subject?" }
    },
    finance: {
      uz: { steps: ["Daromad va xarajatni yozing.", "3 bo'limga ajratamiz.", "Tejash qadamini beraman."], question: "Oylik daromadingiz qancha?" },
      ru: { steps: ["Укажите доходы и расходы.", "Разделим на 3 блока.", "Дам шаги экономии."], question: "Какой у вас месячный доход?" },
      en: { steps: ["Share income and expenses.", "We'll split into 3 blocks.", "I'll suggest saving steps."], question: "What is your monthly income?" }
    },
    translate: {
      uz: { steps: ["Matnni yuboring.", "Tilni ayting.", "Qisqa variantni ham beraman."], question: "Qaysi tildan qaysi tilga?" },
      ru: { steps: ["Пришлите текст.", "Укажите язык.", "Дам короткий вариант."], question: "С какого языка на какой?" },
      en: { steps: ["Send the text.", "Tell me the language.", "I'll add a short version."], question: "From which language to which?" }
    },
    health: {
      uz: { steps: ["Alomatni qisqa yozing.", "Qachondan beri?", "Yengil tavsiya beraman."], question: "Hozir nima bezovta qiladi?" },
      ru: { steps: ["Кратко опишите симптом.", "Сколько времени?", "Дам мягкие рекомендации."], question: "Что беспокоит больше всего?" },
      en: { steps: ["Describe the symptom.", "How long has it been?", "I'll give gentle tips."], question: "What bothers you most?" }
    },
    travel: {
      uz: { steps: ["Manzilni yozing.", "Sana va byudjetni ayting.", "2-3 variant beraman."], question: "Qayerga bormoqchisiz?" },
      ru: { steps: ["Укажите направление.", "Даты и бюджет.", "Дам 2-3 варианта."], question: "Куда хотите поехать?" },
      en: { steps: ["Share destination.", "Dates and budget.", "I'll suggest 2-3 options."], question: "Where do you want to go?" }
    },
    legal: {
      uz: { steps: ["Masala turini yozing.", "Hujjatlar ro'yxatini beraman.", "Xatarlarni aytaman."], question: "Qaysi soha: ijara, ish, shartnoma?" },
      ru: { steps: ["Укажите тип вопроса.", "Дам список документов.", "Назову риски."], question: "Сфера: аренда, работа, договор?" },
      en: { steps: ["Tell me the issue type.", "I'll list documents.", "I'll note risks."], question: "Which area: rental, work, contract?" }
    },
    design: {
      uz: { steps: ["Loyiha turini ayting.", "Auditoriyani yozing.", "Style va rang taklif qilaman."], question: "Qaysi sahifa kerak?" },
      ru: { steps: ["Укажите тип проекта.", "Опишите аудиторию.", "Предложу стиль и цвета."], question: "Какая страница нужна?" },
      en: { steps: ["Tell me the project type.", "Describe the audience.", "I'll suggest style and colors."], question: "What page do you need?" }
    },
    marketing: {
      uz: { steps: ["Mahsulotni qisqa yozing.", "Kimga sotyapsiz?", "3 ta taklif beraman."], question: "Qaysi kanalni xohlaysiz?" },
      ru: { steps: ["Кратко опишите продукт.", "Кому продаете?", "Дам 3 идеи."], question: "Какой канал нужен?" },
      en: { steps: ["Briefly describe the product.", "Who is it for?", "I'll give 3 ideas."], question: "Which channel do you want?" }
    }
  };

  // Translation helpers
  const hasCyrillic = (text) => /[\u0400-\u04FF]/.test(text);

  const normalizeText = (text) => text.toLowerCase().replace(/\s+/g, " ").trim();

  const parseLangPair = (text) => {
    const normalized = normalizeText(text);
    const pairMap = {
      uzen: ["UZ", "EN"],
      enuz: ["EN", "UZ"],
      uzru: ["UZ", "RU"],
      ruen: ["RU", "EN"],
      enru: ["EN", "RU"],
      ruuz: ["RU", "UZ"]
    };

    if (pairMap[normalized]) return pairMap[normalized];

    const match = normalized.match(/(uz|ru|en)\s*(?:-|->|to)?\s*(uz|ru|en)/);
    if (match) return [match[1].toUpperCase(), match[2].toUpperCase()];

    const fromToMatch = normalized.match(/from\s+(uz|ru|en)\s+to\s+(uz|ru|en)/);
    if (fromToMatch) return [fromToMatch[1].toUpperCase(), fromToMatch[2].toUpperCase()];

    return null;
  };

  const isLangSelector = (text) => !!parseLangPair(text);

  const detectTargetLang = (text) => {
    const lower = text.toLowerCase();
    if (/(\binglizchaga\b|\benglish\b|\ben\b)/i.test(lower)) return "EN";
    if (/(\bruschaga\b|\brussian\b|\bru\b)/i.test(lower)) return "RU";
    if (/(\bo['’`]?zbekchaga\b|\buzbek\b|\buz\b)/i.test(lower)) return "UZ";
    return null;
  };

  const detectExplicitSourceLang = (text) => {
    const lower = text.toLowerCase();
    if (/(\binglizchadan\b|\benglish\b)/i.test(lower)) return "EN";
    if (/(\bruschadan\b|\brussian\b)/i.test(lower)) return "RU";
    if (/(\bo['’`]?zbekchadan\b|\buzbek\b)/i.test(lower)) return "UZ";
    return null;
  };

  const detectSourceLang = (text) => detectExplicitSourceLang(text) || (hasCyrillic(text) ? "RU" : "UZ");

  const mockTranslate = (text, targetLang) => {
    const base = text.trim().replace(/\s+/g, " ");
    if (!base) return "";
    if (targetLang === "EN") return `${base} (EN)`;
    if (targetLang === "RU") return `${base} (RU)`;
    return `${base} (UZ)`;
  };

  const translationTemplates = {
    uz: [
      (target, result, short, formal) => `Tarjima (${target}): ${result}\nQisqa variant: ${short}\nRasmiy variant: ${formal}`,
      (target, result, short, formal) => `Tarjima (${target}): ${result}\nRasmiy variant: ${formal}\nQisqa variant: ${short}`,
      (target, result, short, formal) => `Tarjima (${target}): ${result}\nQisqa variant: ${short}\nRasmiy variant: ${formal}`
    ],
    ru: [
      (target, result, short, formal) => `Перевод (${target}): ${result}\nКороткий вариант: ${short}\nОфициальный вариант: ${formal}`,
      (target, result, short, formal) => `Перевод (${target}): ${result}\nОфициальный вариант: ${formal}\nКороткий вариант: ${short}`,
      (target, result, short, formal) => `Перевод (${target}): ${result}\nКороткий вариант: ${short}\nОфициальный вариант: ${formal}`
    ],
    en: [
      (target, result, short, formal) => `Translation (${target}): ${result}\nShort version: ${short}\nFormal version: ${formal}`,
      (target, result, short, formal) => `Translation (${target}): ${result}\nFormal version: ${formal}\nShort version: ${short}`,
      (target, result, short, formal) => `Translation (${target}): ${result}\nShort version: ${short}\nFormal version: ${formal}`
    ]
  };

  const lastReplyKey = {};

  const pickTemplate = (key, templates) => {
    const lastIndex = lastReplyKey[key] ?? -1;
    let index = Math.floor(Math.random() * templates.length);
    if (index === lastIndex) index = (index + 1) % templates.length;
    lastReplyKey[key] = index;
    return templates[index];
  };

  const buildTranslationWithSession = (text, session) => {
    const lang = getLang();
    const templates = translationTemplates[lang] || translationTemplates.uz;
    const result = mockTranslate(text, session.target || "EN");
    const short = mockTranslate(text, session.target || "EN");
    const formal = mockTranslate(text, session.target || "EN");

    const key = `translate::session::${text.toLowerCase()}`;
    const template = pickTemplate(key, templates);
    const summary = lang === "ru"
      ? "Перевод готов."
      : lang === "en"
        ? "Translation is ready."
        : "Tarjima tayyor.";
    const question = lang === "ru"
      ? "Еще вариант нужен?"
      : lang === "en"
        ? "Need another variant?"
        : "Yana variant kerakmi?";

    const lines = template(session.target || "EN", result, short, formal).split("\n");
    return formatReply(summary, lines, null, question);
  };

  const buildTranslation = (text) => {
    const lang = getLang();
    const target = detectTargetLang(text);
    if (!target) return null;

    const source = detectSourceLang(text);
    const cleanText = text.replace(/\b(inglizchadan|inglizchaga|ruschadan|ruschaga|o['’`]?zbekchadan|o['’`]?zbekchaga|english|russian|uzbek|en|ru|uz)\b/gi, "").trim();
    const result = mockTranslate(cleanText || text, target);
    const short = mockTranslate(cleanText || text, target);
    const formal = mockTranslate(cleanText || text, target);

    const templates = translationTemplates[lang] || translationTemplates.uz;
    const key = `translate::auto::${text.toLowerCase()}`;
    const template = pickTemplate(key, templates);

    const summary = lang === "ru"
      ? "Перевод готов."
      : lang === "en"
        ? "Translation is ready."
        : "Tarjima tayyor.";
    const question = lang === "ru"
      ? "Еще вариант нужен?"
      : lang === "en"
        ? "Need another variant?"
        : "Yana variant kerakmi?";

    const lines = template(target, result, short, formal).split("\n");
    const warning = `(${source} -> ${target})`;
    return formatReply(summary, lines, warning, question);
  };

  const buildWrongRoleReply = (currentRole, suggestedRole) => {
    const lang = getLang();
    const labels = ROLE_LABELS[lang] || ROLE_LABELS.uz;
    if (lang === "ru") {
      return formatReply(
        "Этот вопрос не для выбранной роли.",
        [
          `Лучше подойдет: ${labels[suggestedRole]}.`,
          "Переключите роль в списке AI.",
          "Задайте вопрос снова."
        ],
        null,
        `Перейти на ${labels[suggestedRole]}?`
      );
    }
    if (lang === "en") {
      return formatReply(
        "This question does not match the current role.",
        [
          `Better fit: ${labels[suggestedRole]}.`,
          "Switch the role in the AI list.",
          "Ask the question again."
        ],
        null,
        `Switch to ${labels[suggestedRole]}?`
      );
    }
    return formatReply(
      "Bu savol hozirgi rolga mos emas.",
      [
        `Yaxshiroq rol: ${labels[suggestedRole]}.`,
        "AI ro'yxatidan rolni almashtiring.",
        "Savolni qayta yuboring."
      ],
      null,
      `${labels[suggestedRole]} roliga o'tamizmi?`
    );
  };

  const buildResponse = (aiId, text) => {
    const lang = getLang();
    const currentRole = ROLE_BY_AI[aiId] || "free";
    const detectedRole = detectRoleByMessage(text);

    if (detectedRole && detectedRole !== currentRole && currentRole !== "free") {
      return buildWrongRoleReply(currentRole, detectedRole);
    }

    if (aiId === "translate") {
      // 1) If user sends a language selector, set session and do not translate
      if (isLangSelector(text)) {
        const pair = parseLangPair(text);
        if (pair) {
          translateSession = { source: pair[0], target: pair[1] };
        }
        return lang === "ru"
          ? "OK. Теперь отправьте текст."
          : lang === "en"
            ? "OK. Now send the text."
            : "OK. Endi matnni yuboring.";
      }

      // 2) If session target exists, translate the incoming text
      if (translateSession.target) {
        return buildTranslationWithSession(text, translateSession);
      }

      // 3) Auto target detection if no session
      const translated = buildTranslation(text);
      if (translated) return translated;

      const pack = RESPONSES.translate[lang] || RESPONSES.translate.uz;
      return formatReply(
        lang === "ru" ? "Нужно уточнение." : lang === "en" ? "I need details." : "Aniqlashtirish kerak.",
        pack.steps,
        null,
        pack.question
      );
    }

    const pack = RESPONSES[aiId]?.[lang] || RESPONSES.free[lang];
    return formatReply(
      lang === "ru" ? "Короткий ответ ниже." : lang === "en" ? "Short answer below." : "Qisqa javob quyida.",
      pack.steps,
      null,
      pack.question
    );
  };

  const getStartMessage = (aiId) => {
    const lang = getLang();
    const key = `chat.start.${aiId}`;
    return t(key) || t("chat.start.free") || (lang === "ru" ? "Привет! Чем могу помочь?" : lang === "en" ? "Hi! How can I help?" : "Salom! Qanday yordam bera olaman?");
  };

  // Start chat with a greeting based on selected AI
  const greet = () => {
    const ai = findAi(getSelectedAiId());
    chatWindow.innerHTML = "";
    addBubble(getStartMessage(ai?.id || "free"));
  };

  // Send a message with typing delay and a mock response
  const sendMessage = () => {
    const text = input.value.trim();
    if (!text) return;
    addBubble(text, true);
    input.value = "";

    const typingText = t("chat.typing") || "typing...";
    const typingBubble = addBubble(typingText, false, true);
    const delay = 400 + Math.floor(Math.random() * 300);

    setTimeout(() => {
      typingBubble.remove();
      if (isUnsafe(text)) {
        addBubble(safetyReply());
        return;
      }
      addBubble(buildResponse(getSelectedAiId(), text));
    }, delay);
  };

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  if (window.i18n?.ready) {
    window.i18n.ready.then(greet);
  } else {
    greet();
  }

  window.addEventListener("i18n:updated", greet);
})();
