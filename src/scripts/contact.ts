// contact.ts — Task 10 wiring (ref §11). The renderer mounts inside
// .ascii-container; .content-page is the pointer target (the container and
// its overlay are pointer-events:none — T7 re-review note). Under reduced
// motion nothing starts at all. The flock arms 950 ms after that page's text
// wave has finished (wave-pending is removed once runTextWave resolves in
// PageLayout — poll for its absence, the T9 toast-waiting rAF pattern — which
// is the exact "950 ms + waveDelay" contract; the 950 ms is delay-only since
// the wave delay itself is already paid).

import { AsciiRenderer, type AsciiProgram } from './ascii/renderer';
import { makeBoids } from './ascii/boids';
import type { AsciiCtx } from './ascii/renderer';

const SCRAMBLE_TTL = 330; // ms — 0.33 s, ref §11
const START_DELAY = 950; // ms after the wave finishes
const SCRAMBLE_SYMBOLS = ['!', '@', '#', '$', '%', '&', '*', '?', '~', '<', '>', '|', '/'];

interface LabelChar {
  el: HTMLElement;
  real: string;
  cells: [number, number][]; // surface cells the char covers
}

interface PendingChar {
  real: string;
  until: number;
}

export function initContact(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // never starts
  const host = document.querySelector<HTMLElement>('.ascii-container');
  const pane = document.querySelector<HTMLElement>('.content-page');
  const anchorEl = document.querySelector<HTMLElement>('a[data-boid-anchor]');
  if (!host || !pane || !anchorEl) return;

  // 48 boids desktop, 24 at ≤700px (ref §11).
  const count = window.innerWidth <= 700 ? 24 : 48;
  const flock = makeBoids({ count, getAnchor, onTrailCell: scrambleAt });

  const labelChars: LabelChar[] = Array.from(
    anchorEl.querySelectorAll<HTMLElement>('.boid-char'),
  ).map((el) => ({ el, real: el.textContent ?? '', cells: [] }));
  let cellsStale = true;
  let metrics: AsciiCtx['metrics'] | null = null;

  // Called every frame: measure the anchor centre into surface cell coords.
  function getAnchor(ctx: AsciiCtx): { x: number; y: number } {
    metrics = ctx.metrics;
    const hostRect = host.getBoundingClientRect();
    const r = anchorEl.getBoundingClientRect();
    return {
      x: (r.left + r.width / 2 - hostRect.left) / ctx.metrics.cellW,
      y: (r.top + r.height / 2 - hostRect.top) / ctx.metrics.lineH,
    };
  }

  /** Char → cell ranges (relative to the container, which is where the grid
      starts). Rebuilt lazily after a trail event, on resize and font load. */
  function ensureCells(): void {
    if (!cellsStale || !metrics) return;
    cellsStale = false;
    const hostRect = host.getBoundingClientRect();
    for (const c of labelChars) {
      const r = c.el.getBoundingClientRect();
      const left = r.left - hostRect.left;
      const top = r.top - hostRect.top;
      const cells: [number, number][] = [];
      for (
        let x = Math.floor(left / metrics.cellW);
        x <= Math.ceil((left + r.width) / metrics.cellW) - 1;
        x++
      ) {
        for (
          let y = Math.floor(top / metrics.lineH);
          y <= Math.ceil((top + r.height) / metrics.lineH) - 1;
          y++
        ) {
          cells.push([x, y]);
        }
      }
      c.cells = cells;
    }
  }

  const pending = new Map<HTMLElement, PendingChar>();
  let raf = 0;
  let rngSeq = 0x1234;

  const rng = (): number => {
    rngSeq = (rngSeq * 1103515245 + 12345) & 0x7fffffff;
    return rngSeq / 0x7fffffff;
  };

  function scrambleAt(x: number, y: number): void {
    ensureCells();
    for (const c of labelChars) {
      if (pending.has(c.el)) continue;
      if (c.cells.some(([ix, iy]) => ix === x && iy === y)) {
        c.el.textContent = SCRAMBLE_SYMBOLS[Math.floor(rng() * SCRAMBLE_SYMBOLS.length)];
        pending.set(c.el, { real: c.real, until: performance.now() + SCRAMBLE_TTL });
        if (!raf) raf = requestAnimationFrame(restoreTick);
      }
    }
  }

  const restoreTick = (now: number): void => {
    for (const [el, rec] of pending) {
      if (now >= rec.until) {
        el.textContent = rec.real;
        pending.delete(el);
      }
    }
    raf = pending.size ? requestAnimationFrame(restoreTick) : 0;
  };

  window.addEventListener('resize', () => (cellsStale = true));
  document.fonts?.ready?.then(() => (cellsStale = true));

  // Gather while the CTA is hovered; leave reverts to the idle flock.
  anchorEl.addEventListener('pointerenter', () => (flock.gather = true));
  anchorEl.addEventListener('pointerleave', () => (flock.gather = false));

  function start(): void {
    const program: AsciiProgram = {
      update(surface, ctx) {
        flock.pointer = ctx.cursor;
        flock.update(surface, ctx);
      },
    };
    new AsciiRenderer(host, program).start({ pointerTarget: pane });
  }

  // Start 950 ms after the arrival wave; wave-pending is present until the
  // wave has fully played (removed in PageLayout's finally).
  const arm = () => setTimeout(start, START_DELAY);
  const html = document.documentElement;
  if (html.classList.contains('wave-pending')) {
    const poll = () =>
      html.classList.contains('wave-pending') ? requestAnimationFrame(poll) : arm();
    poll();
  } else {
    arm();
  }
}