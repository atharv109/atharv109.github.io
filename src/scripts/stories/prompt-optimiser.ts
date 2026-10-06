// stories/prompt-optimiser.ts — Prompt Optimiser's story scenes (Task 15).
// Pure whole-frame draws from (surface, ctx, p, rng) — Task 14 contract.
// Facts ONLY from committed data (prompt-optimiser.md + the Task 15 brief):
// browser extension (Chrome APIs); users copy-paste the same prompt into 3
// chats (ChatGPT/Claude/Gemini) and hope; injects an Optimize button that
// rewrites prompts through a 6-stage Groq pipeline; works across 3 major AI
// interfaces; open source at github.com/atharv109/Chatgpt-prompt-optimiser.
// Glyphs are in-font ASCII; flicker via pure hash2; linear motion on p.

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

const CHATS = ['CHATGPT', 'CLAUDE', 'GEMINI'];

/* ---- 1/5 · THE RITUAL (3s): one prompt, copied into three chats ---- */
function theRitual(): StoryBeat {
  const DUR = 3;
  const Y0 = 5;
  return {
    label: 'THE RITUAL',
    caption: 'the same prompt, copy-pasted into three chats',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      // The prompt line at the top.
      str(surface, 4, 2, '> prompt', TEXT);
      // Three chat columns stamp in one after another (the manual ritual).
      for (let k = 0; k < CHATS.length; k++) {
        const x0 = Math.max(1, Math.floor((W - 74) / 2) + k * 24);
        const at = 0.6 + k * 0.7;
        if (t < at) continue;
        box(surface, x0, Y0, 17, 5, DIMMER);
        borderLabel(surface, x0 + 4, Y0, ` ${CHATS[k]} `, [GREEN, BLUE, YELLOW][k], PANE_BG);
        str(surface, x0 + 2, Y0 + 2, '[paste]', DIM);
        const flash = t - at;
        if (flash < 0.2) {
          const fill = W; // brief paste flash over the box, hash-flicker
          void fill;
          for (let x = x0 + 2; x <= x0 + 14; x++)
            if (hash2(x, Math.floor(t * 30)) % 2 === 0) surface.set(x, Y0 + 2, '*', PANE_BG);
        }
      }
      if (p > 0.8) strC(surface, Y0 + 7, 'and hope for the best', TEXT);
    },
  };
}

/* ---- 2/5 · THE BUTTON (2s): the Optimize chip stamps in ---- */
function theButton(): StoryBeat {
  const DUR = 2;
  return {
    label: 'THE BUTTON',
    caption: 'an Optimize button, injected into the page',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      if (t > 0.4) {
        const w = 15;
        const x0 = Math.max(1, Math.floor((W - w) / 2));
        const flick = t > 0.55 || hash2(Math.floor(t * 20), 7) % 2 === 0;
        box(surface, x0, 8, w, 3, flick ? GREEN : DIMMER);
        borderLabel(surface, x0 + 3, 9, ' [ Optimize ] ', flick ? GREEN : TEXT, PANE_BG);
      }
      if (t > 0.4) strC(surface, 13, 'one button, three chats', TEXT);
    },
  };
}

/* ---- 3/5 · SIX STAGES (3s): the prompt flows through the groq pipeline --- */
function sixStages(): StoryBeat {
  const DUR = 3;
  const N = 6;
  const Y0 = 8;
  return {
    label: 'SIX STAGES',
    caption: 'rewritten through a 6-stage groq pipeline',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const cellW = 7;
      const totalW = N * (cellW + 2) - 2;
      const x0 = Math.max(1, Math.floor((W - totalW) / 2));
      const t = p * DUR;
      for (let k = 0; k < N; k++) {
        const cx = x0 + k * (cellW + 2);
        const lit = p > k / (N + 1); // stages light left to right
        box(surface, cx, Y0, cellW, 3, lit ? GREEN : DIMMER);
        surface.set(cx + 3, Y0 + 1, `${k + 1}`[0], lit ? GREEN : DIM);
        if (k > 0) str(surface, cx - 2, Y0 + 1, '=', DIMMER);
      }
      // The prompt dot travels the chain.
      const step = Math.min(N - 0.001, t / (DUR / N));
      const cx = x0 + 3 + Math.floor(step) * (cellW + 2);
      surface.set(cx, Y0 - 2, 'o', TEXT);
      strC(surface, Y0 - 4, 'groq', STRUCT);
    },
  };
}

/* ---- 4/5 · THE DIFFERENCE (2.5s): weak vs optimized, side by side ---- */
function theDifference(): StoryBeat {
  const DUR = 2.5;
  return {
    label: 'THE DIFFERENCE',
    caption: 'weak prompt in, optimized prompt out',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const paneW = 13;
      const gap = 8;
      const x0 = Math.max(1, Math.floor((W - (paneW * 2 + gap)) / 2));
      // weak: near-empty
      box(surface, x0, 6, paneW, 6, DIMMER);
      borderLabel(surface, x0 + 3, 6, ' weak ', RED, PANE_BG);
      if (p > 0.3) str(surface, x0 + 2, 8, '...........', DIMMER);
      // optimized: rows fill in
      const x1 = x0 + paneW + gap;
      box(surface, x1, 6, paneW, 6, GREEN);
      borderLabel(surface, x1 + 2, 6, ' optimized ', GREEN, PANE_BG);
      const rows = 3;
      for (let r = 0; r < rows; r++)
        if (p > 0.3 + r * 0.2) str(surface, x1 + 2, 8 + r, '..........', GREEN);
      if (p > 0.7) strC(surface, 14, 'works across 3 major ai interfaces', TEXT);
    },
  };
}

/* ---- 5/5 · OPEN SOURCE (2s): the committed GitHub chip ---- */
function openSource(): StoryBeat {
  const DUR = 2;
  return {
    label: 'OPEN SOURCE',
    caption: 'open source on GitHub',
    dur: DUR,
    // The chip draws whole at any p (a hold — the story ends paused here).
    draw(surface, _ctx, _p, _rng) {
      const W = surface.cols;
      const text = 'github.com/atharv109/Chatgpt-prompt-optimiser';
      const w = text.length + 4;
      const x0 = Math.max(1, Math.floor((W - w) / 2));
      box(surface, x0, 9, w, 3, STRUCT);
      strC(surface, 10, text, GREEN, PANE_BG);
      strC(surface, 12, 'Chrome APIs · Groq', TEXT);
    },
  };
}

/** The Prompt Optimiser story: exactly the five beats from the Task 15 brief. */
export default function makeStoryData(_rng?: RngFactory): StoryData {
  return {
    beats: [theRitual(), theButton(), sixStages(), theDifference(), openSource()],
    layman: 'A browser button that rewrites your AI prompt so ChatGPT, Claude and Gemini answer properly first time.',
  };
}