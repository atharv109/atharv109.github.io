import { describe, it, expect } from 'vitest';
import { AsciiSurface } from '../src/scripts/ascii/surface';
import { makeBoids } from '../src/scripts/ascii/boids';
import type { AsciiCtx } from '../src/scripts/ascii/renderer';
import type { Boid } from '../src/scripts/ascii/boids';

// Plan Task 10 Step 1: the four flocking acceptance checks, deterministic via
// an injected mulberry32 rng (same convention as rain.test.ts).

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

/** Isotropic pairwise distance (x corrected by the cell aspect, as in boids.ts). */
const isoDist = (a: Boid, b: Boid): number =>
  Math.hypot((a.x - b.x) * (7 / 19), a.y - b.y);

function minPairwise(boids: Boid[]): number {
  let min = Infinity;
  for (let i = 0; i < boids.length; i++) {
    for (let j = i + 1; j < boids.length; j++) {
      const d = isoDist(boids[i], boids[j]);
      if (d < min) min = d;
    }
  }
  return min;
}

function meanAnchorDist(boids: Boid[], ax: number, ay: number): number {
  let sum = 0;
  for (const b of boids) sum += Math.hypot((b.x - ax) * (7 / 19), b.y - ay);
  return sum / boids.length;
}

describe('boids', () => {
  it('separation increases min pairwise distance vs a no-separation baseline', () => {
    const surface = new AsciiSurface(60, 30);
    const flock = makeBoids({ count: 10, rng: mulberry32(99) });
    const base = makeBoids({ count: 10, rng: mulberry32(99), separationWeight: 0 });
    // Identical start for both flocks: tight jitter cluster, targets on the
    // spot so roam contributes no force and only separation can move them.
    const cluster = (f: ReturnType<typeof makeBoids>) => {
      const r = mulberry32(9);
      for (const b of f.boids) {
        b.x = 25 + r();
        b.y = 12 + r() * 0.5;
        b.vx = 0;
        b.vy = 0;
        b.tx = b.x;
        b.ty = b.y;
      }
    };
    flock.seed(ctxFor(60, 30));
    base.seed(ctxFor(60, 30));
    cluster(flock);
    cluster(base);
    const before = minPairwise(flock.boids);
    const ctx = ctxFor(60, 30);
    for (let i = 0; i < 240; i++) {
      flock.update(surface, ctx);
      base.update(surface, ctx);
    }
    expect(minPairwise(flock.boids)).toBeGreaterThan(minPairwise(base.boids));
    expect(minPairwise(flock.boids)).toBeGreaterThan(before);
  });

  it('flee steering points away from the pointer within 7 cells', () => {
    const surface = new AsciiSurface(60, 30);
    const flock = makeBoids({ count: 2, rng: mulberry32(5) });
    flock.seed(ctxFor(60, 30));
    // Targets on the spot (roam force = 0) and 20 cells apart (no separation
    // inside the radius-4 neighbour field), so dv isolates the flee term.
    const [a, b] = flock.boids;
    a.x = 10; a.y = 5; a.vx = 0; a.vy = 0; a.tx = 10; a.ty = 5;
    b.x = 30; b.y = 5; b.vx = 0; b.vy = 0; b.tx = 30; b.ty = 5;
    flock.pointer = { x: 10.4, y: 5 }; // close to `a`, far from `b`
    const beforeA = { x: a.vx, y: a.vy };
    const beforeB = { x: b.vx, y: b.vy };
    flock.update(surface, ctxFor(60, 30));
    // dv ∝ away from pointer → dot((pos − pointer), dv) > 0
    const dvA = { x: a.vx - beforeA.x, y: a.vy - beforeA.y };
    expect(dvA.x * (a.x - flock.pointer!.x)).toBeGreaterThan(0);
    // Beyond the flee radius steering is unchanged (nothing else acts).
    expect(b.vx - beforeB.x).toBe(0);
    expect(b.vy - beforeB.y).toBe(0);
  });

  it('gather moves the mean position toward the anchor within T frames', () => {
    const surface = new AsciiSurface(60, 30);
    const flock = makeBoids({ count: 8, rng: mulberry32(3) });
    flock.seed(ctxFor(60, 30));
    const r = mulberry32(11);
    for (const b of flock.boids) {
      b.x = 20 + r() * 3;
      b.y = 6 + r() * 2;
      b.vx = 0;
      b.vy = 0;
      b.tx = b.x;
      b.ty = b.y;
    }
    const initial = meanAnchorDist(flock.boids, 45, 22);
    flock.anchor = { x: 45, y: 22 };
    flock.gather = true;
    const ctx = ctxFor(60, 30);
    for (let i = 0; i < 600; i++) flock.update(surface, ctx); // 10 s of frames
    const final = meanAnchorDist(flock.boids, 45, 22);
    expect(final).toBeLessThan(initial / 2);
  });

  it('no NaN at zero distance', () => {
    const surface = new AsciiSurface(60, 30);
    const flock = makeBoids({ count: 6, rng: mulberry32(1) });
    flock.seed(ctxFor(60, 30));
    // Every boid exactly on every other one, on the pointer, and on the
    // gather anchor — maximum degeneracy for every distance division.
    for (const b of flock.boids) {
      b.x = 30; b.y = 15; b.vx = 0; b.vy = 0; b.tx = 30; b.ty = 15;
    }
    flock.pointer = { x: 30, y: 15 };
    flock.anchor = { x: 30, y: 15 };
    flock.gather = true;
    const ctx = ctxFor(60, 30);
    for (let i = 0; i < 60; i++) flock.update(surface, ctx);
    for (const b of flock.boids) {
      for (const v of [b.x, b.y, b.vx, b.vy, b.tx, b.ty]) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
    expect(Number.isFinite(flock.glow)).toBe(true);
  });
});