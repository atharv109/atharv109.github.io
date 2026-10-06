import { describe, it, expect } from 'vitest';
import { AsciiSurface } from '../src/scripts/ascii/surface';
import { mulberry32 } from '../src/scripts/ascii/story';
import type { AsciiCtx } from '../src/scripts/ascii/renderer';
import makeStoryData from '../src/scripts/stories/prompt-optimiser';

// Task 15: prompt-optimiser story facts/schedule test (node conventions).

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

describe('prompt-optimiser story data', () => {
  const data = makeStoryData();

  it('is the five canonical beats totalling 12.5s', () => {
    expect(data.beats.map((b) => b.label)).toEqual([
      'THE RITUAL',
      'THE BUTTON',
      'SIX STAGES',
      'THE DIFFERENCE',
      'OPEN SOURCE',
    ]);
    expect(data.beats.reduce((a, b) => a + b.dur, 0)).toBe(12.5);
  });

  it('keeps the committed-fact phrases in the captions', () => {
    const caps = data.beats.map((b) => b.caption);
    expect(caps[0]).toContain('three chats');
    expect(caps[2]).toContain('groq');
    expect(caps[4]).toContain('open source');
  });

  it('renders the committed facts in the scenes', () => {
    const at = (i: number, p: number): string => {
      const surface = new AsciiSurface(100, 21);
      data.beats[i].draw(surface, ctxFor(100, 21), p, mulberry32(77 + 1000 * (i + 1)));
      return surfaceText(surface);
    };
    expect(at(0, 1)).toContain('CHATGPT');
    expect(at(0, 1)).toContain('CLAUDE');
    expect(at(0, 1)).toContain('GEMINI');
    expect(at(1, 1)).toContain('Optimize');
    expect(at(2, 1)).toContain('groq');
    expect(at(3, 1)).toContain('3 major ai interfaces');
    expect(at(4, 1)).toContain('github.com/atharv109/Chatgpt-prompt-optimiser');
  });

  it('carries the layman one-liner rendered under the player', () => {
    expect(typeof data.layman).toBe('string');
    expect(data.layman!.length).toBeGreaterThan(20);
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