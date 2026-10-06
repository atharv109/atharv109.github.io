import { describe, it, expect } from 'vitest';
import { charDelay, blockStart, SEQ, SLOT } from '../src/scripts/text-wave';
describe('wave timing', () => {
  it('diagonal phase clamps 0..1', () => {
    const b = { left: 0, top: 0, width: 100, height: 100 };
    expect(charDelay({ left: 0, top: 0 }, b, 0)).toBe(0);
    expect(charDelay({ left: 100, top: 100 }, b, 0)).toBe(500);
    expect(charDelay({ left: 400, top: 400 }, b, 0)).toBe(500); // clamped
  });
  it('blockStart staggers up to 450ms by viewport position', () => {
    expect(blockStart(0, 0, 1000)).toBe(0);
    expect(blockStart(1000, 0, 1000)).toBe(450);
  });
  it('glitch sequence is = ~ - ~ = at 40ms slots', () => {
    expect(SEQ).toEqual(['=', '~', '-', '~', '=']);
    expect(SLOT).toBe(40);
  });
});