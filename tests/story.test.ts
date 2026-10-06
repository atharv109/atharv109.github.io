import { describe, it, expect } from 'vitest';
import { AsciiSurface } from '../src/scripts/ascii/surface';
import { makeStory, mulberry32, type RngFactory, type StoryBeat } from '../src/scripts/ascii/story';
import type { AsciiCtx } from '../src/scripts/ascii/renderer';
import makeStoryData from '../src/scripts/stories/vulnswarm-vex';

// Task 14: the story engine schedules a beat timeline on the T7 AsciiRenderer.
// Same node/DOM-free conventions as rain/boids tests: injected mulberry32, a
// hand-rolled AsciiCtx, and a flat surface to read drawn runs back from.

const ctxFor = (cols = 60, rows = 12, delta = 1 / 60): AsciiCtx => ({
  frame: 0,
  time: 0,
  delta,
  cols,
  rows,
  metrics: { cellW: 7, lineH: 19, aspect: 7 / 19 },
  cursor: null,
});

interface Draw {
  label: string;
  p: number;
  rngIsFn: boolean;
  rngValues: number[];
}

const beatOf = (label: string, dur: number, log: Draw[]): StoryBeat => ({
  label,
  caption: `${label} caption`,
  dur,
  draw: (surface, _ctx, p, rng) => {
    log.push({ label, p, rngIsFn: typeof rng === 'function', rngValues: [rng(), rng()] });
    surface.set(0, 0, 'X'); // a mark the next beat's blank frame must clear
  },
});

const surfaceText = (s: AsciiSurface): string =>
  Array.from({ length: s.rows }, (_, y) => s.rowRuns(y).map((r) => r.text).join('')).join('\n');

const filledCells = (s: AsciiSurface): number => {
  let n = 0;
  for (let y = 0; y < s.rows; y++)
    for (let x = 0; x < s.cols; x++) if (s.get(x, y).char !== ' ') n++;
  return n;
};

