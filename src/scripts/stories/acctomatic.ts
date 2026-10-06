// stories/acctomatic.ts — Acctomatic's story scenes (Task 15). Pure
// whole-frame draws from (surface, ctx, p, rng) — Task 14 contract. Facts
// ONLY from committed data (acctomatic.md + the Task 15 brief): accounting
// firms transcribe invoices by hand; shipped a pipeline that reads,
// classifies and flags them; PaddleOCR local; agentic ingestion pipeline
// (local OCR + vision models); GREEN/RED state machine for human review;
// multi-tenant architecture; n8n; website acctomatic.com. Glyphs in-font
// ASCII; hash2 flicker; linear motion on p.

import type { AsciiSurface } from '../ascii/surface';
import type { RngFactory, StoryBeat, StoryData } from '../ascii/story';
import { borderLabel, box, clamp01, hash2, str, strC } from '../ascii/story-draw';

const GREEN = 'var(--color-green)';
const RED = 'var(--color-red)';
const YELLOW = 'var(--color-yellow)';
const BLUE = 'var(--color-blue)';
const STRUCT = 'var(--color-surface2)';
const DIM = 'var(--color-overlay1)';
const DIMMER = 'var(--color-overlay0)';
const TEXT = 'var(--color-subtext0)';
const PANE_BG = 'var(--color-surface1)';

const FIELDS = ['vendor', 'date', 'total'];

/* ---- 1/5 · THE TRANSCRIPTION TAX (3s): invoices typed one keystroke at a
   time — the manual tax ---- */
function theTax(): StoryBeat {
  const DUR = 3;
  const NUM = ['inv-2041', 'inv-2042', 'inv-2043'];
  return {
    label: 'THE TRANSCRIPTION TAX',
    caption: 'invoice rows typed out by hand, one keystroke at a time',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      const x0 = Math.max(1, Math.floor((W - 46) / 2));
      for (let r = 0; r < NUM.length; r++) {
        const start = 0.15 + r * 0.55;
        // Painfully slow typing — about 5 chars per second (that is the point).
        const vis = Math.max(0, Math.min(NUM[r].length, Math.floor((t - start) * 5)));
        if (vis <= 0) continue;
        str(surface, x0, 5 + r * 2, NUM[r].slice(0, vis), TEXT);
        // Caret on the typing head.
        if (vis < NUM[r].length && hash2(Math.floor(t * 8), r) % 2 === 0)
          surface.set(x0 + vis, 5 + r * 2, '_', YELLOW);
      }
      if (p > 0.75) strC(surface, 12, 'hours, typed by hand', DIM);
    },
  };
}

/* ---- 2/5 · THE SCAN (2.5s): the OCR scan-line sweeps; fields lift off ---- */
function theScan(): StoryBeat {
  const DUR = 2.5;
  const Y0 = 4;
  return {
    label: 'THE SCAN',
    caption: 'paddleocr (local) reads the invoice',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const w = Math.min(40, W - 10);
      const x0 = Math.max(1, Math.floor((W - w) / 2));
      box(surface, x0, Y0, w, 9, STRUCT);
      borderLabel(surface, x0 + 5, Y0, ' invoice ', STRUCT, PANE_BG);
      // The scan line sweeps right; a field name lifts as it passes.
      const sx = x0 + 2 + Math.floor(clamp01(p * 1.15) * (w - 5));
      for (let y = Y0 + 1; y <= Y0 + 7; y++) surface.set(sx, y, ':', YELLOW);
      for (let r = 0; r < FIELDS.length; r++) {
        const y = Y0 + 2 + r * 2;
        // Field lifts once the scan line has passed its column.
        if (sx > x0 + 14) str(surface, x0 + 4, y, FIELDS[r], GREEN);
        else str(surface, x0 + 4, y, '.'.repeat(FIELDS[r].length), DIMMER);
        for (let x = x0 + 13; x < x0 + w - 3; x++) surface.set(x, y, '.', DIMMER);
      }
      if (p > 0.8) strC(surface, Y0 + 10, 'local ocr + vision models', TEXT);
    },
  };
}

