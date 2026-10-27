// Tiny confetti burst. Call window.confetti() to fire.
(function () {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  const colors = ["#ee6f9b", "#f8c9d4", "#dcc7a8", "#c93d72", "#fbf5ec", "#8aa678"];
  let pieces = [];
  let running = false;

  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener("resize", resize);
  resize();

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.vy += 0.12; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    pieces = pieces.filter((p) => p.y < canvas.height + 20);
    if (pieces.length) requestAnimationFrame(tick);
    else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  window.confetti = function (count = 160) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: canvas.width / 2, y: canvas.height * 0.6,
        vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 14 - 4,
        size: 8 + Math.random() * 8, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    if (!running) { running = true; tick(); }
  };
})();
