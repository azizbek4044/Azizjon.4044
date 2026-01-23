(() => {
  const supported = ["uz", "ru", "en"];
  const storageKey = "azizjonos_lang";
  let messages = {};
  let currentLang = localStorage.getItem(storageKey) || document.documentElement.lang || "uz";

  // Safe getter for nested keys like "nav.ai"
  const getValue = (key) => {
    if (!key) return undefined;
    return key.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), messages);
  };

  // Apply all translations silently (no errors if key missing)
  const applyTranslations = () => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = getValue(key);
      if (value === undefined || value === null) return;
      el.innerText = value;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const value = getValue(key);
      if (value === undefined || value === null) return;
      el.setAttribute("placeholder", value);
    });

    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === currentLang);
    });

    window.dispatchEvent(new Event("i18n:updated"));
  };

  const loadMessages = async (lang) => {
    try {
      const res = await fetch(`lang/${lang}.json`);
      messages = await res.json();
      document.documentElement.lang = lang;
      applyTranslations();
    } catch (err) {
      // Silent fail: keep current texts if JSON cannot be loaded
    }
  };

  const setLanguage = async (lang) => {
    if (!supported.includes(lang)) return;
    currentLang = lang;
    localStorage.setItem(storageKey, lang);
    await loadMessages(lang);
  };

  const initNav = () => {
    const navToggle = document.getElementById("navToggle");
    const header = document.querySelector(".site-header");
    navToggle?.addEventListener("click", () => {
      header?.classList.toggle("is-open");
    });

    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("active", href.endsWith(current));
    });
  };

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-lang]");
    if (!btn) return;
    setLanguage(btn.dataset.lang);
  });

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
  });

  const ready = setLanguage(currentLang);

  window.i18n = {
    t: getValue,
    setLanguage,
    getLanguage: () => currentLang,
    ready
  };
})();
