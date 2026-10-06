// Regression tests for the renderer's rAF fps-cap gate (node env — the tick
// loop is driven with fake timestamps; the 1x1 surface keeps row painting inert).
import { describe, it, expect, vi } from 'vitest';
import { AsciiRenderer } from '../src/scripts/ascii/renderer';

describe('ascii renderer fps-cap gate', () => {
  it('sub-cap frames accumulate delta instead of freezing; crossing the cap paints', () => {
    globalThis.requestAnimationFrame = vi.fn(() => 0) as unknown as typeof requestAnimationFrame;
    let painted = 0;
    const renderer = new AsciiRenderer(null as never, { update: () => painted++ });
    (renderer as { running: boolean }).running = true;
    (renderer as { fpsCap: number }).fpsCap = 30; // 1/30s ≈ 33.3ms interval

    const tick = (now: number) => (renderer as unknown as { tick(now: number): void }).tick(now);

    tick(1000); // cold start (last=0): must paint, never be capped away
    expect(painted).toBe(1);
    tick(1010); // 10ms < 33.3ms → skip, painted delta accumulates
    expect(painted).toBe(1);
    tick(1040); // 40ms since last paint → paints
    expect(painted).toBe(2);
    tick(1050); // skip again
    expect(painted).toBe(2);
    tick(1080); // crosses cap → paints
    expect(painted).toBe(3);
  });
});