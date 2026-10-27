// Loads copy + guests, handles language toggle, countdown and the tulip rain.
(function () {
  const cfg = window.WEDDING_CONFIG;
  const App = (window.App = { copy: null, guests: [], lang: cfg.defaultLang, listeners: [] });

  // Look up "a.b.c" in the current language. {name}-style placeholders are filled from vars.
  App.t = function (key, vars) {
    let val = key.split(".").reduce((o, k) => (o ? o[k] : undefined), App.copy[App.lang]);
    if (typeof val === "string" && vars) {
      val = val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ""));
    }
    return val === undefined ? key : val;
  };
  App.onLangChange = (fn) => App.listeners.push(fn);

  function applyCopy() {
    document.documentElement.lang = App.lang;
    document.title = App.t("meta.title");
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = App.t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = App.t(el.dataset.i18nPlaceholder)));
    App.listeners.forEach((fn) => fn());
    updateCountdown();
  }

  function setLang(lang) {
    App.lang = lang;
    try { localStorage.setItem("lang", lang); } catch (e) {}
    applyCopy();
  }

  // Countdown
  const target = new Date(cfg.weddingDate).getTime();
  const pad = (n) => String(n).padStart(2, "0");
  function updateCountdown() {
    const grid = document.getElementById("countdown");
    const msg = document.getElementById("cd-message");
    const diff = target - Date.now();
    if (diff <= 0) {
      grid.hidden = true; msg.hidden = false;
      msg.textContent = App.t(diff > -86400000 ? "countdown.today" : "countdown.past");
      return;
    }
    grid.hidden = false; msg.hidden = true;
    const s = Math.floor(diff / 1000);
    document.getElementById("cd-days").textContent = Math.floor(s / 86400);
    document.getElementById("cd-hours").textContent = pad(Math.floor((s % 86400) / 3600));
    document.getElementById("cd-minutes").textContent = pad(Math.floor((s % 3600) / 60));
    document.getElementById("cd-seconds").textContent = pad(s % 60);
  }

  function tulipRain() {
    const box = document.querySelector(".tulips");
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("span");
      s.textContent = i % 3 ? "🌷" : "🌸";
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDuration = 14 + Math.random() * 16 + "s";
      s.style.animationDelay = -Math.random() * 25 + "s";
      box.appendChild(s);
    }
  }

  async function init() {
    const [copy, guests] = await Promise.all([
      fetch("content/copy.json").then((r) => r.json()),
      fetch("content/guests.json").then((r) => r.json())
    ]);
    App.copy = copy;
    App.guests = guests.guests;
    try { App.lang = localStorage.getItem("lang") || (navigator.language.startsWith("nl") ? "nl" : cfg.defaultLang); } catch (e) {}
    document.getElementById("lang-toggle").addEventListener("click", () => setLang(App.lang === "en" ? "nl" : "en"));
    tulipRain();
    applyCopy();
    setInterval(updateCountdown, 1000);
    document.dispatchEvent(new Event("app-ready"));
  }

  init();
})();
