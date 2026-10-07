import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TROPHIES,
  unlock,
  isUnlocked,
  unlockedCount,
  recordVisit,
  checkRare,
} from '../src/scripts/trophies';

// Plan Task 9 Step 2 (ref §9 adapted to the AM trophy set). Node environment:
// document is faked as a bare EventTarget so unlock()'s dispatched
// 'trophy:unlocked' event can be observed without a DOM.

const events: CustomEvent[] = [];

beforeEach(() => {
  localStorage.clear();
  events.length = 0;
  (globalThis as { document?: unknown }).document = new EventTarget();
  document.addEventListener('trophy:unlocked', (e) => events.push(e as CustomEvent));
});

afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
});

describe('trophy table', () => {
  it('defines the 7 trophies in order with rare last', () => {
    expect(TROPHIES.map((t) => t.id)).toEqual([
      'first-visit',
      'explorer',
      'director',
      'secret',
      'complete-the-mark',
      'reach-out',
      'free-the-moth',
    ]);
  });

  it('locked label is a ?-mask of the unlocked title length', () => {
    for (const t of TROPHIES) {
      expect(t.locked).toBe('?'.repeat(t.title.length));
    }
  });
});

describe('unlock', () => {
  it('returns true once, then false (already unlocked)', () => {
    expect(unlock('first-visit')).toBe(true);
    expect(unlock('first-visit')).toBe(false);
    expect(isUnlocked('first-visit')).toBe(true);
    expect(localStorage.getItem('am-trophy:first-visit')).toBe('1');
  });

  it('unlocked state persists across a fresh store read (reload)', () => {
    localStorage.setItem('am-trophy:explorer', '1');
    expect(isUnlocked('explorer')).toBe(true);
    expect(unlockedCount()).toBe(1);
  });

  it('dispatches trophy:unlocked {detail:{id}} exactly once per trophy', () => {
    unlock('director');
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ id: 'director' });
    unlock('director');
    expect(events).toHaveLength(1);
  });

  it('ignores unknown ids (no store write, no event)', () => {
    expect(unlock('nope')).toBe(false);
    expect(localStorage.getItem('am-trophy:nope')).toBe(null);
    expect(events).toHaveLength(0);
  });
});

describe('rare trophy (free-the-moth)', () => {
  it('auto-unlocks only when all six others are unlocked', () => {
    const six = TROPHIES.filter((t) => !t.rare).map((t) => t.id);
    for (const id of six.slice(0, 5)) unlock(id);
    expect(isUnlocked('free-the-moth')).toBe(false);
    unlock(six[5]);
    expect(isUnlocked('free-the-moth')).toBe(true);
    expect(events[events.length - 1].detail).toEqual({ id: 'free-the-moth' });
    expect(unlockedCount()).toBe(7);
  });

  it('also auto-unlocks from restored state at load (checkRare)', () => {
    for (const t of TROPHIES.filter((x) => !x.rare)) localStorage.setItem(`am-trophy:${t.id}`, '1');
    checkRare();
    expect(isUnlocked('free-the-moth')).toBe(true);
  });
});

describe('explorer visits', () => {
  it('corrupt am-trophy-visits resets to [] on the next visit', () => {
    localStorage.setItem('am-trophy-visits', '{not json');
    recordVisit('/about/');
    expect(JSON.parse(localStorage.getItem('am-trophy-visits')!)).toEqual(['/about']);
    expect(isUnlocked('explorer')).toBe(false);
  });

  it('non-array am-trophy-visits resets too', () => {
    localStorage.setItem('am-trophy-visits', '"junk"');
    recordVisit('/about/');
    expect(JSON.parse(localStorage.getItem('am-trophy-visits')!)).toEqual(['/about']);
  });

  it('explorer unlocks at 5 distinct pathnames, trailing slash stripped', () => {
    for (const p of ['/a/', '/b/', '/c/', '/d/', '/e/']) recordVisit(p);
    expect(isUnlocked('explorer')).toBe(true);
    expect(JSON.parse(localStorage.getItem('am-trophy-visits')!)).toEqual([
      '/a',
      '/b',
      '/c',
      '/d',
      '/e',
    ]);
  });

  it('repeat visits neither unlock early nor unlock twice', () => {
    for (const p of ['/a/', '/a', '/b/', '/b', '/c/', '/d/', '/e/']) recordVisit(p);
    expect(isUnlocked('explorer')).toBe(true);
    expect(unlock('first-visit')).toBe(true); // the only other unlock so far
    expect(unlockedCount()).toBe(2);
  });
});