/* ---- 3/5 · THE AGENTS (3s): documents thread through node cells ---- */
function theAgents(): StoryBeat {
  const DUR = 3;
  const NODES = ['CLASSIFY', 'EXTRACT', 'FLAG'];
  return {
    label: 'THE AGENTS',
    caption: 'an agentic pipeline threads documents through the nodes',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      // node o -> [ CLASSIFY ] -> [ EXTRACT ] -> [ FLAG ] -> ok
      const x0 = Math.max(1, Math.floor((W - 62) / 2));
      surface.set(x0 + 6, 9, 'o', TEXT);
      let cx = x0 + 10;
      const w = 12;
      for (let k = 0; k < NODES.length; k++) {
        const lit = t >= 0.4 + k * 0.85;
        box(surface, cx, 7, w, 5, lit ? GREEN : DIMMER);
        borderLabel(surface, cx + 1, 9, ` ${NODES[k]} `.slice(0, w - 1), lit ? GREEN : DIM, PANE_BG);
        if (k < NODES.length - 1) str(surface, cx + w, 9, '==', DIMMER);
        cx += w + 2;
      }
      if (t >= 0.4 + 3 * 0.85) str(surface, cx, 9, '> ok', GREEN);
      if (p > 0.8) strC(surface, 14, 'n8n-agents · local ocr', TEXT);
    },
  };
}

/* ---- 4/5 · GREEN / RED (2.5s): the review state machine stamps ---- */
function greenRed(): StoryBeat {
  const DUR = 2.5;
  return {
    label: 'GREEN / RED',
    caption: 'GREEN clears itself; RED goes to human review',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      // GREEN pane (auto) + RED pane (human review), stamped in sequence.
      if (t > 0.5) {
        const x0 = Math.max(1, Math.floor((W - 34) / 2) - 14);
        box(surface, x0, 7, 15, 5, GREEN);
        borderLabel(surface, x0 + 2, 9, ' GREEN auto ', GREEN, PANE_BG);
      }
      if (t > 1.2) {
        const x0 = Math.max(1, Math.floor((W - 34) / 2) + 16);
        box(surface, x0, 7, 17, 5, RED);
        borderLabel(surface, x0 + 2, 9, ' RED review ', RED, PANE_BG);
      }
      if (p > 0.8) strC(surface, 14, 'humans only see what is flagged', TEXT);
    },
  };
}

/* ---- 5/5 · TENANTS (2s): one column per firm; the committed site chip --- */
function tenants(): StoryBeat {
  const DUR = 2;
  const N = 5;
  return {
    label: 'TENANTS',
    caption: 'multi-tenant — one column per firm · acctomatic.com',
    dur: DUR,
    // Draws whole at any p (hold; the story ends paused here).
    draw(surface, _ctx, _p, _rng) {
      const W = surface.cols;
      for (let k = 0; k < N; k++) {
        const h = 6 + (k % 3);
        const x0 = Math.max(1, Math.floor((W - N * 8 + 2) / 2) + k * 8);
        for (let y = 11 - h; y <= 11; y++) surface.set(x0, y, '|', [GREEN, BLUE, YELLOW, GREEN, STRUCT][k]);
        surface.set(x0, 11 - h - 1, 'v', STRUCT);
      }
      strC(surface, 13, 'multi-tenant · one firm per column', TEXT);
      strC(surface, 15, 'acctomatic.com', GREEN);
    },
  };
}

/** The Acctomatic story: exactly the five beats from the Task 15 brief. */
export default function makeStoryData(_rng?: RngFactory): StoryData {
  return {
    beats: [theTax(), theScan(), theAgents(), greenRed(), tenants()],
    layman: 'Software that reads invoices like a person: types them up, sorts them, and asks for help only when unsure.',
  };
}