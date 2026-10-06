// persistence-hardening.test.ts — Task 12 Step 1/2. Every real am-* key the
// site uses is poisoned (corrupt JSON, wrong shapes, junk values) and the
// readers must fall back to defaults without a single thrown error:
//  - the inline boot script in PageLayout.astro (reads am-theme / am-font-size /
//    am-nav-open directly, before paint) runs in a stubbed-DOM boot harness —
//    the script body is extracted from the .astro source, minus its outer
//    try/catch, so a swallowed error surfaces as a thrown one here;
//  - module reads go through persistent.ts / parseSavedRect / recordVisit.
// Runs on vitest's node environment + the Web Storage shim in setup.ts.

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { getJSON, getSessionJSON, getStr } from '../src/scripts/persistent';
import { parseSavedRect } from '../src/scripts/popup-window';
import { recordVisit, isUnlocked } from '../src/scripts/trophies';

// ---- boot harness ----------------------------------------------------------

const LAYOUT = readFileSync(
  new URL('../src/layouts/PageLayout.astro', import.meta.url),
  'utf8',
);

/** The inline boot script, minus the outer `try { ... } catch (e) {}` so a
    swallowed error escapes to the harness instead of hiding. */
function bootBody(): string {
  const m = LAYOUT.match(/<script is:inline>([\s\S]*?)<\/script>/);
  expect(m, 'PageLayout.astro must contain an inline boot script').toBeTruthy();
  const raw = m![1];
  const start = raw.indexOf('try {');
  const end = raw.lastIndexOf('} catch (e) {}');
  expect(start, 'boot script must start with a try {').toBeGreaterThanOrEqual(0);
  expect(end, 'boot script must end with } catch (e) {}').toBeGreaterThan(start);
  return raw.slice(start + 'try {'.length, end);
}

interface BootOpts {
  theme?: string;
  fontSize?: string;
  navOpen?: string;
  reduced?: boolean;
  pathname?: string;
}

interface BootResult {
  html: {
    dataset: Record<string, string>;
    style: Record<string, string>;
    classes: Set<string>;
  };
  /** [name, constructor] pairs captured from customElements.define */
  defined: [string, unknown][];
  /** anything thrown anywhere in the body (outer catch stripped) */
  thrown: unknown[];
  consoleErrors: string[];
}

function boot(o: BootOpts = {}): BootResult {
  const store = new Map<string, string | null>();
  if (o.theme !== undefined) store.set('am-theme', o.theme);
  if (o.fontSize !== undefined) store.set('am-font-size', o.fontSize);
  if (o.navOpen !== undefined) store.set('am-nav-open', o.navOpen);

  const html = {
    dataset: {} as Record<string, string>,
    style: {} as Record<string, string>,
    classes: new Set<string>(),
  };
  const classList = {
    add(...c: string[]) {
      c.forEach((x) => html.classes.add(x));
    },
    remove(...c: string[]) {
      c.forEach((x) => html.classes.delete(x));
    },
    contains(c: string) {
      return html.classes.has(c);
    },
  };
  const defined: [string, unknown][] = [];
  const result: BootResult = {
    html,
    defined,
    thrown: [],
    consoleErrors: [],
  };

  const fn = new Function(
    'document',
    'window',
    'localStorage',
    'matchMedia',
    'location',
    'customElements',
    'console',
    // the boot script declares `class extends HTMLElement` — browsers have the
    // real interface; the harness stubs it (definition-time binding only).
    'HTMLElement',
    bootBody(),
  );
  try {
    fn.call(
      globalThis,
      { documentElement: { ...html, get classList() { return classList; } } },
      { self: {}, top: {} }, // same identity-ish: not embedded
      {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: () => {},
        removeItem: () => {},
      },
      () => ({ matches: !!o.reduced }),
      { pathname: o.pathname ?? '/' },
      {
        define: (name: string, ctor: unknown) => {
          defined.push([name, ctor]);
        },
        get: () => undefined,
      },
      {
        error: (...a: unknown[]) => {
          result.consoleErrors.push(a.map(String).join(' '));
        },
      },
      class StubElement {}
    );
  } catch (e) {
    result.thrown.push(e);
  }
  return result;
}

