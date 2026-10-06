// story.ts — the visual story player engine (Task 14): a timeline of StoryBeats
// driven on the T7 AsciiRenderer as a DOM-free AsciiProgram, so the whole core
// unit-tests under node. Each frame the engine advances a global clock
// (auto-advance), clears the surface and calls the current beat's pure
// `draw(surface, ctx, p, rng)`; `p` is beat-local 0..1 progress and scenes
// repaint from scratch every frame, so any seek reproduces the exact frame
// (scrubbing is deterministic, not simulated). Per call the engine passes a
// FRESH generator seeded per beat (opts.rng factory, default mulberry32):
// scene noise constants stay stable across frames while positions advance
// with p. DOM side (pane, chip, captions, scrub keys, autoplay) is
// story-block.ts; scene data per project lives in src/scripts/stories/.

import type { AsciiCtx, AsciiProgram } from './renderer';
import type { AsciiSurface } from './surface';

export type Rng = () => number;
export type RngFactory = (seed: number) => Rng;

/** Standard mulberry32 — the engine's default seed factory and the convention
    every story test file uses (import it instead of re-copying). */
export function mulberry32(seed: number): Rng {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface StoryBeat {
  label: string;
  caption: string;
  dur: number; // seconds
  draw(surface: AsciiSurface, ctx: AsciiCtx, p: number, rng: Rng): void;
}

export interface StoryData {
  beats: StoryBeat[];
}

export interface StoryOptions {
  /** Seed factory for the per-draw-call generators. Default mulberry32. */
  rng?: RngFactory;
}

export interface Story extends AsciiProgram {
  readonly beats: readonly StoryBeat[];
  readonly total: number;
  readonly time: number; // global clock 0..total (clamped)
  readonly beatIndex: number;
  readonly beatP: number; // progress within the current beat, 0..1
  readonly playing: boolean;
  readonly finished: boolean;
  play(): void;
  pause(): void;
  toggle(): void;
  replay(): void;
  seek(t: number): void; // clamps into [0, total]
  seekToBeat(i: number): void; // clamps into the beat range, lands at its start
  onBeatChange(cb: (i: number) => void): void; // immediate init + on every change
  onStateChange(cb: () => void): void; // playing/finished transitions (UI chip state)
}

const SEED_BASE = 0x1505;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export function makeStory(beats: StoryBeat[], opts: StoryOptions = {}): Story {
  const starts: number[] = [];
  let total = 0;
  for (const b of beats) {
    starts.push(total);
    total += Math.max(0, b.dur);
  }
  const last = beats.length - 1;

  let time = 0;
  let playing = true; // auto-advance is the engine's mode; the DOM gate (T6:
  // wave clear + viewport) controls when the renderer actually starts
  let finished = false;
  let beatIdx = 0;
  const beatCbs: ((i: number) => void)[] = [];
  const stateCbs: (() => void)[] = [];
  const fireBeat = (i: number) => {
    beatIdx = i;
    for (const cb of beatCbs) cb(i);
  };
  const fireState = () => {
    for (const cb of stateCbs) cb();
  };
  const setPlaying = (v: boolean) => {
    if (playing !== v) {
      playing = v;
      fireState();
    }
  };

  function beatAt(t: number): number {
    let i = 0;
    while (i < last && t >= starts[i + 1]) i++;
    return i;
  }

  /** Beat-local progress; zero-duration beats clamp to 1 (no 0/0 NaN). */
  function beatP(i: number, t: number): number {
    const d = beats[i]?.dur ?? 0;
    return d > 0 ? clamp01((t - starts[i]) / d) : 1;
  }

  function play() {
    if (finished) return replay();
    if (playing || !beats.length) return;
    setPlaying(true);
  }

  function pause() {
    setPlaying(false);
  }

  function replay() {
    time = 0;
    finished = false;
    setPlaying(true);
    if (beatIdx !== 0) fireBeat(0);
  }

  function seek(t: number) {
    time = Math.min(total, Math.max(0, t));
    // A scrub always pauses; reaching the end finishes (end holds, no loop).
    const atEnd = beats.length > 0 && time >= total && total > 0;
    if (finished !== atEnd) {
      finished = atEnd;
      fireState();
    } else {
      finished = atEnd;
    }
    setPlaying(false);
    const i = beatAt(time);
    if (i !== beatIdx) fireBeat(i);
    else fireState(); // scrub within one beat still updates the chip state
  }

  const story: Story = {
    beats,
    get total() {
      return total;
    },
    get time() {
      return time;
    },
    get beatIndex() {
      return beatIdx;
    },
    get beatP() {
      return beatP(beatIdx, time);
    },
    get playing() {
      return playing;
    },
    get finished() {
      return finished;
    },
    play,
    pause,
    toggle() {
      if (playing) pause();
      else play(); // finished → replay
    },
    replay,
    seek,
    seekToBeat(i: number) {
      if (!beats.length) return;
      seek(starts[Math.min(last, Math.max(0, i))]);
    },
    onBeatChange(cb: (i: number) => void) {
      beatCbs.push(cb);
      cb(beatIdx); // immediate init: the DOM syncs without waiting a frame
    },
    onStateChange(cb: () => void) {
      stateCbs.push(cb);
      cb();
    },
    update(surface: AsciiSurface, ctx: AsciiCtx) {
      if (!beats.length) return;
      if (playing) {
        const wasAtEnd = time >= total;
        time = Math.min(total, time + Math.max(0, ctx.delta));
        if (!wasAtEnd && time >= total) {
          // End of the story: hold the last frame, mark finished (paused).
          playing = false;
          finished = true;
          fireState(); // the beat index is already the last one; state flips
        }
      }
      const i = beatAt(time);
      surface.clearAll();
      const rng = (opts.rng ?? mulberry32)(SEED_BASE + i * 1013);
      beats[i].draw(surface, ctx, beatP(i, time), rng);
      if (i !== beatIdx) fireBeat(i);
    },
  };

  return story;
}