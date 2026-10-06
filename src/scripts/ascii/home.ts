// home.ts — home-page ASCII layer (ref §7.2 intro choreography + §8.3
// rain-hatch monogram + bloom). Mounted by src/pages/index.astro on '/'.
//
// Choreography (motion allowed): fonts ready -> renderer starts, rain falls
// from frame 1 (density 0.2/col); the h1/pitch strings are drawn INSIDE the
// grid on their DOM rows with the §7.2 diagonal glitch reveal; when the last
// char settles (+0.33s) the CTA runs Task 6's text wave; D+900ms later
// intro-pending lifts and the sidebar cascades (items i×60ms, icon glitch
// =~-~=, current item's green bg fades back 300ms linear). ≤700px skips the
// nav cascade (the mobile Menu button gets the wave instead).
// Reduced motion: renderer runs WITHOUT introReveal — DOM headings stay
// visible, nothing is hidden, no wave, no cascade; rain + logo still run.

import { AsciiRenderer, type AsciiCtx, type AsciiProgram } from './renderer';
import { makeRain, type Rain, type RainDrop } from './rain';
import type { AsciiSurface } from './surface';
import {
  LOGO_COLOR,
  PAINTED_COLOR,
  LogoHatch,
  bloomColor,
  faceChar,
  maskFromAlpha,
  newDropExt,
  rasterGlyph,
} from './logo-mask';
import type { LogoMask, LogoDropExt } from './logo-mask';
import { SEQ, SLOT, runTextWave } from '../text-wave';

const FONT_STACK = '"Iosevka Term NF", monospace';
const RAIN_DENSITY = 0.2; // ref §7.2.1
const HEAD_SWEEP = 0.5; // s — §7.2.2 diagonal sweep
const GLITCH_T = 0.33; // s — §7.2.2 glitch span / re-trigger guard
const GLITCH_SLOT = 0.067; // s — §7.2.2 slot
// §7.2.2 source glyphs (13 distinct; the ref's "%14" names no 14th glyph)
const GLITCH_GLYPHS = ['!', '@', '#', '$', '%', '&', '*', '?', '~', '<', '>', '|', '/'];
const CASC_ITEM = 60; // ms — sidebar item stagger (§7.2.4)
const CASC_SWEEP = 500; // ms — wave sweep within one item
const WAVE_PAD = 900; // ms — D + 500 + 200 + 200 (§7.2.4)
const USER_SPEED_MAX = 30; // pointer drops: 30 + rand×30 rows/s (§8.2)
const CASCADABLE = '.cwd, .nav-item, button[data-summary]';

export interface HomeOptions {
  container: HTMLElement; // .ascii-container (renderer host)
  content: HTMLElement; // .content-lines — heading lookup + CTA wave root
  pointerTarget?: HTMLElement; // main (container/overlay are pointer-events:none)
}

interface CharRec {
  ch: string;
  revealAt: number; // s from intro t0 (§7.2.2)
  glitchFrom: number; // re-trigger base (Infinity until hit)
  lastHit: number; // -Infinity until first re-trigger
}
interface Heading {
  el: HTMLElement;
  color: string;
  row: number;
  x0: number;
  chars: CharRec[];
}

interface PreppedItem {
  root: HTMLElement;
  chars: { el: HTMLSpanElement; ch: string; delay: number; done: boolean }[];
  icon: HTMLElement | null; // element carrying the --nav-icon pseudo
  iconVar: string;
  isCurrent: boolean;
  bgDone: boolean;
  recs: { parent: Node; text: string; inserted: Node[] }[];
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)));
}

/** Split an element's text into opacity-0 char spans (mirrors text-wave's
    approach; restored via text-node reinsertion + normalize). */
