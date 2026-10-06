// stories/adversary-lab.ts — Adversary Lab's story scenes (Task 15). Pure
// whole-frame draws from (surface, ctx, p, rng) — the Task 14 engine contract.
// Facts ONLY from committed data (adversary-lab.md + the Task 15 brief):
// solo security researcher; 10+ MITRE ATT&CK techniques simulated across
// Discovery, Persistence, Lateral Movement, Collection on Windows AND Linux;
// telemetry collected in Wazuh + Elastic; 10+ custom Sigma rules mapped to
// technique IDs. Glyphs are in-font ASCII (story-draw.ts); flicker via pure
// hash2; positions advance linearly with p.

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

const TACTICS = ['DISCOVERY', 'PERSISTENCE', 'LATERAL MOVE', 'COLLECTION'];

/* ---- 1/5 · THE THEORY (2.5s): the ATT&CK matrix assembles ---- */
function theTheory(): StoryBeat {
  const DUR = 2.5;
  const Y0 = 3;
  return {
    label: 'THE THEORY',
    caption: 'the MITRE ATT&CK matrix, assembled',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const w = Math.min(66, W - 8);
      const x0 = Math.max(1, Math.floor((W - w) / 2));
      box(surface, x0, Y0, w, 9, STRUCT);
      borderLabel(surface, x0 + 4, Y0, ' the mitre attack matrix ', STRUCT, PANE_BG);
      for (let r = 0; r < TACTICS.length; r++) {
        const y = Y0 + 2 + r;
        const vis = Math.floor(clamp01(p * (TACTICS.length + 1) - r) * (w - 2));
        str(surface, x0 + 1, y, TACTICS[r].slice(0, Math.min(TACTICS[r].length, vis)), YELLOW);
        // Technique ticks dot in after the tactic name.
        const ticks = Math.max(0, vis - TACTICS[r].length);
        for (let t = 0; t < ticks; t++) surface.set(x0 + 1 + TACTICS[r].length + t, y, hash2(t, r) % 4 === 0 ? '=' : '.', DIM);
      }
      if (p > 0.75) strC(surface, Y0 + 10, '10+ techniques · windows + linux', TEXT);
    },
  };
}

/* ---- 2/5 · THE EMULATION (3s): an attack walks the stages on two hosts ---- */
function theEmulation(): StoryBeat {
  const DUR = 3;
  const Y0 = 3;
  const STAGE_TAG = ['disc', 'pers', 'lat.', 'coll'];
  return {
    label: 'THE EMULATION',
    caption: '10+ techniques emulated — windows and linux',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      // Two host stacks, side by side.
      const hosts = ['WIN', 'LINUX'];
      for (let h = 0; h < hosts.length; h++) {
        const x0 = Math.max(1, Math.floor((W - 52) / 2) + h * 24);
        const boxW = 17;
        box(surface, x0, Y0, boxW, 9, STRUCT);
        borderLabel(surface, x0 + 4, Y0, ` ${hosts[h]} `, h === 0 ? BLUE : RED, PANE_BG);
        for (let s = 0; s < TACTICS.length; s++) {
          const y = Y0 + 2 + s;
          str(surface, x0 + 2, y, `> ${STAGE_TAG[s]}`, DIM);
          // The attack steps through WIN's stages in the first half, LINUX's
          // in the second; stamped stages turn red.
          const order = (h === 0 ? 0 : 4) + s + 1;
          const step = p * 8;
          if (step >= order) surface.set(x0 + 3 + STAGE_TAG[s].length, y, '+', RED);
        }
      }
      if (p > 0.85) strC(surface, Y0 + 10, 'attack walks the stages', TEXT);
    },
  };
}

