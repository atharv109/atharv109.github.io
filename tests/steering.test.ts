import { describe, it, expect } from 'vitest';
import { arrive, seek, limit } from '../src/scripts/ascii/steering';

// Plan Task 9 Step 3 / ref §17.3: arrive = desired velocity (arrive-scaled)
// minus current velocity, clamped to maxForce. DOM-free, node-tested.

const len = (v: { x: number; y: number }): number => Math.hypot(v.x, v.y);

describe('steering', () => {
  it('arrive clamps force to maxForce', () => {
    const out = { x: 0, y: 0 };
    arrive(
      out,
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: -1000, y: 0 },
      { maxSpeed: 100, maxForce: 50, arriveRadius: 10 },
    );
    expect(len(out)).toBeCloseTo(50, 6);
  });

  it('speed scales down inside arriveRadius', () => {
    const out = { x: 0, y: 0 };
    // Half-way into the arrive radius → desired speed is maxSpeed/2.
    arrive(
      out,
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { maxSpeed: 100, maxForce: 1000, arriveRadius: 10 },
    );
    expect(len(out)).toBeCloseTo(50, 6);
  });

  it('outside arriveRadius desired speed is maxSpeed, minus current velocity', () => {
    const out = { x: 0, y: 0 };
    arrive(
      out,
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 500, y: 0 },
      { maxSpeed: 100, maxForce: 1000, arriveRadius: 10 },
    );
    expect(len(out)).toBeCloseTo(80, 6); // 100 desired − 20 current
  });

  it('zero distance does not NaN', () => {
    const out = { x: 0, y: 0 };
    arrive(
      out,
      { x: 3, y: 4 },
      { x: -1, y: 2 },
      { x: 3, y: 4 },
      { maxSpeed: 100, maxForce: 50, arriveRadius: 2 },
    );
    expect(Number.isFinite(out.x)).toBe(true);
    expect(Number.isFinite(out.y)).toBe(true);
  });

  it('seek points at the target and limits to maxForce', () => {
    const out = { x: 0, y: 0 };
    seek(
      out,
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: -500, y: 0 },
      { maxSpeed: 100, maxForce: 40, arriveRadius: 0 },
    );
    expect(out.x).toBeLessThan(0);
    expect(len(out)).toBeCloseTo(40, 6);
  });

  it('limit leaves sub-limit vectors untouched', () => {
    const v = { x: 3, y: 4 };
    limit(v, 10);
    expect(len(v)).toBeCloseTo(5, 6);
  });
});