type FolderCtor = new () => {
  connectedCallback: (this: unknown) => void;
};

/** Simulate a <tree-folder label> upgrade with the captured head class.
    Returns the resolved open-attribute state ('true'/'false' — absent open
    attribute = closed). */
function folderState(result: BootResult, label: string): string {
  const entry = result.defined.find(([name]) => name === 'tree-folder');
  expect(entry, 'boot script must define tree-folder').toBeTruthy();
  const C = entry![1] as FolderCtor;
  const el = {
    open: false,
    hasAttribute(n: string) {
      return n === 'data-persist' || (n === 'open' && this.open);
    },
    getAttribute(n: string) {
      return n === 'label' ? label : null;
    },
    toggleAttribute(n: string, force?: boolean) {
      if (n === 'open') this.open = !!force;
    },
    removeAttribute(n: string) {
      if (n === 'open') this.open = false;
    },
  };
  C.prototype.connectedCallback.call(el);
  return el.open ? 'true' : 'false';
}

// ---- module-read sweep -----------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('boot script persistence hardening', () => {
  it('valid saved values still apply (control: Light theme, font 16, folders)', () => {
    const r = boot({ theme: 'Light', fontSize: '16', navOpen: '{"projects":"true"}' });
    expect(r.thrown).toHaveLength(0);
    expect(r.consoleErrors).toHaveLength(0);
    expect(r.html.dataset.theme).toBe('light');
    expect(r.html.style.fontSize).toBe('16px');
    expect(r.html.classes).toContain('wave-pending');
    expect(r.html.classes).toContain('intro-pending');
    expect(folderState(r, 'projects')).toBe('true');
    expect(folderState(r, 'archive')).toBe('false'); // absent from map → closed
  });

  it('poisoned am-theme ("Blue") never applies a theme, no error', () => {
    const r = boot({ theme: 'Blue' });
    expect(r.thrown).toHaveLength(0);
    expect(r.html.dataset.theme).toBeUndefined();
    // lowercase must not match the exact 'Light' literal either
    const lower = boot({ theme: 'light' });
    expect(lower.html.dataset.theme).toBeUndefined();
  });

  it('poisoned am-font-size never applies junk px; numeric poison clamps into range', () => {
    for (const poison of ['abc', '', 'NaN', '{}']) {
      const r = boot({ fontSize: poison });
      expect(r.thrown, `fontSize poison ${JSON.stringify(poison)}`).toHaveLength(0);
      expect(
        r.html.style.fontSize,
        `fontSize poison ${JSON.stringify(poison)}`,
      ).toBeUndefined();
    }
    for (const poison of ['30', '7', '1e9', '999px']) {
      const r = boot({ fontSize: poison });
      expect(r.thrown, `fontSize poison ${JSON.stringify(poison)}`).toHaveLength(0);
      const applied = r.html.style.fontSize;
      expect(applied, `fontSize poison ${JSON.stringify(poison)}`).toMatch(
        /^1[2-9]px$|^20px$/,
      );
    }
  });

  it('font-size is clamped into 12..20 (30→20, 7→12, 13.7→13, 16 stays)', () => {
    expect(boot({ fontSize: '30' }).html.style.fontSize).toBe('20px');
    expect(boot({ fontSize: '7' }).html.style.fontSize).toBe('12px');
    expect(boot({ fontSize: '13.7' }).html.style.fontSize).toBe('13px');
    expect(boot({ fontSize: '16' }).html.style.fontSize).toBe('16px');
  });

  it('structurally-bad am-nav-open boots clean, folders default closed', () => {
    for (const poison of ['true', 'false', 'null', '"projects"', '[1,2]', '5', '{projects}']) {
      const r = boot({ navOpen: poison });
      expect(r.thrown, `navOpen poison ${JSON.stringify(poison)}`).toHaveLength(0);
      expect(folderState(r, 'projects'), `navOpen poison ${JSON.stringify(poison)}`).toBe(
        'false',
      );
    }
  });

  it('all real am-* keys poisoned at once: clean boot, defaults everywhere', () => {
    const r = boot({
      theme: '"light"', // quoted string (JSON round-tripped by mistake)
      fontSize: '999px',
      navOpen: '{projects:', // corrupt JSON
    });
    expect(r.thrown).toHaveLength(0);
    expect(r.consoleErrors).toHaveLength(0);
    expect(r.html.dataset.theme).toBeUndefined();
    // '999px' parses as 999 → clamped into 12..20 rather than applied raw.
    expect(r.html.style.fontSize).toMatch(/^1[2-9]px$|^20px$/);
    expect(r.html.classes).toContain('wave-pending');
    expect(folderState(r, 'projects')).toBe('false');
  });

  it('reduced-motion boot path adds no pending classes with poisoned keys', () => {
    const r = boot({ reduced: true, theme: 'Blue', fontSize: 'abc', navOpen: 'null' });
    expect(r.thrown).toHaveLength(0);
    expect(r.html.classes).not.toContain('wave-pending');
    expect(r.html.classes).not.toContain('intro-pending');
  });
});

