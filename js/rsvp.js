// RSVP flow: find guest -> YES / (unpressable) NO -> extras -> send.
(function () {
  const $ = (id) => document.getElementById(id);
  let guest = null;
  let attending = null;
  let dodger = null;

  function normalise(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  }
  function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // Every typed word must match (prefix or within 1-2 typos) a word of the guest's name.
  function findGuest(input) {
    const typed = normalise(input);
    if (!typed.length) return null;
    let best = null, bestScore = Infinity;
    App.guests.forEach((g) => {
      const words = normalise(g.name);
      let score = 0;
      for (const t of typed) {
        let w = Infinity;
        words.forEach((gw) => {
          if (gw.startsWith(t) && t.length >= 2) w = Math.min(w, 0);
          else w = Math.min(w, distance(t, gw) <= (t.length > 4 ? 2 : 1) ? distance(t, gw) : Infinity);
        });
        score += w;
      }
      if (score < bestScore) { bestScore = score; best = g; }
    });
    return bestScore < Infinity ? best : null;
  }

  // Remember who this is (and their answer) so a refresh doesn't start over.
  const KEY = "rsvp";
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(patch) { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(load(), patch))); } catch (e) {} }

  function showDone(yes) {
    $("name-form").hidden = true;
    $("answer-form").hidden = true;
    $("done").hidden = false;
    $("done-title").textContent = App.t(yes ? "rsvp.yesDone" : "rsvp.noDone");
    $("done-sub").textContent = App.t(yes ? "rsvp.yesDoneSub" : "rsvp.noDoneSub");
  }

  function showGreeting() {
    if (!guest) return;
    $("greeting").textContent = App.t("rsvp.greeting", { name: guest.name.split(" ")[0] });
    $("plusone-legend").textContent = guest.plusOne ? App.t("rsvp.plusOneLabel", { plusOne: guest.plusOne }) : "";
  }

  // The silly questions, one per screen.
  const mode = "steps";
  let step = 0;
  const answers = {};
  const quiz = () => App.t("rsvp.quiz");

  function showStep() {
    const n = quiz().length, steps = mode === "steps";
    [...$("quiz").children].forEach((fs, i) => (fs.hidden = steps && i !== step));
    $("details-step").hidden = steps && step < n;
    $("quiz-back").hidden = !steps || step === 0;
    $("quiz-progress").textContent = steps ? App.t("rsvp.quizProgress", { n: Math.min(step + 1, n + 1), total: n + 1 }) : "";
  }

  function renderQuiz() {
    const box = $("quiz");
    box.innerHTML = "";
    quiz().forEach((q) => {
      const fs = document.createElement("fieldset");
      fs.className = "quiz-q";
      const lg = document.createElement("legend");
      lg.textContent = q.q;
      const opts = document.createElement("div");
      opts.className = "opts";
      q.options.forEach((text, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "opt" + (answers[q.id] === i ? " is-selected" : "");
        b.style.setProperty("--i", i);
        b.textContent = text;
        b.setAttribute("aria-pressed", answers[q.id] === i);
        b.addEventListener("click", () => {
          answers[q.id] = i;
          const at = step;
          renderQuiz();
          if (i === q.failIndex) { showUhuh(); return; }
          if (mode === "steps") setTimeout(() => { if (step === at) { step++; showStep(); } }, 350);
        });
        opts.appendChild(b);
      });
      fs.append(lg, opts);
      box.appendChild(fs);
    });
    showStep();
  }

  // Picked white: you're out.
  function showUhuh() {
    $("uhuh").hidden = false;
    $("uhuh-retry").focus();
  }

  // Cinema mode: bars slide in, then the video plays widescreen.
  function showCinema() {
    const id = WEDDING_CONFIG.cinemaVideoId;
    if (!id) return;
    $("cinema-screen").innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&rel=0&modestbranding=1" title="Video" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>';
    $("cinema-title").textContent = App.t("rsvp.yesDone");
    $("cinema-sub").textContent = App.t("rsvp.yesDoneSub");
    $("cinema").hidden = false;
    $("cinema-close").focus();
  }
  function hideCinema() {
    $("cinema").hidden = true;
    $("cinema-screen").innerHTML = ""; // removing the iframe stops the video
  }

  function pickTaunt(n) {
    const list = App.t("rsvp.noTaunts");
    if (n < 0) return App.t("rsvp.noReducedMotion");
    return list[Math.min(n, list.length - 1)];
  }

  function startAnswerStep() {
    $("name-form").hidden = true;
    $("answer-form").hidden = false;
    $("plusone-field").hidden = !guest.plusOne;
    showGreeting();
    const btnNo = $("btn-no");
    btnNo.textContent = App.t("rsvp.no");
    dodger = setupDodge(btnNo, {
      getTaunt: pickTaunt,
      onSurrender() { $("btn-surrender").hidden = false; }
    });
    if (dodger.refreshLabel) dodger.refreshLabel();
    // Reduced motion: no dodging, so offer the real "no" right away.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) $("btn-surrender").hidden = false;
  }

  function finish(data) {
    save({ name: data.name, attending: data.attending });
    showDone(data.attending);
    if (data.attending) { window.confetti(220); showCinema(); }
  }

  async function submit() {
    const form = $("answer-form");
    const data = {
      timestamp: new Date().toISOString(),
      name: guest.name,
      attending: attending,
      plusOne: guest.plusOne ? (attending && form.plusOne.value === "yes" ? guest.plusOne : "") : "",
      diet: attending ? $("diet").value.trim() : "",
      song: attending ? $("song").value.trim() : "",
      note: $("note").value.trim(),
      lang: App.lang
    };
    // Always store the English answer text so the sheet reads the same for everyone.
    App.copy.en.rsvp.quiz.forEach((q) => {
      data[q.id] = attending && answers[q.id] !== undefined ? q.options[answers[q.id]] : "";
    });
    const url = WEDDING_CONFIG.sheetUrl;
    const sendBtn = $("send");
    $("answer-msg").textContent = "";
    sendBtn.textContent = App.t("rsvp.sending");
    try {
      if (url) {
        // text/plain avoids a CORS preflight, which Apps Script doesn't answer.
        await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(data) });
      } else {
        console.log("RSVP (no sheetUrl set, not sent):", data);
      }
      finish(data);
    } catch (err) {
      $("answer-msg").textContent = App.t("rsvp.errorSend");
    }
    sendBtn.textContent = App.t("rsvp.send");
  }

  function init() {
    $("name-form").addEventListener("submit", (e) => {
      e.preventDefault();
      guest = findGuest($("guest-name").value);
      if (!guest) { $("name-msg").textContent = App.t("rsvp.notFound"); return; }
      $("name-msg").textContent = "";
      save({ name: guest.name });
      startAnswerStep();
    });

    // "Change my answer": forget the answer, keep the name, go back to the question.
    $("btn-change").addEventListener("click", () => { save({ attending: null }); location.reload(); });

    const saved = load();
    const known = saved.name && App.guests.find((g) => g.name === saved.name);
    if (known) {
      guest = known;
      if (typeof saved.attending === "boolean") showDone(saved.attending);
      else startAnswerStep();
    }

    $("btn-yes").addEventListener("click", () => {
      attending = true;
      $("choices").hidden = true;
      document.querySelector(".rsvp__question").hidden = true;
      $("btn-surrender").hidden = true;
      $("extras").hidden = false;
      step = 0;
      renderQuiz();
      window.confetti(120);
    });

    $("uhuh-retry").addEventListener("click", () => {
      $("uhuh").hidden = true;
      delete answers.outfit;
      renderQuiz();
    });
    $("cinema-close").addEventListener("click", hideCinema);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("cinema").hidden) hideCinema(); });

    $("quiz-back").addEventListener("click", () => { step = Math.max(0, step - 1); showStep(); });

    $("btn-surrender").addEventListener("click", () => {
      attending = false;
      $("btn-no").hidden = true;
      $("choices").hidden = true;
      document.querySelector(".rsvp__question").hidden = true;
      $("btn-surrender").hidden = true;
      // Only the note and send button are relevant for a NO (.yes-only parts are hidden by CSS).
      $("extras").classList.add("is-no");
      $("details-step").hidden = false;
      $("extras").hidden = false;
    });

    $("answer-form").addEventListener("submit", (e) => { e.preventDefault(); if (attending !== null) submit(); });

    App.onLangChange(() => {
      showGreeting();
      if (!$("done").hidden) showDone(load().attending);
      if (attending && !$("extras").hidden) renderQuiz();
      if (!$("answer-form").hidden && !$("btn-no").classList.contains("is-fleeing") && dodger) $("btn-no").textContent = App.t("rsvp.no");
    });
  }

  if (window.App && App.copy) init();
  else document.addEventListener("app-ready", init);
})();
