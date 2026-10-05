import { describe, it, expect } from 'vitest';
import { AsciiSurface } from '../src/scripts/ascii/surface';

describe('AsciiSurface', () => {
  it('ignores out-of-range writes', () => {
    const s = new AsciiSurface(4, 3);
    expect(() => s.set(9, 9, '|')).not.toThrow();
    s.set(9, 9, '|');
    s.set(1, 1, '|');
    expect(s.dirtyRows()).toEqual([1]);
  });
  it('run-length groups same-colour cells', () => {
    const s = new AsciiSurface(5, 1);
    s.set(0, 0, '|', 'red');
    s.set(1, 0, '|', 'red');
    s.set(2, 0, '-', 'blue');
    expect(s.rowRuns(0).map((r) => r.text)).toEqual(['||', '-']);
  });
  it('clears a row to spaces when cells reset', () => {
    const s = new AsciiSurface(3, 1);
    s.set(0, 0, '|');
    s.flush();
    s.set(0, 0, ' ');
    expect(s.rowRuns(0)[0].text.trim()).toBe('');
  });
});
