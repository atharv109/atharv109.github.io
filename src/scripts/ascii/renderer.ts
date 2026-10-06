// renderer.ts — mounts an AsciiSurface behind/inside a host element as a
// <pre class="ascii-overlay"> of per-row <span class="ascii-row"> lines, and
// drives an AsciiProgram per animation frame. Perf model per ref §8.1: only
// dirty rows are re-serialized; only changed runs touch the DOM; colour
// pairings become lazily generated classes on an adopted stylesheet.

import { AsciiSurface } from './surface';
import type { Run } from './surface';

export interface AsciiCtx {
  frame: number;
  time: number;
  delta: number;
  cols: number;
  rows: number;
  metrics: { cellW: number; lineH: number; aspect: number };
  cursor: { x: number; y: number } | null;
}

export interface AsciiProgram {
  init?(ctx: AsciiCtx): void;
  update(surface: AsciiSurface, ctx: AsciiCtx): void;
}

export class AsciiRenderer {
  readonly surface: AsciiSurface;
  private host: HTMLElement;
  private program: AsciiProgram;
  private overlay!: HTMLPreElement;
  private rowEls: HTMLSpanElement[] = [];
  private prevRuns: Run[][] = [];
  private sheet!: CSSStyleSheet;
  private classCache = new Map<string, string>();
  private classSeq = 0;
  private raf = 0;
  private last = 0;
  private frame = 0;
  private fpsCap = 0;
  private running = false;
  private cursor: { x: number; y: number } | null = null;
  private metrics = { cellW: 7, lineH: 19, aspect: 7 / 19 };

  constructor(host: HTMLElement, program: AsciiProgram) {
    this.host = host;
    this.program = program;
    this.surface = new AsciiSurface(1, 1);
  }

  /** Measure the host's computed font with a hidden 5x20 'X' probe (ref §8.1:
      in the TARGET's computed font — a bare <pre> measures the UA's default
      mono (Consolas 7.6977px), which skews every surface-coordinate draw). */
  private measure(): void {
    const probe = document.createElement('pre');
    probe.setAttribute('aria-hidden', 'true');
    const hc = getComputedStyle(this.host);
    probe.style.cssText =
      'position:absolute;visibility:hidden;margin:0;padding:0;white-space:pre;';
    probe.style.fontFamily = hc.fontFamily;
    probe.style.fontSize = hc.fontSize;
    probe.style.lineHeight = hc.lineHeight;
    probe.textContent = Array.from({ length: 5 }, () => 'X'.repeat(20)).join('\n');
    this.host.appendChild(probe);
    const box = probe.getBoundingClientRect();
    const cellW = box.width / 20 || 7;
    const lineH = box.height / 5 || 19;
    probe.remove();
    this.metrics = { cellW, lineH, aspect: cellW / lineH };
  }

  private rebuildGrid(): void {
    this.measure();
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    this.surface.resize(
      Math.max(1, Math.floor(w / this.metrics.cellW)),
      Math.max(1, Math.floor(h / this.metrics.lineH)),
    );
    this.overlay.textContent = '';
    this.rowEls = [];
    this.prevRuns = [];
    for (let y = 0; y < this.surface.rows; y++) {
      const row = document.createElement('span');
      row.className = 'ascii-row';
      this.overlay.appendChild(row);
      this.rowEls.push(row);
      this.prevRuns.push([]);
    }
  }

  private classFor(color?: string, bg?: string): string {
    if (color === undefined && bg === undefined) return '';
    const key = `${color}|${bg}`;
    let name = this.classCache.get(key);
    if (!name) {
      name = `ascii-s${this.classSeq++}`;
      const rules = [color ? `color:${color}` : '', bg ? `background:${bg}` : '']
        .filter(Boolean)
        .join(';');
      this.sheet.insertRule(`.ascii-overlay .${name}{${rules}}`, this.sheet.cssRules.length);
      this.classCache.set(key, name);
    }
    return name;
  }

  private paintRow(y: number): void {
    const runs = this.surface.rowRuns(y);
    const prev = this.prevRuns[y];
    const row = this.rowEls[y];
    if (!row) return;
    // Reuse existing span children; only touch what changed.
    let child = row.firstElementChild as HTMLElement | null;
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const cls = this.classFor(run.color, run.bg);
      const text = run.text;
      const p = prev[i];
      if (p && p.text === text && p.color === run.color && p.bg === run.bg && child) {
        child = child.nextElementSibling as HTMLElement | null;
        continue;
      }
      if (!child) {
        const span = document.createElement('span');
        span.textContent = text;
        if (cls) span.className = cls;
        row.appendChild(span);
        child = null;
      } else {
        if (child.textContent !== text) child.textContent = text;
        if (child.className !== cls) child.className = cls;
        child = child.nextElementSibling as HTMLElement | null;
      }
    }
    while (child) {
      const next = child.nextElementSibling as HTMLElement | null;
      child.remove();
      child = next;
    }
    this.prevRuns[y] = runs;
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const rawDt = this.last ? (now - this.last) / 1000 : 1 / 60;
    const delta = Math.min(rawDt, Math.max(0.1, this.fpsCap > 0 ? 1 / this.fpsCap : 0.1));
    // `last` marks the last PAINTED frame: while skipping, deltas accumulate
    // until they cross the cap interval. (Updating it on skipped frames would
    // reset the delta to a single rAF tick — always below the cap — and freeze.)
    if (this.fpsCap > 0 && this.last && rawDt < 1 / this.fpsCap) {
      this.raf = requestAnimationFrame(this.tick);
      return;
    }
    this.last = now;
    const ctx: AsciiCtx = {
      frame: this.frame++,
      time: now / 1000,
      delta,
      cols: this.surface.cols,
      rows: this.surface.rows,
      metrics: this.metrics,
      cursor: this.cursor,
    };
    this.program.update(this.surface, ctx);
    for (const y of this.surface.dirtyRows()) this.paintRow(y);
    this.surface.flush();
    this.raf = requestAnimationFrame(this.tick);
  };

  private onVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
    } else if (this.running) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.tick);
    }
  };

  private cellFromEvent(e: PointerEvent): { x: number; y: number } {
    const rect = this.host.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / this.metrics.cellW),
      y: Math.floor((e.clientY - rect.top) / this.metrics.lineH),
    };
  }

  start(opts: { fps?: number; pointerTarget?: HTMLElement } = {}): void {
    this.fpsCap = opts.fps ?? 0;
    this.sheet = new CSSStyleSheet();
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.sheet];

    this.overlay = document.createElement('pre');
    this.overlay.className = 'ascii-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');
    this.host.appendChild(this.overlay);
    this.rebuildGrid();
    new ResizeObserver(() => this.rebuildGrid()).observe(this.host);
    document.fonts?.ready?.then(() => this.rebuildGrid());
    // fonts.ready may resolve before the webfont's load begins — pin the face
    // so a post-ready load still re-measures (stale metrics skew every draw).
    document.fonts
      ?.load?.('1rem "Iosevka Term NF", monospace')
      ?.then?.(() => this.rebuildGrid())
      ?.catch?.(() => {});

    const pointerTarget = opts.pointerTarget ?? this.host;
    pointerTarget.addEventListener('pointermove', (e) => (this.cursor = this.cellFromEvent(e)));
    document.addEventListener('pointerleave', () => (this.cursor = null));
    document.addEventListener('visibilitychange', this.onVisibility);

    this.running = true;
    this.program.init?.({
      frame: 0,
      time: 0,
      delta: 0,
      cols: this.surface.cols,
      rows: this.surface.rows,
      metrics: this.metrics,
      cursor: this.cursor,
    });
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }
}
