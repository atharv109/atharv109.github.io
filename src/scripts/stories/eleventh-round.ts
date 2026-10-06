// stories/eleventh-round.ts — Eleventh Round's story scenes (Task 15). Each
// beat is a PURE draw of the whole frame from (surface, ctx, p, rng), so any
// seek reproduces the exact frame (engine contract, Task 14). Facts ONLY from
// committed data (eleventh-round.md + the Task 15 brief): athletes / managers
// / promoters as stakeholders with no single platform, role-specific
// dashboards, podcasts, apparel integration, careers · content · commerce,
// shipped as a paid Buildora client product, live site eleventh-rnd.com.
// Glyphs are in-font ASCII (see story-draw.ts) — pure cells, no box-drawing
// codepoints. Flicker slots are pure hash2 gating; positions advance linearly
// with p (no easing, per the stack locks).

import type { AsciiSurface } from '../ascii/surface';
import type { RngFactory, StoryBeat, StoryData } from '../ascii/story';
import {
  borderLabel,
  box,
  clamp01,
  hash2,
  str,
  strC,
} from '../ascii/story-draw';

const GREEN = 'var(--color-green)';
const YELLOW = 'var(--color-yellow)';
const BLUE = 'var(--color-blue)';
const STRUCT = 'var(--color-surface2)';
const DIM = 'var(--color-overlay1)';
const DIMMER = 'var(--color-overlay0)';
const TEXT = 'var(--color-subtext0)';
const PANE_BG = 'var(--color-surface1)';

interface Tribe {
  label: string;
  color: string;
  glyph: string;
}

const TRIBES: Tribe[] = [
  { label: 'ATHLETES', color: GREEN, glyph: 'A' },
  { label: 'MANAGERS', color: BLUE, glyph: 'M' },
  { label: 'PROMOTERS', color: YELLOW, glyph: 'P' },
];

const PW = 17; // tribe panel width
/** Tribe panel x0 at surface width W: scattered far left / middle / right. */
const tribeX = (k: number, W: number): number =>
  Math.max(0, Math.min(W - PW - 1, Math.round((k * (W - PW - 4)) / 2) + 1));

/** Beat 0 + 1 continuity: each tribe panel's centre column. */
const tribeCenter = (k: number, W: number): number => tribeX(k, W) + Math.floor(PW / 2);

/* Progressive rule draws — linear ramps on p, snapping '+' corners at 1. */
function hlineR(surface: AsciiSurface, x0: number, x1: number, y: number, color: string, g: number): void {
  const end = Math.round(x0 + (x1 - x0) * g);
  for (let x = x0; x <= end; x++) surface.set(x, y, '-', color);
  if (g >= 1) {
    surface.set(x0, y, '+', color);
    surface.set(x1, y, '+', color);
  }
}
function vlineR(surface: AsciiSurface, x: number, y0: number, y1: number, color: string, g: number): void {
  // Grow from one below the top border row (hlineR owns that row's corners)
  // toward the bottom corner row; '+' stamps only at completion.
  const from = y0 + 1;
  const to = y1 - 1;
  const end = Math.round(from + (to - from) * g);
  for (let y = from; y <= end; y++) surface.set(x, y, '|', color);
  if (g >= 1) surface.set(x, y1, '+', color);
}

/* ---- 1/5 · THREE TRIBES (3s): clusters fill in, separated, no platform ---- */
function threeTribes(): StoryBeat {
  const DUR = 3;
  const BOX_H = 7;
  const Y0 = 3;
  return {
    label: 'THREE TRIBES',
    caption: 'athletes · managers · promoters — no single platform',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      for (let k = 0; k < TRIBES.length; k++) {
        const x0 = tribeX(k, W);
        const fill = clamp01((p - k * 0.2) / 0.6); // panels build one after another
        if (fill <= 0) continue;
        box(surface, x0, Y0, PW, BOX_H, STRUCT);
        borderLabel(surface, x0 + 3, Y0, ` ${TRIBES[k].label} `, TRIBES[k].color, PANE_BG);
        // People dots scatter in with the box's own fill fraction (dense at 1).
        for (let y = Y0 + 2; y <= Y0 + BOX_H - 2; y++)
          for (let x = x0 + 2; x <= x0 + PW - 3; x++)
            if (hash2(x, y * 13 + k) / 0xffffffff <= fill) surface.set(x, y, 'o', DIM);
      }
      if (p > 0.55) strC(surface, Y0 + BOX_H + 2, 'no single platform between them', TEXT);
    },
  };
}

/* ---- 2/5 · THE RING (2.5s): one ring assembles; tribes converge to columns */
function theRing(): StoryBeat {
  const DUR = 2.5;
  const RW = 47;
  const RH = 9;
  const Y0 = 3;
  return {
    label: 'THE RING',
    caption: 'the ring assembles — one platform between them',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const w = Math.min(RW, W - 10);
      const x0 = Math.max(1, Math.floor((W - w) / 2));
      const yb = Y0 + RH; // bottom border row
      // The ring outlines itself in thirds: top edge → sides → bottom edge.
      hlineR(surface, x0, x0 + w - 1, Y0, STRUCT, clamp01(p / 0.3));
      if (p > 0.3) {
        strC(surface, Y0, ' the ring ', STRUCT, PANE_BG);
        const side = clamp01((p - 0.3) / 0.35);
        vlineR(surface, x0, Y0, yb, STRUCT, side);
        vlineR(surface, x0 + w - 1, Y0, yb, STRUCT, side);
      }
      if (p > 0.6) {
        for (let x = x0; x <= x0 + w - 1; x++) surface.set(x, yb, '-', STRUCT);
        surface.set(x0, yb, '+', STRUCT);
        surface.set(x0 + w - 1, yb, '+', STRUCT);
      }
      // Tribal heads converge linearly into three columns inside the ring.
      const conv = clamp01((p - 0.25) / 0.55);
      for (let k = 0; k < TRIBES.length; k++) {
        const finalX = Math.round(x0 + (w - 1) * ((k + 1) / 4));
        const fromX = tribeCenter(k, W);
        const x = Math.round(fromX + (finalX - fromX) * conv);
        if (conv < 1) {
          // Trail: dim dots back along the travelled path while converging.
          const dir = Math.sign(finalX - fromX);
          const span = Math.abs(x - fromX);
          for (let d = 1; d <= span; d++)
            surface.set(Math.round(fromX + dir * d), Y0 + 1, '.', DIMMER);
        }
        if (p > 0.15) surface.set(x, Y0 + 3, TRIBES[k].glyph, TRIBES[k].color);
        if (p > 0.72) {
          const label = TRIBES[k].label;
          str(surface, finalX - Math.floor(label.length / 2), Y0 + 5, label, TRIBES[k].color);
        }
      }
      if (p > 0.8) strC(surface, yb + 2, 'one platform between them', TEXT);
    },
  };
}

