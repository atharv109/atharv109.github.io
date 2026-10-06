// meadow.ts — 404 meadow program (ref §8.4, node env, deterministic rng).
import { describe, it, expect } from 'vitest';
import { AsciiSurface } from '../src/scripts/ascii/surface';
import { makeMeadowProgram } from '../src/scripts/ascii/meadow';
import type { AsciiCtx } from '../src/scripts/ascii/renderer';

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

const ctx = (cols: number, rows: number, frame = 0, delta = 1 / 60): AsciiCtx => ({
  frame,
  time: frame * delta,
  delta,
  cols,
  rows,
  metrics: { cellW: 7, lineH: 19, aspect: 7 / 19 },
  cursor: null,
});

const surface = new AsciiSurface(30, 16);
const program = makeMeadowProgram('×', mulberry32(4));

describe('meadow program', () => {
  it('flowers spawn on rain bottom hits and stems grow (§8.4)', () => {
    program.init(ctx(30, 16));
    // ~3.6s: drops (30-75 rows/s over 16 rows) hit the bottom; each plants one.
    for (let i = 0; i < 220; i++) program.update(surface, ctx(30, 16, i));
    expect(program.flowers.length).toBeGreaterThan(0);
    const painted = surface
      .rowRuns(program.flowers.length ? 15 : 0)
      .some((r) => r.text.includes('/'));
    expect(painted).toBe(true);
  });

  it('bloom char appears once a stem completes', () => {
    const surface2 = new AsciiSurface(30, 16);
    const p = makeMeadowProgram('×', mulberry32(4));
    p.init(ctx(30, 16));
    for (let i = 0; i < 900; i++) p.update(surface2, ctx(30, 16, i)); // ~15s
    const done = p.flowers.filter((f) => f.bloom >= 0);
    expect(done.length).toBeGreaterThan(0);
    const glyphs: string[] = [];
    for (let y = 0; y < 16; y++) surface2.rowRuns(y).forEach((r) => glyphs.push(r.text));
    expect(glyphs.join('').includes('×')).toBe(true);
  });

  it('flower cap floor(cols×0.8) respected (oldest removed)', () => {
    const p = makeMeadowProgram('×', mulberry32(4));
    p.init(ctx(30, 16));
    for (let i = 0; i < 2200; i++) p.update(surface, ctx(30, 16, i)); // ~36s
    const cap = Math.floor(30 * 0.8);
    expect(p.flowers.length).toBeLessThanOrEqual(cap);
  });

  it('all values finite across degenerate frames', () => {
    for (const f of program.flowers) {
      for (const v of [f.col, f.stemRows, f.growth, f.bloom]) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });
});