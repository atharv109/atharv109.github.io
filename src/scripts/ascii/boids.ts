// boids.ts — the contact moth flock (ref §11). DOM-free and deterministic
// (injectable rng) so boids.test.ts runs under node; contact.ts owns the DOM
// side: anchor cell measurement, pointer target, and the label scramble.
//
// Units are grid cells; x distances are aspect-corrected (× cellW/lineH) so
// motion is isotropic: everything (distances, velocities, forces) lives in
// "row units" and converts by multiplying/dividing x accordingly. Steering
// contributions compose per ref §17.3 (arrive + weights) then clamp to the
// mode force budget. Colour strings are CSS var tokens resolved live by the
// renderer's insertRule class cache.

import type { AsciiCtx, AsciiProgram } from './renderer';
import type { AsciiSurface } from './surface';
import { arrive, limit, type Vec } from './steering';

export interface Boid {
  x: number; // display cell coords (float)
  y: number;
  vx: number; // display cells/s
  vy: number;
  tx: number; // private roam target (cells)
  ty: number;
  flapPhase: number; // flap counter; frame = floor(phase) % 2
  fleeing: boolean; // last-step mode flags (draw only)
  prev: [number, number][] | null; // previous sprite cells → glitch trail
}

export interface BoidsOptions {
  count: number; // 48 desktop / 24 ≤700px (caller decides)
  aspect?: number; // cellW/lineH; default: the ctx metrics
  maxSpeed?: number; // isotropic cells/s (ref: 32)
  maxForce?: number; // (ref: 45)
  separationWeight?: number; // 1.6
  separationRadius?: number; // 2
  neighborRadius?: number; // 4
  roamMargin?: number; // 2
  roamRadius?: number; // arrive radius 2
  rerollRadius?: number; // re-roll target when closer than 1.5
  getAnchor?: (ctx: AsciiCtx) => Vec | null; // anchor centre in cells (contact.ts)
  onTrailCell?: (x: number, y: number) => void; // new trail cell (label scramble)
  rng?: () => number;
}

export interface Boids extends AsciiProgram {
  boids: Boid[];
  /** Cursor in display cell coords (contact.ts feeds ctx.cursor). */
  pointer: Vec | null;
  /** Gather mode: boids arrive at `anchor`. */
  gather: boolean;
  anchor: Vec | null;
  /** Eased lamp-glow intensity 0..1 (ref §11). */
  glow: number;
  seed(ctx: AsciiCtx): void;
}

// Exact ref §11 numbers.
const FLAP = 8; // flaps/s at idle
const FLEE_RADIUS = 7;
const FLEE_WEIGHT = 16;
const FLEE_SPEED = 1.6;
const FLEE_FLAP = 1.8;
const GATHER_SPEED = 2.3; // speed ×2.3, force ×2.3, flap ×1.5, arriveRadius 4
const GATHER_FORCE = 2.3;
const GATHER_FLAP = 1.5;
const GATHER_ARRIVE = 4;
const ALIGN_WEIGHT = 1;
const COHESION_WEIGHT = 0.6;
const GLOW_RADIUS = 12; // cells
const GLOW_FALLOFF = 0.5;
const GLOW_EASE = 5; // 1 − exp(−5·dt)
const GLOW_BANDS = 4;
const PULSE_HZ = 0.3;
const PULSE_DEPTH = 0.15;
const TRAIL_TTL = 0.33; // s

const FIELD = 'var(--color-surface0)';
const IDLE = 'var(--color-overlay1)';
const TRAIL_COLOR = 'var(--color-overlay1)';
const GATHERED = [
  'var(--color-green)',
  'var(--color-yellow)',
  'var(--color-orange)',
  'var(--color-pink)',
  'var(--color-purple)',
  'var(--color-blue)',
  'var(--color-aqua)',
];
// surface0 → green over 4 bands (colour-mix resolves with the tokens).
const GLOW_BAND_COLORS = [
  FIELD,
  'color-mix(in srgb, var(--color-green) 33%, var(--color-surface0))',
  'color-mix(in srgb, var(--color-green) 67%, var(--color-surface0))',
  'var(--color-green)',
];
// 2×1 flap sprites — TWO characters each (ref §11: `/\` ⇄ `\/`).
const GLYPHS = ['/\\', '\\/'];
// Glitch trail + label scramble symbol set (ref §11).
const TRAIL_SYMBOLS = ['!', '@', '#', '$', '%', '&', '*', '?', '~', '<', '>', '|', '/'];

interface Trail {
  x: number;
  y: number;
  sym: string;
  until: number;
}

