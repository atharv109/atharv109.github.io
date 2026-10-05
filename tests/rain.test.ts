import { describe, it, expect } from 'vitest';
import { AsciiSurface } from '../src/scripts/ascii/surface';
import { makeRain } from '../src/scripts/ascii/rain';
import type { AsciiCtx } from '../src/scripts/ascii/renderer';

// Deterministic RNG (mulberry32) for reproducible drops.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ctxFor = (cols: number, rows: number, delta = 1 / 60): AsciiCtx => ({
  frame: 0,
  time: 0,
  delta,
  cols,
  rows,
  metrics: { cellW: 7, lineH: 19, aspect: 7 / 19 },
  cursor: null,
});

const OPTS = { density: 0.2, minLen: 2, maxLen: 4, minSpeed: 30, maxSpeed: 75, color: '#4a585c' };

describe('rain', () => {
  it('maintains floor(cols*density) drops', () => {
    const surface = new AsciiSurface(40, 20);
    const rain = makeRain({ ...OPTS, rng: mulberry32(42) });
    const ctx = ctxFor(40, 20);
    for (let i = 0; i < 60; i++) rain.update(surface, ctx);
    const expectCount = Math.floor(40 * 0.2);
    // Dead drops are topped up every frame, so the count is exact.
    expect(rain.drops.length).toBe(expectCount);
  });

  it('drop dies after tail passes bottom and onBottomHit fires with column', () => {
    const surface = new AsciiSurface(10, 6);
    const hits: number[] = [];
    const rain = makeRain({
      ...OPTS,
      density: 0,
      rng: mulberry32(7),
      onBottomHit: (x) => hits.push(x),
    });
    rain.spawn(3, -1, { speed: 200, length: 2 });
    const ctx = ctxFor(10, 6, 0.1);
    let guard = 0;
    while (rain.drops.length && guard++ < 100) rain.update(surface, ctx);
    expect(hits).toEqual([3]);
    expect(rain.drops.length).toBe(0); // density 0 → no top-up
  });

  it('out-of-range columns never write (surface stays clean)', () => {
    const surface = new AsciiSurface(8, 8);
    const rain = makeRain({ ...OPTS, density: 0, rng: mulberry32(1) });
    rain.spawn(8, 0); // x == cols: out of range
    rain.spawn(-1, 0);
    const ctx = ctxFor(8, 8);
    expect(() => rain.update(surface, ctx)).not.toThrow();
    expect(surface.dirtyRows()).toEqual([]);
  });
});
