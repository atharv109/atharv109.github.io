// stories/crypton.ts — Crypton's story scenes (Task 15). Pure whole-frame
// draws from (surface, ctx, p, rng) — Task 14 contract. Facts ONLY from
// committed data (crypton.md + the Task 15 brief): passwords and OTPs are the
// weakest link; identity binds to trusted devices not shared secrets;
// zero-trust; Rust / Axum / Redis / WebAuthn; device-centric keys;
// challenge-response verification; independent device revocation; early
// access with about 10 beta users. Glyphs in-font ASCII; hash2 flicker;
// linear motion on p.

import type { AsciiSurface } from '../ascii/surface';
import type { RngFactory, StoryBeat, StoryData } from '../ascii/story';
import { borderLabel, box, clamp01, str, strC } from '../ascii/story-draw';

const GREEN = 'var(--color-green)';
const RED = 'var(--color-red)';
const YELLOW = 'var(--color-yellow)';
const STRUCT = 'var(--color-surface2)';
const DIM = 'var(--color-overlay1)';
const DIMMER = 'var(--color-overlay0)';
const TEXT = 'var(--color-subtext0)';
const PANE_BG = 'var(--color-surface1)';

/* ---- 1/5 · THE WEAKEST LINK (3s): password/otp strings shatter and fall -- */
function weakestLink(): StoryBeat {
  const DUR = 3;
  return {
    label: 'THE WEAKEST LINK',
    caption: 'passwords and OTPs are the weakest link in every stack',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      // Two shared secrets on screen: they shatter (chars displace downward)
      // and fall away as p grows — the shared secret is the hole.
      for (const [text, y] of [['password', 6], ['otp', 9]] as [string, number][]) {
        const x0 = Math.max(1, Math.floor((W - text.length) / 2));
        for (let i = 0; i < text.length; i++) {
          const fall = clamp01(p - (i / text.length) * 0.5) * 9;
          const y1 = y + Math.floor(fall);
          // Bounds-guarded set: chars vanish as they fall off the grid.
          surface.set(x0 + i, y1, text[i], RED);
        }
      }
      if (p > 0.5 && p <= 1) strC(surface, 3, 'the weakest link', RED);
      if (p > 0.75) strC(surface, 15, 'shared secrets: removed', TEXT);
    },
  };
}

/* ---- 2/5 · BIND TO DEVICES (2.5s): device glyphs bind to keys ---- */
function bindToDevices(): StoryBeat {
  const DUR = 2.5;
  return {
    label: 'BIND TO DEVICES',
    caption: 'identity binds to devices, not shared secrets',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      // Three device(key) pairs: [ device o ] === [ key * ]
      for (let k = 0; k < 3; k++) {
        const y = 5 + k * 3;
        const x0 = Math.max(1, Math.floor((W - 44) / 2));
        const link = clamp01(p * 3 - k);
        if (link <= 0) continue;
        box(surface, x0, y - 1, 9, 3, STRUCT);
        borderLabel(surface, x0 + 2, y, ` dev${k + 1} `, TEXT, PANE_BG);
        box(surface, x0 + 30, y - 1, 9, 3, GREEN);
        borderLabel(surface, x0 + 32, y, ' key ', GREEN, PANE_BG);
        // The bind draws left to right once both boxes exist.
        hlineTo(surface, x0 + 10, x0 + 28, y, DIM, link);
      }
      if (p > 0.75) strC(surface, 15, 'device-centric keys', TEXT);
    },
  };
}

/* Progressive hline — linear ramp on a 0..1 gate. */
function hlineTo(surface: AsciiSurface, x0: number, x1: number, y: number, color: string, g: number): void {
  const end = Math.round(x0 + (x1 - x0) * g);
  for (let x = x0; x <= end; x++) surface.set(x, y, '=', color);
}