export function makeBoids(opts: BoidsOptions): Boids {
  const rng = opts.rng ?? Math.random;
  const maxSpeed = opts.maxSpeed ?? 32;
  const maxForce = opts.maxForce ?? 45;
  const sepWeight = opts.separationWeight ?? 1.6;
  const sepR = opts.separationRadius ?? 2;
  const neighR = opts.neighborRadius ?? 4;
  const margin = opts.roamMargin ?? 2;
  const roamR = opts.roamRadius ?? 2;
  const rerollR = opts.rerollRadius ?? 1.5;

  const boids: Boid[] = [];
  const trails = new Map<string, Trail>();
  let seeded = false;

  const flock: Boids = {
    boids,
    pointer: null,
    gather: false,
    anchor: null,
    glow: 0,
    seed,
    update,
  };

  function rollTarget(b: Boid, cols: number, rows: number): void {
    b.tx = margin + rng() * Math.max(1, cols - 2 * margin);
    b.ty = margin + rng() * Math.max(1, rows - 2 * margin);
  }

  function seed(ctx: AsciiCtx): void {
    boids.length = 0;
    trails.clear();
    for (let i = 0; i < opts.count; i++) {
      const b: Boid = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, flapPhase: rng() * FLAP, fleeing: false, prev: null };
      rollTarget(b, ctx.cols, ctx.rows);
      b.x = margin + rng() * Math.max(1, ctx.cols - 2 * margin);
      b.y = margin + rng() * Math.max(1, ctx.rows - 2 * margin);
      boids.push(b);
    }
    seeded = true;
  }

  function update(surface: AsciiSurface, ctx: AsciiCtx): void {
    if (!seeded) seed(ctx);
    if (opts.getAnchor) flock.anchor = opts.getAnchor(ctx);
    const aspect = opts.aspect ?? ctx.metrics.aspect;

    // Lamp glow eases toward 1 while gathering, back to 0 otherwise.
    const want = flock.gather && flock.anchor ? 1 : 0;
    flock.glow += (want - flock.glow) * (1 - Math.exp(-GLOW_EASE * ctx.delta));
    if (Math.abs(want - flock.glow) < 1e-4) flock.glow = want;

    // Steering + motion, then per-boid occupancy (trails spawn from cells the
    // moth vacated this frame).
    const occupancy: [number, number][][] = [];
    for (const b of boids) {
      step(b, ctx, aspect);
      const cells = occupancyOf(b);
      spawnVacated(b, cells, ctx);
      occupancy.push(cells);
    }

    paintField(surface, ctx, aspect);
    paintTrails(surface, ctx);
    for (let i = 0; i < boids.length; i++) drawSprite(surface, boids[i], i, occupancy[i]);
  }

  function step(b: Boid, ctx: AsciiCtx, aspect: number): void {
    const px = b.x * aspect; // isotropic position
    const py = b.y;
    const pvx = b.vx * aspect; // isotropic velocity
    const pvy = b.vy;
    const pointer = flock.pointer;
    const pointerI = pointer ? { x: pointer.x * aspect, y: pointer.y } : null;

    const gather = flock.gather && flock.anchor !== null;
    const fleeing = pointerI !== null && Math.hypot(px - pointerI.x, py - pointerI.y) < FLEE_RADIUS;

    let speedMul = gather ? GATHER_SPEED : 1;
    const forceMul = gather ? GATHER_FORCE : 1;
    if (fleeing) speedMul *= FLEE_SPEED;
    const speed = maxSpeed * speedMul;

    const f = { x: 0, y: 0 };
    // Roam/gather arrive (ref §17.3, force clamped on the composed total).
    arrive(
      f,
      { x: px, y: py },
      { x: pvx, y: pvy },
      gather
        ? { x: flock.anchor!.x * aspect, y: flock.anchor!.y }
        : { x: b.tx * aspect, y: b.ty },
      {
        maxSpeed: speed,
        maxForce: Number.POSITIVE_INFINITY,
        arriveRadius: gather ? GATHER_ARRIVE : roamR,
      },
    );
    f.x *= forceMul;
    f.y *= forceMul;

    // Neighbour field (aspect-corrected distances).
    let sepX = 0;
    let sepY = 0;
    let aliX = 0;
    let aliY = 0;
    let cohX = 0;
    let cohY = 0;
    let n = 0;
    for (const o of boids) {
      if (o === b) continue;
      const dx = (o.x - b.x) * aspect;
      const dy = o.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d >= neighR) continue;
      aliX += o.vx * aspect;
      aliY += o.vy;
      cohX += o.x * aspect;
      cohY += o.y;
      n++;
      if (d < sepR) {
        if (d <= 1e-4) {
          sepX += 1; // coincident boids: push along an arbitrary axis, no 0/0
        } else {
          const k = (1 - d / sepR) / d;
          sepX += -dx * k;
          sepY += -dy * k;
        }
      }
    }
    const sepLen = Math.hypot(sepX, sepY);
    if (sepLen > 0) {
      f.x += ((sepX / sepLen) * speed - pvx) * sepWeight;
      f.y += ((sepY / sepLen) * speed - pvy) * sepWeight;
    }

    if (gather && n > 0) {
      const al = Math.hypot(aliX, aliY);
      if (al > 1e-6) {
        f.x += ((aliX / al) * speed - pvx) * ALIGN_WEIGHT;
        f.y += ((aliY / al) * speed - pvy) * ALIGN_WEIGHT;
      }
      arrive(
        TMP,
        { x: px, y: py },
        { x: pvx, y: pvy },
        { x: cohX / n, y: cohY / n },
        {
          maxSpeed: speed,
          maxForce: Number.POSITIVE_INFINITY,
          arriveRadius: GATHER_ARRIVE,
        },
      );
      f.x += TMP.x * COHESION_WEIGHT;
      f.y += TMP.y * COHESION_WEIGHT;
    }

    if (fleeing && pointerI) {
      const dx = px - pointerI.x;
      const dy = py - pointerI.y;
      const d = Math.hypot(dx, dy);
      const dir = d > 1e-6 ? { x: dx / d, y: dy / d } : { x: 1, y: 0 }; // exact overlap: arbitrary axis
      f.x += (dir.x * speed - pvx) * FLEE_WEIGHT;
      f.y += (dir.y * speed - pvy) * FLEE_WEIGHT;
    }

    limit(f, maxForce * forceMul);

    b.vx += (f.x / aspect) * ctx.delta;
    b.vy += f.y * ctx.delta;
    const sp = Math.hypot(b.vx * aspect, b.vy);
    if (sp > speed) {
      const k = speed / sp;
      b.vx *= k;
      b.vy *= k;
    }
    b.x += b.vx * ctx.delta;
    b.y += b.vy * ctx.delta;

    b.fleeing = fleeing;
    if (!gather && Math.hypot((b.tx - b.x) * aspect, b.ty - b.y) < rerollR) {
      rollTarget(b, ctx.cols, ctx.rows);
    }
    b.flapPhase += FLAP * (fleeing ? FLEE_FLAP : gather ? GATHER_FLAP : 1) * ctx.delta;
  }

  function occupancyOf(b: Boid): [number, number][] {
    const x = Math.floor(b.x);
    const y = Math.floor(b.y);
    return [
      [x, y],
      [x + 1, y],
    ];
  }

  function spawnVacated(b: Boid, cells: [number, number][], ctx: AsciiCtx): void {
    const prev = b.prev;
    b.prev = cells;
    if (!prev) return;
    for (const [px, py] of prev) {
      if (
        (cells[0][0] === px && cells[0][1] === py) ||
        (cells[1][0] === px && cells[1][1] === py)
      ) {
        continue;
      }
      const key = px + ',' + py;
      const existing = trails.get(key);
      if (existing) {
        existing.until = Math.max(existing.until, ctx.time + TRAIL_TTL);
      } else {
        trails.set(key, {
          x: px,
          y: py,
          sym: TRAIL_SYMBOLS[Math.floor(rng() * TRAIL_SYMBOLS.length)],
          until: ctx.time + TRAIL_TTL,
        });
        opts.onTrailCell?.(px, py);
      }
    }
  }

  /** Lamp glow field: hatched `/` background, colour ramp surface0 → green
      over 4 bands within 12 cells of the anchor, pulsed 0.3 Hz @ depth 0.15. */
  function paintField(surface: AsciiSurface, ctx: AsciiCtx, aspect: number): void {
    const anchor = flock.anchor;
    const glow =
      flock.glow * (1 - (PULSE_DEPTH * (1 - Math.sin(2 * Math.PI * PULSE_HZ * ctx.time))) / 2);
    const active = glow > 0.002 && anchor !== null;
    for (let y = 0; y < ctx.rows; y++) {
      for (let x = 0; x < ctx.cols; x++) {
        if (!active) {
          surface.set(x, y, '/', FIELD);
          continue;
        }
        const d = Math.hypot((x - anchor!.x) * aspect, y - anchor!.y);
        let color = FIELD;
        if (d < GLOW_RADIUS) {
          const t = Math.pow(1 - d / GLOW_RADIUS, GLOW_FALLOFF) * glow;
          color = GLOW_BAND_COLORS[Math.min(GLOW_BANDS - 1, Math.floor(t * GLOW_BANDS))];
        }
        surface.set(x, y, '/', color);
      }
    }
  }

  function paintTrails(surface: AsciiSurface, ctx: AsciiCtx): void {
    if (trails.size === 0) return;
    for (const [key, t] of trails) {
      if (ctx.time >= t.until) {
        trails.delete(key);
        continue;
      }
      surface.set(t.x, t.y, t.sym, TRAIL_COLOR);
    }
  }

  function drawSprite(
    surface: AsciiSurface,
    b: Boid,
    i: number,
    cells: [number, number][],
  ): void {
    const [a, c] = GLYPHS[Math.floor(b.flapPhase) & 1];
    const color = flock.gather && flock.anchor ? GATHERED[i % GATHERED.length] : IDLE;
    surface.set(cells[0][0], cells[0][1], a, color);
    surface.set(cells[1][0], cells[1][1], c, color);
  }

  return flock;
}

// Scratch vector reused by cohesion steering (kept out of the frame loop).
const TMP: Vec = { x: 0, y: 0 };