describe('module reads survive poisoning', () => {
  it('am-moth-state shape hazards are rejected before restore (never an 11×finite array)', () => {
    const poisons: [string, string][] = [
      ['junk', '{not json'],
      ['bool', 'true'],
      ['object', '{"x":1}'],
      ['short array', '[1,2]'],
      ['non-finite entry', `[${Array(10).fill(1).join(',')},null]`],
      ['string entries', '["a",1,2,3,4,5,6,7,8,9,0]'],
      ['nested depth', '{"a":{"deep":[1,2,3]}}'],
    ];
    for (const [label, raw] of poisons) {
      sessionStorage.setItem('am-moth-state', raw);
      const v = getSessionJSON<unknown>('moth-state', null);
      const usable =
        Array.isArray(v) && v.length === 11 && v.every((n) => Number.isFinite(n));
      expect(usable, `moth-state poison (${label}) must not be restorable`).toBe(false);
    }
  });

  it('am-popup-bounds:* poison → null or clamped, never applied raw', () => {
    // JSON.parse('1e999') → Infinity: the junk-depth case → rejected.
    expect(parseSavedRect('1e999', 1280, 800)).toBeNull();
    expect(parseSavedRect('true', 1280, 800)).toBeNull();
    expect(parseSavedRect('[1,2]', 1280, 800)).toBeNull();
    // Absurd but well-typed rect clamps into the viewport.
    const clamped = parseSavedRect('{"x":-9000,"y":9000,"w":9e9,"h":9e9}', 1280, 800);
    expect(clamped).toMatchObject({ x: 0, y: 0, w: 1280, h: 800 });
  });

  it('am-trophy-visits corrupt data self-heals to [] and explorer still unlocks', () => {
    localStorage.setItem('am-trophy-visits', '{"visited": true}');
    const paths = ['/', '/about/', '/contact/', '/resume/', '/archive/'];
    for (const p of paths) recordVisit(p);
    // recordVisit never threw (test would fail), poison self-healed away, and
    // the fifth distinct route unlocks explorer.
    expect(isUnlocked('explorer')).toBe(true);
    const healed = getJSON<unknown[]>('trophy-visits', []);
    expect(healed).toEqual(['/', '/about', '/contact', '/resume', '/archive']);
  });

  it('am-feature-open:* corrupt JSON falls back to null (default state), no throw', () => {
    localStorage.setItem('am-feature-open:about-map', '{not json');
    expect(getJSON<boolean | null>('feature-open:about-map', null)).toBeNull();
    // 'null' round-trip → null → treated as "no saved state".
    localStorage.setItem('am-feature-open:about-map', 'null');
    expect(getJSON<boolean | null>('feature-open:about-map', null)).toBeNull();
  });

  it('am-trophy:<id> junk never reads as unlocked (only exact "1")', () => {
    for (const junk of ['true', '1 ', '1.0', '{"1":1}', '"1"']) {
      localStorage.setItem('am-trophy:first-visit', junk);
      expect(isUnlocked('first-visit'), `trophy poison ${JSON.stringify(junk)}`).toBe(
        false,
      );
    }
  });
});