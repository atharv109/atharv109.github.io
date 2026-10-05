// matrix.ts — the terminal's matrix-rain overlay. Self-contained by design
// (coordinator ruling: no import of ascii/rain.ts — T7 and T11 share a wave).
// Canvas 2D, meadow palette, runs ~3.2s then cleans up.

export function runMatrixOverlay(host: HTMLElement, durationMs = 3200): () => void {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:50;pointer-events:none;';
  host.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return () => {};
  }

  const green = getComputedStyle(document.documentElement).getPropertyValue('--color-green').trim() || '#cbe3b3';
  const base = getComputedStyle(document.documentElement).getPropertyValue('--color-base').trim() || '#1c2225';

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const cols = Math.max(1, Math.floor(window.innerWidth / 14));
  const drops = new Array<number>(cols).fill(0);
  const chars = '01アイウエオカキクケコサシスセソ0123456789ATHARVSEC';

  // Pre-paint the base so the first trail fade has something to eat.
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  let raf = 0;
  const draw = () => {
    ctx.fillStyle = `${base}1f`; // ~12% fade per frame
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = green;
    ctx.font = '12px "Iosevka Term NF", ui-monospace, monospace';
    for (let i = 0; i < drops.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * 14, drops[i] * 16);
      if (drops[i] * 16 > window.innerHeight && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  const stop = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
  const timer = setTimeout(stop, durationMs);
  return () => {
    clearTimeout(timer);
    stop();
  };
}