function splitChars(root: HTMLElement): PreppedItem {
  const recs: PreppedItem['recs'] = [];
  const chars: PreppedItem['chars'] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent instanceof HTMLScriptElement || parent instanceof HTMLStyleElement)
        return NodeFilter.FILTER_REJECT;
      return (node.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const tn of nodes) {
    const text = tn.textContent ?? '';
    const parent = tn.parentElement!;
    const frag = document.createDocumentFragment();
    for (const tok of text.match(/\S+|\s+/g) ?? []) {
      if (/^\s+$/.test(tok)) {
        frag.appendChild(document.createTextNode(tok));
        continue;
      }
      for (const ch of tok) {
        const el = document.createElement('span');
        el.style.opacity = '0';
        el.textContent = ch;
        chars.push({ el, ch, delay: 0, done: false });
        frag.appendChild(el);
      }
    }
    const inserted = Array.from(frag.childNodes);
    parent.replaceChild(frag, tn);
    recs.push({ parent, text, inserted });
  }
  const n = chars.length;
  chars.forEach((c, i) => {
    // single-line items: the §7.3 diagonal degenerates to a left→right sweep
    c.delay = (n > 1 ? (i / (n - 1)) * CASC_SWEEP : 0) + i * 0.05;
  });
  const iconEl = root.matches('.nav-item, [data-summary]') ? root : null;
  const item: PreppedItem = {
    root,
    chars,
    icon: iconEl,
    iconVar: iconEl ? iconEl.style.getPropertyValue('--nav-icon') : '',
    isCurrent: root.classList.contains('is-current'),
    bgDone: false,
    recs,
  };
  if (item.isCurrent) {
    // §7.2.4: current item's green bg goes transparent, fades back as its
    // text arrives (this runs while intro-pending still hides the sidebar).
    root.style.backgroundColor = 'transparent';
  }
  return item;
}

/** Restore an item's original DOM + icon var + bg. */
function restoreItem(item: PreppedItem): void {
  if (item.icon) item.icon.style.setProperty('--nav-icon', item.iconVar || '');
  for (const rec of item.recs) {
    rec.parent.insertBefore(document.createTextNode(rec.text), rec.inserted[0] ?? null);
    for (const node of rec.inserted) node.parentNode?.removeChild(node);
  }
  item.root.normalize();
  if (item.isCurrent) {
    item.root.style.removeProperty('transition');
    item.root.style.removeProperty('background-color');
  }
}

