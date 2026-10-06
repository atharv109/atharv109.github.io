import { describe, it, expect } from 'vitest';
import {
  maskFromAlpha,
  ringIndex,
  LogoHatch,
  newDropExt,
} from '../src/scripts/ascii/logo-mask';

// Deterministic RNG: yields queued values then repeats the last one.
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values.length ? values[Math.min(i, values.length - 1)] : 0;
    i++;
    return v;
  };
}

describe('logo-mask', () => {
  it('rasterises glyph to cell mask with 50% coverage threshold', () => {
    // Fake 8x8 canvas alpha at 4x supersampling -> 2x2 cells. Max sum per cell
    // is 16 sub-pixels x 255 = 4080; threshold is >= 50% of that (2040).
    const alpha = new Uint8ClampedArray(8 * 8);
    // First n of a cell's 16 sub-pixels (row-major inside the cell) at 255.
    const set = (cellCol: number, cellRow: number, n: number) => {
      let placed = 0;
      for (let sy = 0; sy < 4; sy++)
        for (let sx = 0; sx < 4; sx++) {
          if (placed++ < n) alpha[(cellRow * 4 + sy) * 8 + cellCol * 4 + sx] = 255;
        }
    };
    set(0, 0, 16); // full coverage -> in
    set(1, 0, 4); // 4/16 -> 1020 (out)
    set(0, 1, 8); // exactly 50% -> 2040 (in, >=)
    set(1, 1, 0);
    const mask = maskFromAlpha(
      { width: 8, height: 8, alpha },
      { cols: 2, rows: 2, aspect: 0.5, cellPx: 4 },
    );
    expect(mask.cells[0 * 2 + 0]).toBe(1); // full
    expect(mask.cells[0 * 2 + 1]).toBe(0); // 25% -> out
    expect(mask.cells[1 * 2 + 0]).toBe(1); // exactly 50% -> in
    expect(mask.cells[1 * 2 + 1]).toBe(0);
    expect(mask.count).toBe(2);
    expect(mask.bbox).toEqual({ x0: 0, y0: 0, x1: 0, y1: 1 });
    expect(mask.cx).toBe(0); // bbox centre (cell units)
    expect(mask.cy).toBe(0.5);
  });

  it('ring index increases with distance from centre', () => {
    // aspect = cellW/lineH = 0.5: horizontal distance is halved before hypot.
    expect(ringIndex(0, 0, 0, 0, 0.5)).toBe(0);
    expect(ringIndex(16, 0, 0, 0, 0.5)).toBe(1); // hypot(8,0)/8 = 1
    expect(ringIndex(0, 40, 0, 0, 0.5)).toBe(5); // 40/8 = 5
    const mid = ringIndex(2, 1, 0, 0, 0.5);
    expect(ringIndex(36, 24, 0, 0, 0.5)).toBeGreaterThan(mid); // farther -> larger ring
  });

  it('completion fires exactly once when all face cells filled', () => {
    // 3x3 all-mask mask (via full-coverage alpha).
    const alpha = new Uint8ClampedArray(12 * 12).fill(255); // 3x3 cells at cellPx 4
    const mask = maskFromAlpha(
      { width: 12, height: 12, alpha },
      { cols: 3, rows: 3, aspect: 0.5, cellPx: 4 },
    );
    expect(mask.count).toBe(9);

    const calls: number[] = [];
    const hatch = new LogoHatch(mask, {
      turnChance: 0.3,
      rng: seqRng([0.5]), // drag = 0.5; row crossings never turn (0.5 >= 0.3)
      onComplete: () => calls.push(+hatch.complete),
    });

    // Drive one drop over all 9 cells, row by row.
    const ext = newDropExt();
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) hatch.enterCell(col, row, ext);
    }
    expect(calls.length).toBe(1); // exactly once
    expect(hatch.complete).toBe(true);
    expect(hatch.filled).toBe(9);

    // Re-entering cells (or new drops) never refires.
    const ext2 = newDropExt();
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) hatch.enterCell(col, row, ext2);
    }
    expect(calls.length).toBe(1);
  });
});