/* ---- 3/5 · DASHBOARDS (2.5s): role-specific panels build row by row ---- */
function dashboards(): StoryBeat {
  const DUR = 2.5;
  const BOX_H = 9;
  const Y0 = 3;
  return {
    label: 'DASHBOARDS',
    caption: 'role-specific dashboards, row by row',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      for (let k = 0; k < TRIBES.length; k++) {
        const x0 = tribeX(k, W);
        const build = clamp01((p - k * 0.22) / 0.55);
        if (build <= 0) continue;
        box(surface, x0, Y0, PW, BOX_H, STRUCT);
        borderLabel(surface, x0 + 3, Y0, ` ${TRIBES[k].label} `, TRIBES[k].color, PANE_BG);
        // Rows type in top-down below the label; '=' flecks as texture.
        const innerW = PW - 2;
        const rows = BOX_H - 2;
        for (let r = 0; r < rows; r++) {
          const vis = Math.floor(clamp01(build * (rows + 1) - (r + 1)) * innerW);
          for (let x = 0; x < vis; x++) {
            const gx = x0 + 1 + x;
            const gy = Y0 + 1 + r;
            surface.set(gx, gy, hash2(gx, gy * 7) % 9 === 0 ? '=' : '.', DIM);
          }
        }
        if (build >= 1) str(surface, x0 + 1, Y0 + BOX_H + 1, `> ${TRIBES[k].label.toLowerCase()}`, TRIBES[k].color);
      }
      if (p > 0.6) strC(surface, Y0 + BOX_H + 2, 'role-specific dashboards', TEXT);
    },
  };
}

/* ---- 4/5 · BEYOND VIDEO (2.5s): podcasts · apparel integration · careers */
function beyondVideo(): StoryBeat {
  const DUR = 2.5;
  const BW = 27;
  const BH = 7;
  const Y0 = 3;
  const ROWS: [string, number][] = [
    ['> podcasts', 0.5],
    ['> apparel', 1.05],
    ['> careers', 1.6],
  ];
  return {
    label: 'BEYOND VIDEO',
    caption: 'beyond video: podcasts, apparel integration, careers',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      const w = Math.min(BW, W - 8);
      const x0 = Math.max(1, Math.floor((W - w) / 2));
      box(surface, x0, Y0, w, BH, STRUCT);
      borderLabel(surface, x0 + 4, Y0, ' beyond video ', STRUCT, PANE_BG);
      for (let i = 0; i < ROWS.length; i++) {
        const [text, at] = ROWS[i];
        const y = Y0 + 2 + i;
        if (t >= at) str(surface, x0 + 2, y, text, TEXT);
        else if (t >= at - 0.15) str(surface, x0 + 2, y, text.slice(0, 4) + '*', DIM);
      }
      if (p > 0.7) strC(surface, Y0 + BH + 2, 'careers · content · commerce', TEXT);
    },
  };
}

/* ---- 5/5 · SHIPPED CLIENT PRODUCT (2s): paid Buildora product + live chip */
function shippedClientProduct(): StoryBeat {
  const DUR = 2;
  const SEGMENTS: [string, string][] = [
    ['shipped', DIM],
    [' · ', DIMMER],
    ['paid ', TEXT],
    ['Buildora', YELLOW],
    [' client product', TEXT],
  ];
  return {
    label: 'SHIPPED CLIENT PRODUCT',
    caption: 'shipped as a paid Buildora client product',
    dur: DUR,
    // The legend draws whole at any p (a hold, not an animation — the story
    // ends paused here and replays on click).
    draw(surface, _ctx, _p, _rng) {
      const W = surface.cols;
      const text = SEGMENTS.map(([s]) => s).join('');
      let x = Math.max(0, Math.floor((W - text.length) / 2));
      for (const [word, color] of SEGMENTS) {
        if (word === ' · ') {
          surface.set(x + 1, 8, '·', color); // word + SP + · + SP + word
          x += 3;
        } else {
          str(surface, x, 8, word, color);
          x += word.length;
        }
      }
      // Live-site chip: the committed link as an outlined stamp.
      const cw = 20;
      const cx = Math.max(1, Math.floor((W - cw) / 2));
      box(surface, cx, 10, cw, 3, STRUCT);
      strC(surface, 11, 'eleventh-rnd.com', GREEN, PANE_BG);
    },
  };
}

/** The Eleventh Round story: exactly the five beats from the Task 15 brief. */
export default function makeStoryData(_rng?: RngFactory): StoryData {
  return {
    beats: [threeTribes(), theRing(), dashboards(), beyondVideo(), shippedClientProduct()],
  };
}