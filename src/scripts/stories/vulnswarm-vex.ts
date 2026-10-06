// stories/vulnswarm-vex.ts — VulnSwarm-VEX's story scenes (Task 14). Each beat
// is a PURE draw of the whole frame: it holds no state and repaints from
// (surface, ctx, p, rng), so the engine can seek to any time and reproduce the
// exact frame. `p` is the beat-local clock (0..1); flicker slots are pure
// integer hashes on p-derived slots (no rng needed); positional noise samples a
// FIXED number of draws from the per-call rng in a fixed order, so stream
// alignment holds across frames. Facts ONLY from committed data
// (vulnswarm-vex.md + legacy): 4,102 advisories, 95.1% noise, 14 benchmark
// apps, 181 holdout findings, 9/13 decisive predictions, 91.7% ground-truth
// agreement, 2,705 hydration queries. Glyphs are in-font ASCII (see
// story-draw.ts); the brief's red ✗ is stamped only where nothing is drawn
// after it in its row (its fallback advance would shift anything to the right).
// The optional makeStoryData rng param is accepted for the uniform data-file
// contract; these scenes take their stream from the engine's per-call rng.

import type { AsciiSurface } from '../ascii/surface';
import type { RngFactory, StoryBeat, StoryData } from '../ascii/story';
import {
  borderLabel,
  box,
  clamp01,
  fmt,
  hline,
  hash2,
  str,
  strC,
  strIn,
} from '../ascii/story-draw';

const GREEN = 'var(--color-green)';
const RED = 'var(--color-red)';
const YELLOW = 'var(--color-yellow)';
const BLUE = 'var(--color-blue)';
const STRUCT = 'var(--color-surface2)';
const DIM = 'var(--color-overlay1)';
const DIMMER = 'var(--color-overlay0)';
const TEXT = 'var(--color-subtext0)';
const PANE_BG = 'var(--color-surface1)';

const clampW = (surface: AsciiSurface, ideal: number, min: number): number =>
  Math.max(min, Math.min(ideal, surface.cols - 8));

const centeredX = (surface: AsciiSurface, w: number): number =>
  Math.max(1, Math.floor((surface.cols - w) / 2));

/* ---- 1/6 · THE FLOOD (3s): advisories rain everywhere, counters build ---- */
function theFlood(): StoryBeat {
  const DUR = 3;
  const JITTER = ['|', '|', '|', 'i', '!', '/', ':', '.'];
  return {
    label: 'THE FLOOD',
    caption: '4,102 advisories land — 95.1% of it is noise',
    dur: DUR,
    draw(surface, _ctx, p, rng) {
      const W = surface.cols;
      const H = surface.rows;
      const t = p * DUR;
      const N = Math.max(8, Math.round(W * 0.5));
      const span = H + 20;
      // Fixed draws per (k, j) in a fixed order → constants identical every
      // frame; the y position is a pure function of the beat clock t.
      for (let k = 0; k < N; k++) {
        const x = Math.floor(rng() * W);
        const speed = 26 + rng() * 44; // rows/s
        const len = 3 + Math.floor(rng() * 5);
        const y0 = rng() * span;
        const glyphs: string[] = [];
        for (let j = 0; j < len; j++) glyphs.push(JITTER[Math.floor(rng() * JITTER.length)]);
        const head = Math.floor((y0 + speed * t) % span);
        for (let j = 0; j < glyphs.length; j++) {
          const y = head - j;
          if (y >= 0 && y < H) surface.set(x, y, glyphs[j], j === 0 ? TEXT : DIM);
        }
      }
      // Counters build last, on a solid pane bg so they punch through the rain.
      str(
        surface,
        2,
        H - 4,
        `${fmt(Math.floor(4102 * clamp01(p / 0.7)))} advisories`,
        YELLOW,
        PANE_BG,
      );
      if (p > 0.3) {
        const noise = (95.1 * clamp01((p - 0.3) / 0.6)).toFixed(1);
        str(surface, 2, H - 3, `noise: ${noise}%`, YELLOW, PANE_BG);
      }
    },
  };
}

