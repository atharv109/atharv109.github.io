// rain.ts — falling '|' drops over the AsciiSurface (ref §8.2). DOM-free and
// deterministic (injectable rng) so it unit-tests under node. The home page
// (Task 8) layers the logo interaction on top via onCell; the meadow pages
// plant flowers via onBottomHit.

import type { AsciiProgram, AsciiCtx } from './renderer';
import type { AsciiSurface } from './surface';

export interface RainDrop {
  x: number; // column (int)
  y: number; // head row (float)
  length: number;
  speed: number; // rows per second
  color?: string;
  hitBottom: boolean;
}

export interface RainOptions {
  density: number; // drops per column target (home 0.2)
  minLen: number;
  maxLen: number;
  minSpeed: number;
  maxSpeed: number;
  color?: string;
  /** Solid background per rain cell (matches page bg; keeps text legible). */
  bg?: string;
  onBottomHit?: (x: number) => void;
  onCell?: (x: number, y: number, drop: RainDrop) => void;
  /** Sideways drift hook (home logo hatch, ref §8.3.2): returns a column
      delta to apply to the drop's head this frame, after the vertical move
      and before drawing (so erase stays aligned with last frame's x). */
  getDrift?: (drop: RainDrop) => number;
  rng?: () => number;
}

export interface Rain extends AsciiProgram {
  drops: RainDrop[];
  spawn(x?: number, y?: number, over?: { speed?: number; length?: number; color?: string }): void;
}

export function makeRain(opts: RainOptions): Rain {
  const rng = opts.rng ?? Math.random;
  const drops: RainDrop[] = [];

  const randLen = () => Math.round(opts.minLen + rng() * (opts.maxLen - opts.minLen));
  const randSpeed = () => opts.minSpeed + rng() * (opts.maxSpeed - opts.minSpeed);

  function spawn(x?: number, y?: number, over?: { speed?: number; length?: number; color?: string }) {
    drops.push({
      x: x ?? 0,
      y: y ?? 0,
      length: over?.length ?? randLen(),
      speed: over?.speed ?? randSpeed(),
      color: over?.color ?? opts.color,
      hitBottom: false,
    });
  }

  function update(surface: AsciiSurface, ctx: AsciiCtx): void {
    const { cols, rows, delta } = ctx;

    // Top up to the density target (spawn above the fold so trails fall in).
    const target = Math.floor(cols * opts.density);
    while (drops.length < target) {
      spawn(Math.floor(rng() * cols), -rng() * 10);
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      // Erase previous cells before moving (the surface has no per-frame clear).
      erase(surface, d);
      d.y += d.speed * delta;
      const drift = opts.getDrift?.(d) ?? 0;
      if (drift) d.x += drift;

      const head = Math.floor(d.y);
      if (!d.hitBottom && head >= rows - 1 && d.x >= 0 && d.x < cols) {
        d.hitBottom = true;
        opts.onBottomHit?.(d.x);
      }

      // Dead once the tail has passed the bottom row.
      if (d.y - d.length >= rows) {
        drops.splice(i, 1);
        continue;
      }

      draw(surface, d);
    }
  }

  function draw(surface: AsciiSurface, d: RainDrop): void {
    if (d.x < 0 || d.x >= surface.cols) return; // out-of-range drops write nothing
    const head = Math.floor(d.y);
    for (let k = 0; k < d.length; k++) {
      const y = head - k;
      if (y < 0 || y >= surface.rows) continue;
      opts.onCell?.(d.x, y, d);
      surface.set(d.x, y, '|', d.color, opts.bg);
    }
  }

  function erase(surface: AsciiSurface, d: RainDrop): void {
    if (d.x < 0 || d.x >= surface.cols) return;
    const head = Math.floor(d.y);
    for (let k = 0; k < d.length; k++) {
      const y = head - k;
      if (y < 0 || y >= surface.rows) continue;
      surface.set(d.x, y, ' ');
    }
  }

  return { drops, spawn, update };
}
