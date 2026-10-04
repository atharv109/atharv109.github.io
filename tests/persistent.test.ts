import { describe, it, expect, beforeEach } from 'vitest';
import { getJSON, setJSON, getStr } from '../src/scripts/persistent';

describe('persistent', () => {
  beforeEach(() => localStorage.clear());
  it('round-trips JSON with am- prefix', () => {
    setJSON('nav-open', { about: true });
    expect(localStorage.getItem('am-nav-open')).toBe('{"about":true}');
    expect(getJSON('nav-open', {})).toEqual({ about: true });
  });
  it('returns fallback on corrupt JSON without throwing', () => {
    localStorage.setItem('am-broken', '{not json');
    expect(getJSON('broken', { ok: 1 })).toEqual({ ok: 1 });
  });
  it('getStr falls back when missing', () => {
    expect(getStr('theme', 'Dark')).toBe('Dark');
  });
});
