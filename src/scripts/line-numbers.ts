// line-numbers.ts — vim-style line-number gutter.
// Rows = round(max(contentHeight, viewportRemaining) / lineHeight).
// Rows 1..contentRows show their index; the rest show '~' (vim empty-line
// marker). If the content comes within 2 lines of filling the viewport, two
// lines of padding-bottom are added to .content-lines so the '~' filler is
// always visible. Recomputed (rAF-throttled) on ResizeObserver(.content-lines),
// window resize and document.fonts.ready. Hidden by CSS at <= 50rem.

const LINE_HEIGHT_FALLBACK = 19;

export function buildGutter(root: ParentNode = document): void {
  const gutter = root.querySelector<HTMLElement>('.line-numbers');
  const lines = root.querySelector<HTMLElement>('.content-lines');
  if (!gutter || !lines) return;

  let raf = 0;
  const recompute = () => {
    raf = 0;
    const lh = parseFloat(getComputedStyle(lines).lineHeight) || LINE_HEIGHT_FALLBACK;
    lines.style.paddingBottom = '';
    const rect = lines.getBoundingClientRect();
    const contentRows = Math.max(1, Math.round(rect.height / lh));
    const viewportRows = Math.round(
      (window.innerHeight - Math.max(rect.top, 0)) / lh,
    );
    let rows = Math.max(contentRows, viewportRows);
    if (rows - contentRows < 2) {
      rows = contentRows + 2;
      lines.style.paddingBottom = `${2 * lh}px`;
    }

    const frag = document.createDocumentFragment();
    for (let i = 1; i <= rows; i++) {
      const div = document.createElement('div');
      div.textContent = i <= contentRows ? String(i) : '~';
      frag.appendChild(div);
    }
    gutter.replaceChildren(frag);
  };

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(recompute);
  };

  new ResizeObserver(schedule).observe(lines);
  window.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  recompute();
}

buildGutter();
