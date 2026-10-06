import { describe, it, expect } from 'vitest';
import { AsciiSurface } from '../src/scripts/ascii/surface';
import { mulberry32 } from '../src/scripts/ascii/story';
import type { AsciiCtx } from '../src/scripts/ascii/renderer';
import makeStoryData from '../src/scripts/stories/eleventh-round';

// Task 15: the eleventh-round story data facts/schedule test. Same node
// conventions as story.test.ts: hand-rolled AsciiCtx, flat surface reads.

const ctxFor = (cols = 60, rows = 12, delta = 1 / 60): AsciiCtx => ({
  frame: 0,
  time: 0,
  delta,
  cols,
  rows,
  metrics: { cellW: 7, lineH: 19, aspect: 7 / 19 },
  cursor: null,
});

const surfaceText = (s: AsciiSurface): string =>
  Array.from({ length: s.rows }, (_, y) => s.rowRuns(y).map((r) => r.text).join('')).join('\n');

const filledCells = (s: AsciiSurface): number => {
  let n = 0;
  for (let y = 0; y < s.rows; y++)
    for (let x = 0; x < s.cols; x++) if (s.get(x, y).char !== ' ') n++;
  return n;
};

describe('eleventh-round story data', () => {
  const data = makeStoryData();

  it('is the five canonical beats totalling 12.5s', () => {
    expect(data.beats.map((b) => b.label)).toEqual([
      'THREE TRIBES',
      'THE RING',
      'DASHBOARDS',
      'BEYOND VIDEO',
      'SHIPPED CLIENT PRODUCT',
    ]);
    expect(data.beats.reduce((a, b) => a + b.dur, 0)).toBe(12.5);
  });

  it('keeps the fact phrase in each caption', () => {
    const caps = data.beats.map((b) => b.caption);
    expect(caps[0]).toContain('no single platform');
    expect(caps[1]).toContain('ring assembles');
    expect(caps[2]).toContain('role dashboards');
    expect(caps[2]).toContain('fighter · manager · admin');
    expect(caps[3]).toContain('SponsorForge');
    expect(caps[4]).toContain('paid Buildora client product');
  });

  it('renders the committed facts in the scenes', () => {
    const at = (i: number, p: number): string => {
      const surface = new AsciiSurface(100, 21);
      data.beats[i].draw(surface, ctxFor(100, 21), p, mulberry32(77 + 1000 * (i + 1)));
      return surfaceText(surface);
    };
    const tribes = at(0, 1);
    expect(tribes).toContain('ATHLETES');
    expect(tribes).toContain('MANAGERS');
    expect(tribes).toContain('PROMOTERS');

    const ring = at(1, 1);
    expect(ring).toContain('A');
    expect(ring).toContain('M');
    expect(ring).toContain('P');
    expect(ring).toContain('readiness · pipeline · obligations');

    const dash = at(2, 1);
    expect(dash).toContain('FIGHTER');
    expect(dash).toContain('MANAGER');
    expect(dash).toContain('ADMIN');
    expect(dash).toContain('readiness');
    expect(dash).toContain('obligations');
    expect(dash).toContain('roster');
    expect(dash).toContain('SponsorForge');
    expect(dash).toContain('mentors');

    const beyond = at(3, 1);
    expect(beyond).toContain('podcasts');
    expect(beyond).toContain('apparel');
    expect(beyond).toContain('SponsorForge');
    expect(beyond).toContain('education');
    expect(beyond).toContain('careers · content · commerce');

    const shipped = at(4, 1);
    expect(shipped).toContain('Buildora');
    expect(shipped).toContain('eleventh-rnd.com');
    expect(shipped).toContain('react · express · supabase realtime');
  });

  it('clusters converge into columns: RING beat draws the ring late, columns settled', () => {
    const early = new AsciiSurface(100, 21);
    data.beats[1].draw(early, ctxFor(100, 21), 0.15, mulberry32(9));
    const late = new AsciiSurface(100, 21);
    data.beats[1].draw(late, ctxFor(100, 21), 0.9, mulberry32(9));
    // The ring pane assembles progressively; late frame is denser.
    expect(filledCells(late)).toBeGreaterThan(filledCells(early));
    // The converged column heads land inside the ring span (label in the top
    // border row, y=3).
    const lateTop = surfaceText(late).split('\n')[3];
    expect(lateTop).toContain('the ring');
  });

  it('dashboards + beyond-video fill progressively', () => {
    for (const i of [2, 3]) {
      const beat = data.beats[i];
      const early = new AsciiSurface(100, 21);
      beat.draw(early, ctxFor(100, 21), 0.2, mulberry32(9));
      const late = new AsciiSurface(100, 21);
      beat.draw(late, ctxFor(100, 21), 0.85, mulberry32(9));
      expect(filledCells(late)).toBeGreaterThan(filledCells(early));
    }
  });

  it('carries the layman one-liner rendered under the player', () => {
    expect(typeof data.layman).toBe('string');
    expect(data.layman!.length).toBeGreaterThan(20);
    expect(data.layman).toContain('fighters');
  });

  it('no NaN/undefined/Infinity text at any p edge', () => {
    data.beats.forEach((beat, i) => {
      for (const p of [0, 1e-6, 0.5, 1 - 1e-6, 1]) {
        const surface = new AsciiSurface(100, 21);
        beat.draw(surface, ctxFor(100, 21), p, mulberry32(77 + 1000 * (i + 1)));
        expect(surfaceText(surface), `beat ${beat.label} p=${p}`).not.toMatch(
          /NaN|undefined|Infinity/,
        );
      }
    });
  });

  it('deterministic: two engines on the data render identical frames', () => {
    const b1 = makeStoryData().beats;
    const b2 = makeStoryData().beats;
    for (let i = 0; i < b1.length; i++) {
      const a = new AsciiSurface(100, 21);
      const c = new AsciiSurface(100, 21);
      b1[i].draw(a, ctxFor(100, 21), 0.62, mulberry32(31));
      b2[i].draw(c, ctxFor(100, 21), 0.62, mulberry32(31));
      expect(surfaceText(a)).toBe(surfaceText(c));
    }
  });
});