/* ---- 2/6 · THE FALSE SOLVE (2.5s): a queue stamped with vibes verdicts ---- */
function theFalseSolve(): StoryBeat {
  const DUR = 2.5;
  const ROWS = 5;
  const STAMPS = ['A', 'NA', 'MR', '??', '✗'];
  const STAMP_COLORS = [DIM, YELLOW, RED, RED, RED];
  return {
    label: 'THE FALSE SOLVE',
    caption: 'confidence: vibes — auditable: no',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      const w = clampW(surface, 44, 22);
      const x0 = centeredX(surface, w);
      const y0 = 3;
      const yb = y0 + ROWS + 2;
      // Open queue (label on the top rule, left rail only): stamps end each
      // row with nothing drawn after them — see the glyph note above.
      hline(surface, x0, x0 + w - 1, y0, DIMMER, '=');
      surface.set(x0 + w - 1, y0, '=', DIMMER);
      surface.set(x0, y0, '=', DIMMER);
      borderLabel(surface, x0 + 4, y0, ' advisory queue ', STRUCT, PANE_BG);
      const slot = Math.floor(t / 0.12);
      for (let i = 0; i < ROWS; i++) {
        const y = y0 + 2 + i;
        surface.set(x0, y, '|', DIMMER);
        str(surface, x0 + 1, y, '> advisory', TEXT);
        for (let x = x0 + 11; x <= x0 + w - 4; x++) surface.set(x, y, '.', DIMMER);
        const h = hash2(slot, i * 37 + 5);
        const glyph = STAMPS[h % STAMPS.length];
        str(surface, x0 + w - 1 - glyph.length, y, glyph, STAMP_COLORS[(h >>> 8) % STAMP_COLORS.length]);
      }
      hline(surface, x0, x0 + w - 1, yb, DIMMER, '=');
      surface.set(x0, yb, '=', DIMMER);
      surface.set(x0 + w - 1, yb, '=', DIMMER);
      surface.set(x0, y0 + 1, '+', DIMMER);
      surface.set(x0, yb - 1, '+', DIMMER);
      // One stamp flashes solid red on a hash-chosen row every few slots.
      const big = hash2(slot, 101) % ROWS;
      str(surface, x0 + w - 3, y0 + 2 + big, ' ✗ ', RED, PANE_BG);
      if (p > 0.35) strC(surface, yb + 3, 'confidence: vibes', RED);
      if (p > 0.62) strC(surface, yb + 4, 'auditable: no', RED);
    },
  };
}

/* ---- 3/6 · THE EVIDENCE (3s): the evidence table assembles row by row ---- */
function theEvidence(): StoryBeat {
  const DUR = 3;
  const WORDS = ['RANGES', 'REACHABILITY', 'VERSIONS'];
  const DATAROWS = 4;
  const TEX = ['#', ':', '.', '=', '-'];
  return {
    label: 'THE EVIDENCE',
    caption: 'ranges · reachability · versions assemble as evidence',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const g = clamp01(p * 1.05);
      const w = clampW(surface, 64, 24);
      const x0 = centeredX(surface, w);
      const y0 = 3;
      const h = 2 + DATAROWS + 3; // borders + header + rule + 4 rows
      box(surface, x0, y0, w, h, STRUCT);
      borderLabel(surface, x0 + 4, y0, ' evidence ', STRUCT, PANE_BG);
      const innerW = w - 2;
      const cw = Math.max(6, Math.floor(innerW / 3));
      // Column separators '||' one before col 1 and col 2.
      const sep1 = x0 + cw;
      const sep2 = x0 + 2 * cw;
      for (let y = y0 + 1; y <= y0 + h - 2; y++) {
        surface.set(sep1, y, '|', STRUCT);
        surface.set(sep2, y, '|', STRUCT);
      }
      // Headers type in left-to-right across the whole table width first.
      const headerBudget = Math.floor(clamp01(g / 0.3) * innerW);
      for (let k = 0; k < WORDS.length; k++) {
        const vis = Math.max(0, Math.min(WORDS[k].length, cw - 1, headerBudget - k * cw));
        strIn(surface, x0 + 1 + k * cw, cw - 1, y0 + 1, WORDS[k].slice(0, vis), 'var(--color-subtext0)');
      }
      // Rule under the headers once the header phase completes.
      if (g > 0.3) hline(surface, x0 + 1, x0 + w - 2, y0 + 2, STRUCT);
      // Data rows fill row by row, cells left→right (texture per cell).
      const usable = w - 2 - 2; // inner cells minus the two separators
      const budget = Math.floor(clamp01((g - 0.35) / 0.6) * DATAROWS * usable);
      for (let r = 0; r < DATAROWS; r++) {
        const y = y0 + 3 + r;
        const filled = Math.max(0, Math.min(usable, budget - r * usable));
        let x = x0 + 1;
        let placed = 0;
        while (x <= x0 + w - 2 && placed < filled) {
          if (x === sep1 || x === sep2) {
            x++;
            continue;
          }
          surface.set(x, y, TEX[hash2(r, x) % TEX.length], DIM);
          x++;
          placed++;
        }
      }
    },
  };
}