/* ---- 3/5 · THE TELEMETRY (2.5s): events stream with timestamps ---- */
function theTelemetry(): StoryBeat {
  const DUR = 2.5;
  const Y0 = 2;
  return {
    label: 'THE TELEMETRY',
    caption: 'telemetry collected in wazuh + elastic',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      // Scrolling event rows; the window offset advances with the clock so
      // rows stream upward like a log tail.
      for (let i = 0; i < 7; i++) {
        const idx = Math.floor(t * 3) + i;
        const y = Y0 + 6 - i;
        if (y < Y0 || y > Y0 + 6) continue;
        const src = idx % 2 === 0 ? 'wazuh' : 'elastic';
        const color = idx % 2 === 0 ? GREEN : BLUE;
        const stamp = `${(idx * 3 + 7) % 60}`.padStart(2, '0');
        str(surface, 4, y, `[10:0${(idx % 9) + 1}:${stamp}] ${src} > event`, color);
        const trail = Math.floor(W * 0.35);
        for (let x = 4 + 18; x < 4 + 18 + trail; x++)
          surface.set(x, y, hash2(x, idx) % 7 === 0 ? '=' : '.', DIMMER);
      }
      box(surface, 2, Y0 - 1, Math.min(70, W - 4), 11, DIMMER);
      if (p > 0.8) strC(surface, Y0 + 8, 'wazuh + elastic', TEXT);
    },
  };
}

/* ---- 4/5 · THE RULES (3s): sigma rule cards stamp in ---- */
function theRules(): StoryBeat {
  const DUR = 3;
  const N = 10;
  const Y0 = 5;
  const CARD_W = 12;
  return {
    label: 'THE RULES',
    caption: '10+ sigma rules, mapped to technique ids',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      const perRow = 5;
      const x0 = Math.max(1, Math.floor((W - (perRow * CARD_W + 4)) / 2));
      for (let k = 0; k < N; k++) {
        const cx = x0 + (k % perRow) * (CARD_W + 1);
        const cy = Y0 + Math.floor(k / perRow) * 4;
        const at = 0.15 + k * 0.25; // last card lands ~2.4s
        const stamped = t >= at;
        box(surface, cx, cy, CARD_W, 3, stamped ? GREEN : DIMMER);
        if (stamped) borderLabel(surface, cx + 1, cy + 1, ` SIGMA-${k + 1} `.slice(0, CARD_W - 1), GREEN, PANE_BG);
        else if (t >= at - 0.15) str(surface, cx + 2, cy + 1, '??', DIM);
      }
      strC(surface, Y0 + 9, `sigma rules: ${Math.min(N, Math.max(0, Math.floor((t - 0.15) / 0.25) + 1))}`, YELLOW);
    },
  };
}

/* ---- 5/5 · THE PROOF (2.5s): detections fire where the attack crossed ---- */
function theProof(): StoryBeat {
  const DUR = 2.5;
  const Y0 = 3;
  const STAGE_TAG = ['disc', 'pers', 'lat.', 'coll'];
  return {
    label: 'THE PROOF',
    caption: 'detections proven under pressure',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      for (let h = 0; h < 2; h++) {
        const x0 = Math.max(1, Math.floor((W - 52) / 2) + h * 24);
        box(surface, x0, Y0, 17, 9, h === 0 ? GREEN : RED);
        borderLabel(surface, x0 + 4, Y0, ` ${h === 0 ? 'WIN' : 'LINUX'} `, TEXT, PANE_BG);
        for (let s = 0; s < TACTICS.length; s++) {
          const y = Y0 + 2 + s;
          str(surface, x0 + 2, y, `> ${STAGE_TAG[s]}`, DIM);
          // One detection fires per stage (where the emulation crossed).
          if (p > 0.3 + s * 0.15 + h * 0.05) str(surface, x0 + 10, y, '[ok]', GREEN);
        }
      }
      strC(surface, Y0 + 10, 'detection works under pressure', GREEN);
    },
  };
}

/** The Adversary Lab story: exactly the five beats from the Task 15 brief. */
export default function makeStoryData(_rng?: RngFactory): StoryData {
  return {
    beats: [theTheory(), theEmulation(), theTelemetry(), theRules(), theProof()],
    layman: 'A practice range that simulates real attacks first — so you know your defences actually catch them.',
  };
}