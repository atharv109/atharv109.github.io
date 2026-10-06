// meadow.ts — 404 meadow (ref §8.4, rain + flowers): rain drops hatch
// flowers at the bottom; each flower grows a stem then blooms `×`. Wind and
// heading reveal are 404-relevant only in the ref's field-study variants —
// descope note: the 404 mount runs rain+flowers; the travelling gust/wind
// bend and introReveal stay on the (unscheduled) field-study pages.
import { AsciiRenderer } from './renderer';
import type { AsciiProgram } from './renderer';
import { makeRain } from './rain';

// §8.4 exact numbers.
const DENSITY = 0.12;
const LEN: [number, number] = [1, 4];
const SPEED: [number, number] = [30, 75];
const FLOWER_CHANCE = 1;
const STEM_RATE = 7.5; // rows/s
const MAX_FLOWERS_MULTIPLIER = 0.8;
const FLOWER_COLORS = [
  'var(--color-green)',
  'var(--color-purple)',
  'var(--color-orange)',
  'var(--color-blue)',
  'var(--color-yellow)',
];

export function makeMeadowProgram(bloomChar = '×', rng: () => number = Math.random) {
  interface Flower {
    col: number;
    stemRows: number;
    growth: number; // rows grown so far
    bloom: number; // bloom radius growth
    colorIdx: number;
    color: string;
  }
  const flowers: Flower[] = [];
  let colorIdx = 0;
  let cols = 0;

  const rain = makeRain({
    density: DENSITY,
    minLen: LEN[0],
    maxLen: LEN[1],
    minSpeed: SPEED[0],
    maxSpeed: SPEED[1],
    color: 'var(--color-overlay1)',
    onBottomHit: (x: number) => {
      if (rng() >= FLOWER_CHANCE) return;
      // One flower per column; cap at floor(cols×0.8) (oldest removed).
      const cap = Math.max(1, Math.floor(cols * MAX_FLOWERS_MULTIPLIER));
      if (flowers.length >= cap) flowers.shift();
      flowers.push({
        col: x,
        stemRows: 2 + Math.floor(rng() ** 2.5 * 4),
        growth: 0,
        bloom: -1, // starts when the stem is done
        colorIdx,
        color: FLOWER_COLORS[colorIdx++ % FLOWER_COLORS.length],
      });
    },
  });

  const program: AsciiProgram & { flowers: Flower[]; rain: typeof rain } = {
    flowers,
    rain,
    init(ctx) {
      cols = ctx.cols;
    },
    update(surface, ctx) {
      rain.update(surface, ctx);
      const dt = ctx.delta;
      for (const f of flowers) {
        // Every stem cell persistently re-set each frame (after rain.update —
        // rain trails pass behind the flowers, not through them).
        const grown = f.growth < f.stemRows
          ? Math.min(f.stemRows, (f.growth += STEM_RATE * dt))
          : f.stemRows;
        for (let r = 0; r < Math.floor(grown); r++) {
          surface.set(f.col, ctx.rows - 1 - r, '/', f.color);
        }
        if (grown >= f.stemRows) {
          // Bloom "radius" grows at the stem's rate; single cell → appears
          // once radius ≥ 0.
          if (f.bloom < 0) f.bloom += STEM_RATE * dt;
          if (f.bloom >= 0) surface.set(f.col, ctx.rows - 2 - f.stemRows, bloomChar, f.color);
        }
      }
    },
  };
  return program;
}

export function startMeadow(container: HTMLElement, pointerTarget: HTMLElement): void {
  const program = makeMeadowProgram('×');
  const renderer = new AsciiRenderer(container, program);
  renderer.start({ fps: 0, pointerTarget });
}