/* ---- 4/6 · Z3 DECIDES (3s): verdicts stamp one by one after a 0.2s glitch -- */
function z3Decides(): StoryBeat {
  const DUR = 3;
  const VERDICTS: [string, string][] = [
    ['A', GREEN],
    ['NA', BLUE],
    ['MR', YELLOW],
  ];
  const GLITCH = ['!', '#', '$', '%', '?', '@'];
  const GLITCH_LEAD = 0.2; // s — brief: each stamp is preceded by a 0.2s glitch
  return {
    label: 'Z3 DECIDES',
    caption: 'verdicts = theorems',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      const n = Math.min(10, Math.max(4, Math.floor((W - 6) / 6)));
      const totalW = n * 6 - 2;
      const x0 = centeredX(surface, totalW);
      const y = 8;
      for (let k = 0; k < n; k++) {
        const x = x0 + k * 6;
        box(surface, x, y, 4, 3, STRUCT);
        const st = 0.35 + k * (2.05 / n); // last stamp lands ~2.29s
        if (t >= st) {
          const [glyph, color] = VERDICTS[k % VERDICTS.length];
          str(surface, x + 1 + Math.floor((2 - glyph.length) / 2), y + 1, glyph, color);
        } else if (t >= st - GLITCH_LEAD) {
          // Glitch window: hash-slot flicker right up to the stamp.
          str(surface, x + 1, y + 1, GLITCH[hash2(k, Math.floor(t * 40)) % GLITCH.length], DIM);
        }
      }
      strC(surface, 5, 'z3: sat / unsat -> verdict', STRUCT);
      if (p > 0.4) strC(surface, 13, 'deterministic: same input, same verdict', TEXT);
    },
  };
}

/* ---- 5/6 · THE PROOF (3s): the agreement bar fills to 91.7%, counters in --- */
function theProof(): StoryBeat {
  const DUR = 3;
  const RATE = 0.917; // committed: 91.7% agreement — the bar never reaches 100%
  const TARGET = 91.7;
  return {
    label: 'THE PROOF',
    caption: '91.7% agreement with ground truth',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const fill = clamp01(p / 0.8); // bar completes slightly before the beat ends
      const bw = Math.max(16, Math.min(56, W - 12));
      const x0 = centeredX(surface, bw);
      const yb = 8;
      str(
        surface,
        x0,
        yb - 2,
        `${(TARGET * fill).toFixed(1)}% agreement with ground truth`,
        YELLOW,
      );
      const got = Math.round(bw * RATE * fill);
      for (let i = 0; i < bw; i++) {
        surface.set(x0 + i, yb, i < got ? '█' : '.', i < got ? GREEN : DIMMER);
      }
      // Staggered counters (instant step-in reveal, no easing).
      const rowAt = (y: number, groups: [string, string][], shown: boolean) => {
        if (!shown) return;
        const text = groups.map(([num, rest]) => num + rest).join('   ');
        let x = Math.max(0, Math.floor((W - text.length) / 2));
        for (const [num, rest] of groups) {
          str(surface, x, y, num + rest, TEXT);
          str(surface, x, y, num, YELLOW); // numbers above the label colour
          x += num.length + rest.length + 3;
        }
      };
      rowAt(
        yb + 4,
        [
          ['14', ' benchmark apps'],
          ['2,705', ' hydration queries'],
        ],
        p > 0.25,
      );
      rowAt(yb + 5, [['181', ' holdout findings'], ['9/13', ' decisive predictions']], p > 0.45);
    },
  };
}

/* ---- 6/6 · SHIPPED (2s): the legend; holds; ends paused; replay on click --- */
function shipped(): StoryBeat {
  const DUR = 2;
  return {
    label: 'SHIPPED',
    caption: 'deterministic and auditable — paper under review',
    dur: DUR,
    // The legend draws whole at any p (a hold, not an animation).
    draw(surface, _ctx, _p, _rng) {
      const W = surface.cols;
      const text = 'affected · not_affected · manual_review';
      let x = centeredX(surface, text.length);
      for (const [word, color] of [
        ['affected', GREEN],
        [' · ', DIMMER],
        ['not_affected', BLUE],
        [' · ', DIMMER],
        ['manual_review', YELLOW],
      ] as [string, string][]) {
        if (word === ' · ') {
          surface.set(x + 1, 9, '·', color); // word + SP + · + SP + word
          x += 3;
        } else {
          str(surface, x, 9, word, color);
          x += word.length;
        }
      }
      strC(surface, 12, 'paper under review', TEXT);
    },
  };
}

/** The VulnSwarm-VEX story: exactly the six beats from the Task 14 brief. */
export default function makeStoryData(_rng?: RngFactory): StoryData {
  return {
    beats: [theFlood(), theFalseSolve(), theEvidence(), z3Decides(), theProof(), shipped()],
  };
}