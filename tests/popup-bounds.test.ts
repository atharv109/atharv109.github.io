import { describe, it, expect } from 'vitest';
import { clampRect, parseSavedRect } from '../src/scripts/popup-window';

describe('popup bounds', () => {
  it('clamps restored rect into viewport', () => {
    expect(clampRect({ x: 5000, y: -200, w: 900, h: 700 }, 1280, 800)).toEqual({
      x: 380,
      y: 0,
      w: 900,
      h: 700,
    });
  });
  it('rejects corrupt saved rect', () => {
    expect(parseSavedRect('{bad json', 1280, 800)).toBeNull();
    expect(parseSavedRect('{"x":"a"}', 1280, 800)).toBeNull();
  });
  it('enforces min size 200x150', () => {
    expect(clampRect({ x: 0, y: 0, w: 50, h: 20 }, 1280, 800).w).toBe(200);
  });
});
