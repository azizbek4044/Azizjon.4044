(() => {
  const getLang = () => window.i18n?.getLanguage?.() || document.documentElement.lang || "uz";
  const t = (key) => window.i18n?.t?.(key);

  // Render a small preview grid on the home page
  const renderPreview = () => {
    const preview = document.getElementById("aiPreview");
    if (!preview || !window.AI_DATA) return;

    preview.innerHTML = "";
    window.AI_DATA.slice(0, 6).forEach((item) => {
      const card = document.createElement("article");
      card.className = "card ai-card";
      card.innerHTML = `
        <div class="icon">${item.icon}</div>
        <h3>${t(item.titleKey) || item.id}</h3>
        <p>${t(item.descKey) || ""}</p>
      `;
      preview.appendChild(card);
    });
  };

  // Render full AI list on ai.html
  const renderAiGrid = () => {
    const grid = document.getElementById("aiGrid");
    if (!grid || !window.AI_DATA) return;

    grid.innerHTML = "";
    window.AI_DATA.forEach((item) => {
      const card = document.createElement("a");
      card.className = "card ai-card";
      card.href = `chat.html?ai=${encodeURIComponent(item.id)}`;
      card.innerHTML = `
        <div class="icon">${item.icon}</div>
        <h3>${t(item.titleKey) || item.id}</h3>
        <p>${t(item.descKey) || ""}</p>
      `;
      grid.appendChild(card);
    });
  };

  // Re-render on language change
  const renderAll = () => {
    renderPreview();
    renderAiGrid();
  };

  if (window.i18n?.ready) {
    window.i18n.ready.then(renderAll);
  } else {
    renderAll();
  }

  window.addEventListener("i18n:updated", renderAll);
})();