export async function startHome(opts: HomeOptions): Promise<void> {
  const { container, content } = opts;
  const html = document.documentElement;
  const pointerTarget =
    opts.pointerTarget ?? document.getElementById('main-content') ?? container;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) await document.fonts.ready; // t=0 gates the intro (§7.2.1)

  // ---- program state ---------------------------------------------------------
  let cellW = 7;
  let lineH = 19;
  let cols = 1;
  let rows = 1;
  let headings: Heading[] = [];
  let mask: LogoMask | null = null;
  let hatch: LogoHatch | null = null;
  let completedOnce = false;
  let trophyFired = false;
  let revealAll = false;
  let t0Sec = 0; // intro t=0 (set when the renderer starts, §7.2.1)
  let lastFilledCount = 0; // stall detector for the hatch sweep
  let lastFillT = 0;
  const exts = new WeakMap<RainDrop, LogoDropExt & { user?: boolean }>();

  const inMask = (x: number, y: number): boolean =>
    !!mask && x >= 0 && y >= 0 && x < cols && y < rows && mask.cells[y * cols + x] === 1;

  function onLogoComplete(): void {
    completedOnce = true;
    if (!trophyFired) {
      trophyFired = true;
      // Trophy system lands in Task 9 — guarded dynamic import (§8.3.4).
      // (Variable specifier + @vite-ignore: the module may not exist yet; the
      // runtime miss is caught here. T9 swaps in the real ../trophies.)
      import(/* @vite-ignore */ '../trophies')
        .then((m) => (m as { unlock?: (id: string) => void }).unlock?.('complete-the-mark'))
        .catch(() => {});
    }
  }

  function rebuild(ctx: AsciiCtx): void {
    cols = ctx.cols;
    rows = ctx.rows;
    cellW = ctx.metrics.cellW;
    lineH = ctx.metrics.lineH;
    const logoScale = window.innerWidth <= 700 ? 0.9 : 0.5; // §8.3.1
    // mark, headings and CTA share one centre axis (the content column, not
    // the raw overlay which includes the line-number gutter)
    const baseRect = container.getBoundingClientRect();
    const cRect = content.getBoundingClientRect();
    const centreX = Math.min(
      1,
      Math.max(0, (cRect.left + cRect.width / 2 - baseRect.left) / Math.max(1, baseRect.width)),
    );
    const raster = rasterGlyph({ cols, rows, cellW, lineH, logoScale, font: FONT_STACK, centreX });
    mask = maskFromAlpha(raster, { cols, rows, aspect: ctx.metrics.aspect, lineH });
    hatch = new LogoHatch(mask, { onComplete: onLogoComplete });
    if (completedOnce) {
      // keep the bloom steady across a resize — pre-fill the re-hatched mask
      for (let i = 0; i < mask.cells.length; i++) {
        if (mask.cells[i]) hatch.fillCell(i % cols, Math.floor(i / cols), 2);
      }
    }
    headings = computeHeadings();
  }

  /** In-grid headings drawn over their DOM lines (ref §8.3.5). */
  function computeHeadings(): Heading[] {
    const base = container.getBoundingClientRect();
    const out: Heading[] = [];
    for (const el of content.querySelectorAll<HTMLElement>('[data-ascii-head]')) {
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const r = el.getBoundingClientRect();
      const row = Math.max(0, Math.floor((r.bottom - base.top) / lineH) - 1);
      // the DOM line is centred on the content column — draw the grid string
      // on that same axis (ref §8.3.5: centred on the overlay's content)
      const n = text.length;
      const x0 = Math.round((r.left + r.width / 2 - base.left) / cellW - n / 2);
      out.push({
        el,
        color: el.tagName === 'H1' ? 'var(--color-text)' : 'var(--color-subtext0)',
        row,
        x0,
        chars: Array.from(text, (ch, i) => ({
          ch,
          revealAt: clamp01((i / (n - 1) + row / Math.max(1, rows - 1)) / 2) * HEAD_SWEEP, // §7.2.2
          glitchFrom: Infinity,
          lastHit: -Infinity,
        })),
      });
    }
    return out;
  }

  function paintHeadings(surface: AsciiSurface, t: number): void {
    if (!headings.length) return;
    const base = container.getBoundingClientRect();
    for (const h of headings) {
      // DOM rects can shift after centering inserts spacers — track them.
      const r = h.el.getBoundingClientRect();
      const row = Math.max(0, Math.floor((r.bottom - base.top) / lineH) - 1);
      if (row !== h.row) h.row = row;
      const x0 = Math.round((r.left + r.width / 2 - base.left) / cellW - h.chars.length / 2);
      if (x0 !== h.x0) h.x0 = x0;
      for (let i = 0; i < h.chars.length; i++) {
        const c = h.chars[i];
        let out = '';
        const revealing = t >= c.revealAt && t < c.revealAt + GLITCH_T;
        const rehit = c.glitchFrom !== Infinity && t >= c.glitchFrom && t < c.glitchFrom + GLITCH_T;
        if (revealAll || t >= c.revealAt) {
          if (!revealAll && (revealing || rehit)) {
            const base0 = rehit ? c.glitchFrom : c.revealAt;
            out = GLITCH_GLYPHS[(Math.floor((t - base0) / GLITCH_SLOT) + i) % GLITCH_GLYPHS.length];
          } else {
            out = c.ch;
          }
        }
        surface.set(h.x0 + i, h.row, out, h.color);
      }
    }
  }

  const rain: Rain = makeRain({
    density: RAIN_DENSITY,
    minLen: 2,
    maxLen: 4,
    minSpeed: 30,
    maxSpeed: 75,
    color: 'var(--color-overlay2)',
    bg: 'var(--color-surface0)',
    getDrift: (d) => {
      const e = getExt(d);
      if (!e) return 0;
      const head = Math.floor(d.y);
      if (!e.inLogo) {
        e.lastRow = head; // descent tracking until the first in-mask crossing
        return 0;
      }
      if (!e.dragged) {
        e.origSpeed = d.speed; // 30–70% speed inside the logo (§8.3.2)
        d.speed = e.origSpeed * e.drag;
        e.dragged = true;
      }
      hatch?.rollTurn(e, d.x, head); // 30% per new mask row (pre-draw: the
      // erase already ran at the current x, so the sideways step stays aligned)
      if (e.drift === 0) return 0;
      // Keep the hatching drop ON the mark's ink: a drift step that would
      // walk the head off the mask (out of the bbox or off a stroke onto
      // blank space) holds the column this frame and reflects for later
      // frames. Without this the walk can't descend narrow strokes to their
      // end cells, the mask's edge columns starve and completion never fires.
      const nx = d.x + e.drift;
      if (
        mask &&
        (nx < mask.bbox.x0 ||
          nx > mask.bbox.x1 ||
          !inMask(nx, head))
      ) {
        e.drift = -e.drift;
        return 0;
      }
      return e.drift;
    },
  });

  function getExt(drop: RainDrop): (LogoDropExt & { user?: boolean }) | undefined {
    let e = exts.get(drop);
    if (!e) {
      e = newDropExt() as LogoDropExt & { user?: boolean };
      exts.set(drop, e);
    }
    return e;
  }

  const program: AsciiProgram = {
    init(ctx) {
      rebuild(ctx);
    },
    update(surface, ctx) {
      const metricsChanged =
        cellW !== ctx.metrics.cellW || lineH !== ctx.metrics.lineH;
      if (!mask || cols !== ctx.cols || rows !== ctx.rows || metricsChanged) rebuild(ctx);
      rain.update(surface, ctx);
      const t = ctx.time - t0Sec; // intro-relative time (§7.2)
      // Drop passes: hatch fill + user repaint (§8.3.2/§8.2), and re-glitch
      // of settled heading chars (§8.3.5).
      for (const d of rain.drops) {
        const e = getExt(d)!;
        const head = Math.floor(d.y);
        for (let k = 0; k < d.length; k++) {
          const y = head - k;
          const x = d.x;
          if (y < 0 || y >= rows || x < 0 || x >= cols) continue;
          if (inMask(x, y)) {
            e.maskSeen = ctx.frame;
            hatch?.enterCell(x, y, e);
            if (e.user) hatch?.paintCell(x, y);
          } else {
            for (const h of headings) {
              if (y !== h.row || x < h.x0 || x >= h.x0 + h.chars.length) continue;
              const c = h.chars[x - h.x0];
              if (t >= c.revealAt + GLITCH_T && t - c.lastHit >= GLITCH_T) {
                c.lastHit = t;
                c.glitchFrom = t;
              }
            }
          }
        }
      }
      // §8.3.4 deviation (documented in task-8-report): the stochastic hatch
      // walk (drag + 30%/row drift turns) can starve a stroke's edge-fringe
      // cells for minutes, so completion never fires. When the hatch stalls
      // (>85% filled, no fill for 0.5s), sweep the remainder one cell/frame —
      // reads as a few tiny hatch ticks completing the mark.
      if (hatch && mask && !hatch.complete) {
        if (hatch.filled !== lastFilledCount) {
          lastFilledCount = hatch.filled;
          lastFillT = t;
        } else if (t - lastFillT > 0.5 && hatch.filled >= mask.count * 0.85) {
          for (let i = 0; i < mask.cells.length; i++) {
            if (mask.cells[i] && !hatch.face[i]) {
              hatch.fillCell(i % cols, Math.floor(i / cols), 2);
              break;
            }
          }
        }
      }
      // Drops that left the logo straighten out and regain speed (§8.3.2).
      for (const d of rain.drops) {
        const e = exts.get(d);
        if (!e || e.maskSeen === ctx.frame) continue;
        if (e.inLogo) {
          e.inLogo = false;
          e.drift = 0;
          e.lastRow = -1; // allow the next entry from any row to fill again
          if (e.dragged) {
            d.speed = e.origSpeed;
            e.dragged = false;
          }
        }
      }
      // Face cells are permanent while hatching; bloom recolours by ring
      // (ref §8.3.3/4).
      if (hatch && mask && mask.count > 0) {
        for (let i = 0; i < hatch.face.length; i++) {
          const v = hatch.face[i];
          if (!v) continue;
          const color = completedOnce
            ? bloomColor(mask.ring[i], t)
            : hatch.painted[i]
              ? PAINTED_COLOR
              : LOGO_COLOR;
          surface.set(i % cols, Math.floor(i / cols), faceChar(v), color);
        }
      }
      if (!reduced) paintHeadings(surface, t);
    },
  };

  const renderer = new AsciiRenderer(container, program);
  renderer.start({ pointerTarget });
  t0Sec = performance.now() / 1000; // intro t = 0 (ref §7.2.1)
  const t0 = performance.now();

  // Pointer rain (§8.2): >=10ms apart on pointermove, also click; these drops
  // repaint face cells green.
  let lastSpawn = 0;
  const spawnAt = (e: PointerEvent): void => {
    const now = performance.now();
    if (now - lastSpawn < 10) return;
    lastSpawn = now;
    const rect = container.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellW);
    const y = Math.floor((e.clientY - rect.top) / lineH);
    if (x < 0 || x >= cols || y < 0 || y >= rows) return;
    rain.spawn(x, y, { speed: 30 + Math.random() * USER_SPEED_MAX });
    getExt(rain.drops[rain.drops.length - 1]!)!.user = true;
  };
  pointerTarget.addEventListener('pointermove', spawnAt);
  pointerTarget.addEventListener('click', spawnAt);

  if (reduced) return; // §14: static headings, all visible, no intro

  function forceReveal(): void {
    revealAll = true;
    for (const el of content.querySelectorAll<HTMLElement>('[data-ascii-head]')) {
      el.style.removeProperty('color');
      el.style.removeProperty('user-select');
    }
    html.classList.remove('intro-pending', 'wave-pending');
    content.style.removeProperty('opacity');
  }

  // ---- intro choreography (§7.2, motion allowed) -----------------------------
  let liveItems: PreppedItem[] = [];
  try {
    // The ASCII layer owns the heading lines: DOM goes transparent but stays
    // in the a11y tree (§8.3.5 / §14).
    for (const h of headings) {
      h.el.style.color = 'transparent';
      h.el.style.userSelect = 'none';
    }

    // 2→3: the CTA is held (inline opacity 0, set by index.astro) until the
    // heading reveal completes 0.33s after the last char (§7.2.2).
    const lastReveal = headings.reduce(
      (m, h) => Math.max(m, ...h.chars.map((c) => c.revealAt)),
      0,
    );
    await wait((lastReveal + GLITCH_T) * 1000 - (performance.now() - t0));

    // 3. text wave on the visible CTA (Task 6): the CTA row's server-side
    // data-text-wave="skip" (which keeps PageLayout's generic wave from
    // playing it early) is lifted here — it is waved by the home intro now.
    const cta = content.querySelector<HTMLElement>('.cta-row');
    if (cta) cta.removeAttribute('data-text-wave');
    const waveStart = performance.now();
    const D = await runTextWave(content);
    // 4. D + 500 + 200 + 200ms from the wave's start (§7.2.4)
    await wait(D + WAVE_PAD - (performance.now() - waveStart));

    // sidebar cascade: chars pre-split while the sidebar is still hidden
    liveItems = [];
    const sidebar = document.querySelector('.sidebar');
    if (sidebar instanceof HTMLElement && window.innerWidth > 700) {
      for (const el of sidebar.querySelectorAll<HTMLElement>(CASCADABLE)) {
        if (el.closest('tree-folder:not([open])')) continue; // inside closed folder
        if (!(el.textContent ?? '').trim()) continue;
        liveItems.push(splitChars(el));
      }
    }
    if (window.innerWidth <= 700) {
      // mobile: nav cascade skipped — the Menu button gets the wave (§7.2.4)
      const menuBtn = document.querySelector<HTMLElement>('.menu-button');
      if (menuBtn) liveItems.push(splitChars(menuBtn));
    }

    html.classList.remove('intro-pending');
    await drive(liveItems);
  } catch {
    forceReveal();
  } finally {
    for (const item of liveItems) restoreItem(item);
    html.classList.remove('intro-pending', 'wave-pending');
    content.style.removeProperty('opacity');
  }

  // ---- cascade driver (§7.2.4) ----------------------------------------------
  function drive(items: PreppedItem[]): Promise<void> {
    liveItems = items;
    return new Promise((resolve) => {
      if (!items.length) return resolve();
      const start = performance.now();
      const step = (now: number): void => {
        let pending = false;
        try {
          items.forEach((item, i) => {
            const base = i * CASC_ITEM;
            for (const c of item.chars) {
              if (c.done) continue;
              const p = now - start - base - c.delay;
              if (p < 0) {
                pending = true;
                continue;
              }
              const slot = Math.floor(p / SLOT);
              if (slot >= SEQ.length) {
                c.el.textContent = c.ch;
                c.el.style.opacity = '1';
                c.done = true;
              } else {
                c.el.style.opacity = '1';
                c.el.textContent = SEQ[slot];
                pending = true;
              }
            }
            // icon glitch =~-~= at the item's own start (§7.2.4, icons only)
            if (item.icon && item.iconVar) {
              const raw = Math.floor((now - start - base) / SLOT);
              if (raw >= 0 && raw < SEQ.length) {
                item.icon.style.setProperty('--nav-icon', `'"${SEQ[raw]}"'`);
                pending = true;
              } else if (item.icon.style.getPropertyValue('--nav-icon') !== item.iconVar) {
                item.icon.style.setProperty('--nav-icon', item.iconVar);
              }
            }
            // current item's green bg fades back 300ms linear as text arrives
            if (item.isCurrent && !item.bgDone && now - start >= base + 250) {
              item.root.style.transition = 'background-color 300ms linear';
              item.root.style.backgroundColor = '';
              item.bgDone = true;
            }
          });
        } catch {
          forceReveal();
        }
        if (pending) {
          requestAnimationFrame(step);
        } else {
          resolve();
          // let the current item's 300ms bg fade finish before clearing inlines
          setTimeout(() => {
            for (const it of items) {
              if (it.icon) it.icon.style.setProperty('--nav-icon', it.iconVar || '');
              if (it.isCurrent) {
                it.root.style.removeProperty('transition');
                it.root.style.removeProperty('background-color');
              }
            }
          }, 400);
        }
      };
      requestAnimationFrame(step);
    });
  }
}