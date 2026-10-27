// The NO button that can't be pressed.
// window.setupDodge(button, { getTaunt(n), onSurrender() })
(function () {
  window.setupDodge = function (btn, opts) {
    const cfg = window.WEDDING_CONFIG;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dodges = 0;
    let surrendered = false;
    let glideTimer;
    let gliding = false; // while true, hovering doesn't re-target, so the glide isn't restarted every mouse move

    if (reduced) {
      // Calm version: the button simply refuses to be pressed.
      btn.classList.add("is-on-strike");
      btn.setAttribute("aria-disabled", "true");
      btn.addEventListener("click", (e) => e.preventDefault());
      return { refreshLabel() { btn.textContent = opts.getTaunt(-1); }, reset() {} };
    }

    function flee(fromX, fromY) {
      dodges++;
      btn.textContent = opts.getTaunt(dodges);
      const scale = Math.max(0.55, 1 - dodges * 0.05);
      if (!btn.classList.contains("is-fleeing")) {
        // Start the glide from where the button currently sits, not from the page corner.
        const r = btn.getBoundingClientRect();
        btn.style.left = r.left + "px";
        btn.style.top = r.top + "px";
        btn.classList.add("is-fleeing");
        btn.getBoundingClientRect(); // commit the start position before the new one is set
      }
      btn.style.transform = "scale(" + scale + ")";

      const w = btn.offsetWidth, h = btn.offsetHeight, pad = 12;
      const maxX = innerWidth - w - pad, maxY = innerHeight - h - pad;
      let x, y, tries = 0;
      // Pick a random spot that's far from where the pointer is.
      do {
        x = pad + Math.random() * Math.max(maxX - pad, 0);
        y = pad + Math.random() * Math.max(maxY - pad, 0);
        tries++;
      } while (tries < 25 && Math.hypot(x + w / 2 - fromX, y + h / 2 - fromY) < 220);
      gliding = true;
      clearTimeout(glideTimer);
      glideTimer = setTimeout(() => { gliding = false; }, 2000); // fallback if no transitionend fires
      btn.style.left = x + "px";
      btn.style.top = y + "px";

      if (dodges >= cfg.noDodgesBeforeSurrender && !surrendered) {
        surrendered = true;
        opts.onSurrender();
      }
    }

    function center() {
      const r = btn.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    }

    // Mouse: flee when the pointer gets close.
    document.addEventListener("pointermove", (e) => {
      if (gliding || e.pointerType === "touch" || !btn.getClientRects().length) return;
      const [cx, cy] = center();
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < cfg.noFleeDistance) flee(e.clientX, e.clientY);
    });
    btn.addEventListener("transitionend", (e) => { if (e.propertyName === "left" || e.propertyName === "top") gliding = false; });
    // Touch: flee the moment a finger lands.
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); flee(e.clientX, e.clientY); });
    // Keyboard: focusing or activating also makes it flee.
    btn.addEventListener("focus", () => { const [cx, cy] = center(); flee(cx, cy); btn.blur(); });
    btn.addEventListener("click", (e) => { e.preventDefault(); const [cx, cy] = center(); flee(cx, cy); });

    return {
      refreshLabel() {},
      reset() {
        dodges = 0; surrendered = false; gliding = false;
        btn.classList.remove("is-fleeing");
        btn.style.cssText = "";
      }
    };
  };
})();