/* ---- 3/5 · CHALLENGE-RESPONSE (3s): the handshake ---- */
function challengeResponse(): StoryBeat {
  const DUR = 3;
  return {
    label: 'CHALLENGE-RESPONSE',
    caption: 'challenge-response: the webauthn handshake',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      const x0 = Math.max(1, Math.floor((W - 56) / 2));
      box(surface, x0, 5, 11, 3, STRUCT);
      borderLabel(surface, x0 + 2, 6, ' device ', TEXT, PANE_BG);
      box(surface, x0 + 45, 5, 11, 3, STRUCT);
      borderLabel(surface, x0 + 47, 6, ' service ', TEXT, PANE_BG);
      // The wire.
      hlineTo(surface, x0 + 11, x0 + 44, 6, DIMMER, 1);
      // challenge → then ← response, one message crossing per phase.
      if (t < DUR / 2) {
        const frac = t / (DUR / 2);
        const x = Math.min(x0 + 33, x0 + 12 + Math.floor(frac * 22));
        str(surface, x, 4, 'challenge >', YELLOW);
      } else {
        const frac = (t - DUR / 2) / (DUR / 2);
        const x = Math.max(x0 + 13, x0 + 34 - Math.floor(frac * 22));
        str(surface, x - 9, 8, '< response', GREEN);
      }
      if (p > 0.8) strC(surface, 12, 'webauthn · zero trust', TEXT);
    },
  };
}

/* ---- 4/5 · REVOCATION (2.5s): a device is cut; the ring stays intact ---- */
function revocation(): StoryBeat {
  const DUR = 2.5;
  const NODES = 8;
  return {
    label: 'REVOCATION',
    caption: 'a device is cut from the ring — the ring stays intact',
    dur: DUR,
    draw(surface, _ctx, p, _rng) {
      const W = surface.cols;
      const t = p * DUR;
      // A ring of devices as a row of nodes plus '=' spokes.
      const x0 = Math.max(1, Math.floor((W - (NODES * 6 - 1)) / 2));
      const bad = 3;
      for (let k = 0; k < NODES; k++) {
        const x = x0 + k * 6;
        const revoked = t > 0.4 && k === bad;
        if (revoked) {
          // Cut: the node flips to x and the links around it drop.
          str(surface, x, 8, 'x', RED);
          if (t > 0.9) {
            // The spokes heal around the gap: neighbours link directly.
            hlineTo(surface, x0 + (bad - 1) * 6, x0 + bad * 6 + 3, 8, DIMMER, 1);
            hlineTo(surface, x0 + bad * 6 + 6 - 4, x0 + (bad + 1) * 6 - 1, 8, DIMMER, 1);
          }
          continue;
        }
        surface.set(x, 8, 'o', GREEN);
        if (k < NODES - 1) hlineTo(surface, x, x + 5, 8, DIMMER, t > 0.2 ? 1 : clamp01(t * 5));
      }
      if (p > 0.6) strC(surface, 11, 'device revoked · ring intact', TEXT);
    },
  };
}

/* ---- 5/5 · EARLY ACCESS (2s): the beta counter + webauthn chip ---- */
function earlyAccess(): StoryBeat {
  const DUR = 2;
  return {
    label: 'EARLY ACCESS',
    caption: 'moved into early access with about 10 beta users',
    dur: DUR,
    // Draws whole at any p (hold; the story ends paused here).
    draw(surface, _ctx, _p, _rng) {
      const W = surface.cols;
      strC(surface, 5, 'early access', YELLOW);
      const w = 21;
      const x0 = Math.max(1, Math.floor((W - w) / 2));
      box(surface, x0, 7, w, 3, STRUCT);
      strC(surface, 8, '~10 beta users', GREEN, PANE_BG);
      strC(surface, 11, 'webauthn · rust · axum · redis', TEXT);
      strC(surface, 13, 'no passwords to steal', TEXT);
    },
  };
}

/** The Crypton story: exactly the five beats from the Task 15 brief. */
export default function makeStoryData(_rng?: RngFactory): StoryData {
  return {
    beats: [weakestLink(), bindToDevices(), challengeResponse(), revocation(), earlyAccess()],
    layman: 'Sign in with your devices instead of passwords — nothing to remember, nothing to steal.',
  };
}