describe('story engine', () => {
  it('auto-advances beats at the right global times', () => {
    const log: Draw[] = [];
    const story = makeStory([beatOf('a', 1, log), beatOf('b', 2, log), beatOf('c', 3, log)]);
    const surface = new AsciiSurface(40, 12);
    const frame = (d = 0.5) => story.update(surface, ctxFor(40, 12, d));

    frame(); // 0.5s
    expect(story.beatIndex).toBe(0);
    expect(story.time).toBe(0.5);
    frame(); // 1.0s — the boundary belongs to the next beat
    expect(story.beatIndex).toBe(1);
    frame(); // 1.5s
    frame(); // 2.0s
    expect(story.beatIndex).toBe(1); // still inside the 2s beat
    frame(); // 2.5s
    expect(story.beatIndex).toBe(1);
    frame(); // 3.0s
    expect(story.beatIndex).toBe(2);
    expect(story.time).toBe(3);
  });

  it('reaches the end and holds paused at p=1', () => {
    const log: Draw[] = [];
    const story = makeStory([beatOf('a', 1, log), beatOf('b', 2, log), beatOf('c', 3, log)]);
    const surface = new AsciiSurface(40, 12);
    for (let k = 0; k < 12; k++) story.update(surface, ctxFor(40, 12, 0.5));
    expect(story.time).toBe(6);
    expect(story.playing).toBe(false); // ends paused (brief: replay on click)
    expect(story.finished).toBe(true);
    expect(story.beatIndex).toBe(2);
    expect(story.beatP).toBe(1);
    // Further frames must not throw or advance.
    expect(() => story.update(surface, ctxFor(40, 12, 0.5))).not.toThrow();
    expect(story.time).toBe(6);
  });

  it('speed option scales playback (reader-friendly pacing)', () => {
    const log: Draw[] = [];
    const story = makeStory([beatOf('a', 1, log), beatOf('b', 1, log)], { speed: 0.5 });
    const surface = new AsciiSurface(40, 12);
    story.update(surface, ctxFor(40, 12, 1));
    expect(story.time).toBe(0.5);
    expect(story.beatIndex).toBe(0);
    story.update(surface, ctxFor(40, 12, 1));
    expect(story.time).toBe(1);
    expect(story.beatIndex).toBe(1); // the boundary belongs to the next beat
    story.update(surface, ctxFor(40, 12, 1));
    expect(story.time).toBe(1.5);
    expect(story.beatIndex).toBe(1);
    // Scrub stays absolute (unaffected by speed).
    story.seek(1.6);
    expect(story.time).toBe(1.6);
  });

  it('seek clamps into [0, total]; scrubbing back un-finishes', () => {
    const log: Draw[] = [];
    const story = makeStory([beatOf('a', 1, log), beatOf('b', 2, log), beatOf('c', 3, log)]);
    story.seek(-2);
    expect(story.time).toBe(0);
    story.seek(999);
    expect(story.time).toBe(6);
    expect(story.finished).toBe(true);
    expect(story.playing).toBe(false);
    story.toggle(); // play at the end → replay from zero
    expect(story.time).toBe(0);
    expect(story.playing).toBe(true);
    expect(story.finished).toBe(false);
    story.seek(2.99);
    expect(story.beatIndex).toBe(1);
    expect(story.beatP).toBeCloseTo(0.995, 3);
  });

  it('seekToBeat clamps to the beat range', () => {
    const log: Draw[] = [];
    const story = makeStory([beatOf('a', 1, log), beatOf('b', 2, log), beatOf('c', 3, log)]);
    story.pause();
    story.seekToBeat(-3);
    expect(story.beatIndex).toBe(0);
    expect(story.time).toBe(0);
    story.seekToBeat(99);
    expect(story.beatIndex).toBe(2);
    expect(story.time).toBe(3); // start of the last beat
  });

  it('onBeatChange fires once on registration and on every change', () => {
    const log: Draw[] = [];
    const story = makeStory([beatOf('a', 1, log), beatOf('b', 2, log), beatOf('c', 3, log)]);
    const seen: number[] = [];
    story.onBeatChange((i) => seen.push(i));
    expect(seen).toEqual([0]); // immediate init so the DOM can sync from SSR
    const surface = new AsciiSurface(40, 12);
    story.update(surface, ctxFor(40, 12, 1.5));
    expect(seen).toEqual([0, 1]);
    story.seek(5.5);
    expect(seen).toEqual([0, 1, 2]);
    // Staying inside one beat fires nothing.
    story.update(surface, ctxFor(40, 12, 0.1));
    expect(seen).toEqual([0, 1, 2]);
  });

  it('pure draw fns receive the right p and a callable rng', () => {
    const log: Draw[] = [];
    const story = makeStory([beatOf('a', 1, log), beatOf('b', 2, log), beatOf('c', 3, log)]);
    const surface = new AsciiSurface(40, 12);
    story.seek(0);
    story.update(surface, ctxFor(40, 12));
    expect(log[0].p).toBe(0);
    story.seek(0.5);
    story.update(surface, ctxFor(40, 12));
    expect(log[1].p).toBeCloseTo(0.5, 6);
    story.seek(4);
    story.update(surface, ctxFor(40, 12));
    expect(log[2].label).toBe('c');
    expect(log[2].p).toBeCloseTo(1 / 3, 6);
    story.seek(6);
    story.update(surface, ctxFor(40, 12));
    expect(log[3].p).toBe(1);
    for (const d of log) expect(d.rngIsFn).toBe(true);
    // No NaN anywhere along the timeline (p edges hit while scrubbing).
    for (let t = 0; t <= 6.001; t += 0.13) {
      story.seek(t);
      story.update(surface, ctxFor(40, 12));
      for (const v of [story.time, story.beatP]) expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('each frame clears the previous beat off the surface', () => {
    const story: Story = makeStory([
      { label: 'a', caption: 'a', dur: 1, draw: (s) => s.set(0, 0, 'X') },
      { label: 'b', caption: 'b', dur: 2, draw: () => {} },
      { label: 'c', caption: 'c', dur: 3, draw: () => {} },
    ]);
    const surface = new AsciiSurface(40, 12);
    story.update(surface, ctxFor(40, 12, 0.5)); // beat a draws its mark
    expect(surface.get(0, 0).char).toBe('X');
    story.update(surface, ctxFor(40, 12, 1)); // t = 1.5 → beat b (draws nothing)
    expect(surface.get(0, 0).char).toBe(' ');
  });

  it('scenes get a fresh per-beat rng: constant seed within a beat, distinct across beats', () => {
    const calls: number[] = [];
    const factory: RngFactory = (seed) => {
      calls.push(seed);
      return mulberry32(seed);
    };
    const log: Draw[] = [];
    const story = makeStory([beatOf('a', 1, log), beatOf('b', 2, log)], { rng: factory });
    const surface = new AsciiSurface(40, 12);
    story.update(surface, ctxFor(40, 12));
    story.update(surface, ctxFor(40, 12));
    // Same seed both frames of beat 0 → scrub-reproducible noise.
    expect(calls.length).toBe(2);
    expect(calls[0]).toBe(calls[1]);
    expect(log[0].rngValues).toEqual(log[1].rngValues);
    story.seekToBeat(1);
    story.update(surface, ctxFor(40, 12));
    expect(calls[2]).not.toBe(calls[0]);
  });

  it('two engines on the real data render identical frames at identical seeks', () => {
    const s1 = makeStory(makeStoryData().beats);
    const s2 = makeStory(makeStoryData().beats);
    const a = new AsciiSurface(100, 21);
    const b = new AsciiSurface(100, 21);
    for (const t of [0.5, 2.1, 4.0, 9.7, 14.5, 16.49]) {
      s1.seek(t);
      s1.update(a, ctxFor(100, 21));
      s2.seek(t);
      s2.update(b, ctxFor(100, 21));
      expect(surfaceText(a)).toBe(surfaceText(b));
    }
  });
});

describe('vulnswarm-vex story data', () => {
  const data = makeStoryData();

  it('is the six canonical VulnSwarm beats totalling 16.5s', () => {
    expect(data.beats.map((b) => b.label)).toEqual([
      'THE FLOOD',
      'THE FALSE SOLVE',
      'THE EVIDENCE',
      'Z3 DECIDES',
      'THE PROOF',
      'SHIPPED',
    ]);
    expect(data.beats.reduce((a, b) => a + b.dur, 0)).toBe(16.5);
  });

  it('keeps the mandated caption phrases', () => {
    expect(data.beats[1].caption).toContain('confidence: vibes');
    expect(data.beats[3].caption).toContain('verdicts = theorems');
    expect(data.beats[5].caption).toContain('paper under review');
  });

  it('renders the committed facts in the scenes', () => {
    const at = (i: number, p: number): string => {
      const surface = new AsciiSurface(100, 21);
      data.beats[i].draw(surface, ctxFor(100, 21), p, mulberry32(77 + 1000 * (i + 1)));
      return surfaceText(surface);
    };
    const flood = at(0, 1);
    expect(flood).toContain('4,102 advisories');
    expect(flood).toContain('95.1%');

    const proof = at(4, 1);
    expect(proof).toContain('91.7%');
    expect(proof).toContain('14 benchmark apps');
    expect(proof).toContain('2,705 hydration queries');
    expect(proof).toContain('181 holdout findings');
    expect(proof).toContain('9/13 decisive predictions');

    const shipped = at(5, 1);
    expect(shipped).toContain('affected · not_affected · manual_review');
    expect(shipped).toContain('paper under review');
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

  it('evidence + proof fill progressively (fewer cells early, more late)', () => {
    for (const i of [2, 4]) {
      const beat = data.beats[i];
      const early = new AsciiSurface(100, 21);
      beat.draw(early, ctxFor(100, 21), 0.2, mulberry32(9));
      const late = new AsciiSurface(100, 21);
      beat.draw(late, ctxFor(100, 21), 0.85, mulberry32(9));
      expect(filledCells(late)).toBeGreaterThan(filledCells(early));
    }
  });
});