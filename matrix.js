// Lightweight matrix / cyber rain animation for canvas background
const canvas = document.getElementById('matrix-bg');
if (canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const letters = "01ABCDEF".split('');
  const fontSize = Math.max(12, Math.floor(window.innerWidth / 140)); // scale font by width
  let columns = Math.floor(canvas.width / fontSize);
  let drops = new Array(columns).fill(1);

  function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ffff";
    ctx.font = fontSize + "px monospace";
    for (let i = 0; i < drops.length; i++) {
      const text = letters[Math.floor(Math.random() * letters.length)];
      const x = i * fontSize;
      ctx.fillText(text, x, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  // recalc columns when needed
  setInterval(() => {
    const newCols = Math.floor(canvas.width / fontSize) || 1;
    if (newCols !== columns) {
      columns = newCols;
      drops = new Array(columns).fill(1);
    }
    draw();
  }, 45);
}
