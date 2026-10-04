# Astro "Meadow" Portfolio Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (chosen by user: "fan out subagents") to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite atharv109.github.io as a static Astro MPA that looks/feels/behaves like the digital-meadow reference, carrying Atharv's own content, AM-monogram mark, terminal, trophies and moth.

**Architecture:** Astro static output + vanilla TS custom elements; no UI framework, no CSS framework, no animation library. One layout (`PageLayout.astro`), content from markdown collections, signature effects as framework-free TS modules under `src/scripts/`.

**Tech Stack:** Astro 5 (static), TypeScript, Vitest (logic), Playwright (route smoke), pyftsubset/FontForge for the font subset + AM glyph.

**Spec:** `docs/superpowers/specs/2026-10-04-astro-meadow-redesign-design.md`

**Mechanics reference (authoritative for tokens/timings/algorithms):**
`C:\Users\athar\Downloads\digital-meadow-reference\dm-ref\spec-source.md` — cited below as (ref §N).

## Global Constraints

- No React, Tailwind, GSAP, Lenis, Three.js shipped. `package.json` deps: `astro`, `@astrojs/sitemap`, `typescript`, dev-only `vitest`, `@playwright/test`.
- One font: subset `IosevkaTermNF-AM.woff2`, weight 400 only, no bold/italic anywhere; root `font-size:14px`; `--line-height:19px`; `1ch == 7px`.
- Dark palette default (ref §4.1 exact hex values); light opt-in via `data-theme="light"`; never follows OS.
- No border-radius, box-shadow, gradients, or CSS transitions on chrome; motion is rAF-driven, `linear`/`step-end` only.
- Vertical rhythm: everything snaps to 19px lines; blank lines are real `<p aria-hidden="true">&nbsp;</p>`.
- All copy, trophy names, icons, and the AM glyph are original — copy NOTHING verbatim from the reference beyond tokens/timings/algorithm constants.
- All routes trailing-slash; site must build with `astro build` and pass `playwright` smoke on every route.
- Commits per task; branch `redesign/editor-portfolio`.

## Review Focus

1. **Reduced motion** — user with `prefers-reduced-motion: reduce` must see every page fully rendered instantly; no wave, no rain intro, no moth/boids. Tested in Tasks 6, 8, 9, 10 + Playwright.
2. **Font subset failure** — if the woff2 404s or the subset misses a glyph, the site must still render legibly (monospace fallback) and icons degrade to empty boxes, never crash. Tested in Task 1.
3. **Terminal input edge cases** — empty input, unknown command, `cd` to missing path, very long lines must yield sane output, not exceptions. Tested in Task 11 (state-machine unit tests).
4. **Popup bounds** — dragged/resized popup near viewport edges must clamp on restore (localStorage poisoned with huge/negative values must not break layout). Tested in Task 4.
5. **Persistence poisoning** — corrupt JSON in any `am-*` localStorage key must be caught and reset to defaults, never throw during boot (the inline head script runs before paint). Tested in Task 12.

## Shared Interfaces (defined by the tasks named; later tasks consume exactly these)

```ts
// src/scripts/persistent.ts  (Task 1)
export function getJSON<T>(key: string, fallback: T): T   // never throws
export function setJSON(key: string, value: unknown): void
export function getStr(key: string, fallback: string): string
export function setStr(key: string, value: string): void
// All keys are prefixed internally: "am-" + key; session variants: getSessionJSON/setSessionJSON.

// src/scripts/ascii/surface.ts  (Task 7)
export interface Cell { char: string; color?: string; bg?: string }
export class AsciiSurface {
  constructor(cols: number, rows: number)
  set(x: number, y: number, char: string, color?: string, bg?: string): void // out-of-range ignored
  resize(cols: number, rows: number): void
  dirtyRows(): number[]           // rows changed since last flush
  rowRuns(y: number): { text: string; color?: string; bg?: string }[]  // run-length grouped
  flush(): void                   // clears dirty marks
}

// src/scripts/ascii/renderer.ts  (Task 7)
export interface AsciiCtx { frame: number; time: number; delta: number; cols: number; rows: number;
  metrics: { cellW: number; lineH: number; aspect: number }; cursor: { x: number; y: number } | null }
export interface AsciiProgram { init?(ctx: AsciiCtx): void; update(surface: AsciiSurface, ctx: AsciiCtx): void }
export class AsciiRenderer {
  constructor(host: HTMLElement, program: AsciiProgram)
  start(): void; stop(): void     // rAF loop, pauses on visibilitychange
}

// src/scripts/text-wave.ts  (Task 6)
export function runTextWave(root: HTMLElement): Promise<number>  // resolves max start delay (ms)
export function attachHoverWave(doc: Document): void

// src/scripts/trophies.ts  (Task 9)
export interface TrophyDef { id: string; title: string; locked: string; desc: string; color: string; icon: string; rare?: boolean }
export const TROPHIES: TrophyDef[]
export function unlock(id: string): boolean        // false if already unlocked
export function isUnlocked(id: string): boolean
export function unlockedCount(): number
// dispatches document event "trophy:unlocked" { detail: { id } }

// src/scripts/terminal/machine.ts  (Task 11)
export interface TermState { cwd: string[]; history: string[]; matrixOn: boolean }
export interface TermResult { lines: string[]; state: TermState; clear?: boolean; navigate?: string }
export function createMachine(): { exec(input: string, state: TermState): TermResult }
```

---

### Task 1: Scaffold — Astro project, tokens, font subset, base styles

**Files:**
- Create: `package.json` (rewrite), `astro.config.mjs`, `tsconfig.json` (rewrite)
- Create: `src/styles/tokens.css`, `src/styles/reset.css`, `src/styles/layout.css`
- Create: `src/scripts/persistent.ts`, `tests/persistent.test.ts`
- Create: `scripts/subset-font.mjs`, `public/fonts/README.txt`
- Delete: `src/components/`, `src/sections/`, `src/routes/`, `src/hooks/`, `src/App.tsx`, `src/main.tsx`, `src/App.css`, `src/index.css` (including the uncommitted meadow edit — superseded), `tailwind.config.js`, `postcss.config.js`, `src/data/projects.ts` AFTER Task 2 migrates its data (keep until then)

**Interfaces:**
- Produces: `persistent.ts` API (see Shared Interfaces); CSS custom properties `--color-*` (ref §4.1), `--line-height:19px`, `--sidebar-width:36ch`, `--line-numbers-width:5ch`, `--pad-xs:2px --pad-sm:5px --pad-md:9px`, `--font-ui`.

- [ ] **Step 1: Clean + scaffold**

```bash
cd /c/Users/athar/atharv109.github.io
git rm -r src/components src/sections src/routes src/hooks src/App.tsx src/main.tsx src/App.css src/index.css 2>/dev/null
rm -f tailwind.config.js postcss.config.js
git checkout -- src/index.css 2>/dev/null; rm -f src/index.css   # discard superseded uncommitted edit
npm create astro@latest -- --template minimal --no-install --typescript strict --git false . --skip-houston
npm uninstall three @types/three gsap lenis react react-dom react-router-dom tailwindcss @vitejs/plugin-react 2>/dev/null
npm i astro @astrojs/sitemap
npm i -D typescript vitest @playwright/test
```

New `package.json` scripts: `"dev": "astro dev"`, `"build": "astro build"`, `"preview": "astro preview"`, `"test": "vitest run"`, `"test:e2e": "playwright test"`.

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://atharv109.github.io',
  output: 'static',
  trailingSlash: 'always',
  prefetch: { defaultStrategy: 'hover' },
  integrations: [sitemap()],
});
```

- [ ] **Step 2: Write tokens.css + reset.css + layout.css**

`tokens.css` — copy exact dark/light hex values from ref §4.1 (25 tokens), plus:
```css
:root{
  --line-height:19px; --sidebar-width:36ch; --line-numbers-width:5ch; --margin:3ch;
  --pad-xs:2px; --pad-sm:5px; --pad-md:9px;
  --font-ui:"Iosevka Term NF","Iosevka",ui-monospace,monospace;
}
[data-theme="light"]{ /* light token set from ref §4.1 */ }
::selection{ background:var(--color-green); color:var(--color-base) }
```

`reset.css`: `*{margin:0;padding:0;box-sizing:border-box}`,`h1..h6,p,li,span{font-size:inherit;font-weight:inherit;line-height:inherit}`, `html{font-size:14px}`, `body{font:400 1rem/19px var(--font-ui)}`, scrollbar hidden, `overscroll-behavior:none`, touch-action manipulation on interactive elements.

`layout.css`: body grid `grid-template-columns:var(--sidebar-width) 1fr; align-items:start`, `@media (width<=50rem){ grid-template-columns:1fr; --line-numbers-width:0ch }`, `.sidebar{position:sticky;top:0;background:var(--color-base)}`, `main{background:var(--color-surface0);min-height:100svh;min-width:0}`.

- [ ] **Step 3: Write the failing test for persistent.ts**

```ts
// tests/persistent.test.ts
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
```

- [ ] **Step 4: Run test, verify failure** — `npx vitest run tests/persistent.test.ts` → module not found.

- [ ] **Step 5: Implement persistent.ts** (≈30 lines: prefix `am-`, try/catch JSON.parse, session variants using sessionStorage, same try/catch). Re-run → PASS.

- [ ] **Step 6: Font subset script**

`scripts/subset-font.mjs` documents + shells out:
```
pyftsubset IosevkaTermNF-Regular.woff2 --output-file=public/fonts/IosevkaTermNF-AM.woff2 \
  --unicodes="U+0020-007E,U+00E9,U+00F1,U+E5FE,U+E5FF,U+F0219,U+F1860,U+F0337,U+F09EB,U+E709,U+F16D,U+EA76,U+F09E,U+F0A54,U+F1A25,U+F1A26,U+EFB7,U+F1020,U+E28E,U+F0DFA,U+F0CFD,U+EEF7,U+100000"
```
(Nerd-font icon final list may shrink/grow in later tasks; keep this command the single source.) If Iosevka Term NF isn't available locally, download Iosevka Term 33.x + run the NF patcher, OR fall back to `@fontsource/iosevka` 400 woff2 with icons temporarily swapped for ASCII stand-ins — record the choice in `public/fonts/README.txt`. **The AM glyph at U+100000 is added in Task 8** (needs the designed mark).

- [ ] **Step 7: Verify font-degradation:** temporarily rename the woff2, load `astro dev`, confirm page renders in fallback monospace with no console errors. Restore.

- [ ] **Step 8: Commit** — `feat: astro scaffold with meadow tokens and persistence layer`

---

### Task 2: Data — nav tree config + content collections migration

**Files:**
- Create: `src/data/nav.ts`, `tests/nav.test.ts`
- Create: `src/content.config.ts`, `src/content/projects/*.md` (6), `src/content/archive/*.md` (8), `src/content/pages/about.md`, `contact.md`, `resume.md`
- Create: `src/data/readme.ts`
- Delete: `src/data/projects.ts` (after migration)

**Interfaces:**
- Produces: `export interface NavNode { label: string; icon?: string; href?: string; children?: NavNode[]; end?: boolean }` and `export const NAV: NavNode[]` — consumed by Task 3 sidebar.
- Produces: content collections `projects`, `archive`, `pages` with zod schema `{ title, tagline, stack: string[], metrics: {label,value}[], links: {label,url,color?}[], order: number, draft?: boolean }`.

- [ ] **Step 1: Write nav.test.ts** — assert NAV contains routes `/, /projects/…(6), /archive/…(8), /about/, /contact/, /shell/, /resume/`; every node with children has no href; every external node (`github`, `linkedin`, `email`) is root-level with href; `contact`+externals group flagged `end: true`.

- [ ] **Step 2: Implement src/data/nav.ts** — tree per spec §7 using Nerd-Font escapes (`\u{F0219}` file, `\u{E5FF}`/`\u{E5FE}` folder, `\u{F1860}` index, `\u{F09EB}` mail, `\u{E709}` github). cwd header `~/atharv` purple.

- [ ] **Step 3: Run tests → PASS.**

- [ ] **Step 4: Migrate content.** Read `src/data/projects.ts` and hand-author the 14 markdown files, preserving every fact (title, tagline, stack, metrics, links, descriptions). Frontmatter per schema; body = prose sections (## Highlights / ## Story / ## Stack) re-rendered as plain text buffer content. Extract About bento cells → `about.md` intro/now/stack sections; Contact → email + socials; Resume → `resume.md` placeholder ("source to be supplied").
- `src/data/readme.ts`: `export const README = { name: "ATHARV MITTAL", identity: "SECURITY × PRODUCT", pitch: "full-stack / security-trained / product-obsessed" }`.

- [ ] **Step 5: content.config.ts with zod schema; verify `astro build` collects 14+3 entries with zero schema errors.** Then `git rm src/data/projects.ts`.

- [ ] **Step 6: Commit** — `feat: nav tree config and content collections from legacy data`

---

### Task 3: Editor shell — PageLayout, sidebar tree, line-number gutter, mobile drawer

**Files:**
- Create: `src/layouts/PageLayout.astro`, `src/components/Sidebar.astro`, `src/components/TreeFolder.astro`, `src/components/NavItem.astro`, `src/components/ContentPage.astro`
- Create: `src/scripts/tree-folder.ts`, `src/scripts/nav-tree.ts`, `src/scripts/line-numbers.ts`, `src/scripts/site-sidebar.ts`
- Create: `src/pages/index.astro` (temp minimal), `tests/e2e/shell.spec.ts`

**Interfaces:**
- Consumes: NAV (Task 2), tokens/layout CSS (Task 1).
- Produces: DOM contract used by later tasks: `.content-lines` (wave target), `.line-numbers` rows, `html.wave-pending`/`html.intro-pending` classes, `<nav-tree>`/`<tree-folder>` elements, `main#main-content`, skip link.

- [ ] **Step 1: PageLayout.astro** — full `<head>` per ref §6 (charset, viewport, theme-color `#1c2225`, title pattern `"<title> ~ Atharv Mittal"`, favicon.svg, font preload); **inline boot script before any stylesheet-paint dependency**:
```js
try{
  if(localStorage.getItem('am-theme')==='Light')document.documentElement.dataset.theme='light';
  var fs=localStorage.getItem('am-font-size');if(fs)document.documentElement.style.fontSize=fs+'px';
  if(window.self!==window.top)document.documentElement.dataset.embedded='';
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('wave-pending');
    if(location.pathname==='/')document.documentElement.classList.add('intro-pending');
  }
}catch(e){}
```
Body: skip link → `<aside>` Sidebar → `<main id="main-content"><slot/></main>` → module scripts.

- [ ] **Step 2: Sidebar/TreeFolder/NavItem** render NAV recursively: one line per item, depth indent `--pad-sm + 2ch·depth`, folder `<button aria-expanded>`, current page `aria-current="page"` + green block, externals `target=_blank rel="noopener noreferrer"`, `.end` group pinned bottom via `margin-top:auto`. `<tree-folder>` custom element defined synchronously in the boot script (open state from `am-nav-open` JSON, folder containing current route forced open) — no flash.

- [ ] **Step 3: nav-tree.ts** — `role="tree"` wiring: roving tabindex; keys ↓/j ↑/k Home/End →/l expand-or-enter ←/h collapse-or-parent, Space activates; folder toggles persist via `setJSON('nav-open',…)`; keyboard-origin navigation sets `sessionStorage['nav-tree-restore-focus']` and re-focuses `.is-current` on next load.

- [ ] **Step 4: line-numbers.ts** — gutter builder: rows = `Math.round(Math.max(contentHeight, viewportRemaining)/19)`; rows 1..contentRows numbered, rest `~`; rAF-throttled recompute on ResizeObserver/resize/`document.fonts.ready`; `aria-hidden`; hidden ≤800px.

- [ ] **Step 5: site-sidebar.ts** — mobile Menu [+] button (fixed top-right, z-99) toggling off-canvas sidebar (`translateX(-100%)→0`, instant), overlay tap + link click closes. Embedded mode (`[data-embedded]`) hides sidebar/menu.

- [ ] **Step 6: e2e smoke** — `tests/e2e/shell.spec.ts` (Playwright): `/` renders sidebar + main; gutter numbers right-aligned; two-tone background (getComputedStyle base vs surface0); mobile viewport → Menu button works; keyboard j/k moves tree focus; current item has green background. Run → PASS.

- [ ] **Step 7: Commit** — `feat: editor shell — layout, nav tree, gutter, mobile drawer`

---

### Task 4: Components — buttons, feature-blocks, popup windows

**Files:**
- Create: `src/components/Button.astro`, `src/components/FeatureBlock.astro`
- Create: `src/scripts/popup-window.ts`, `src/scripts/feature-block.ts`
- Create: `tests/popup-bounds.test.ts`

**Interfaces:**
- Produces: `<popup-window>` element API: created via `openPopup(src, type, title)` exported from popup-window.ts (used by Task 5 pages). `.button` markup contract, `feature-block[data-kind=media|embed|code]` markup contract for the remark pass in Task 5.

- [ ] **Step 1: Button.astro** — chip markup per ref §4.4: `<a class="button" style="--link-color:var(--color-green)"><span class="button-inner"><span class="button-icon" aria-hidden="true">{icon}</span>{label}</span></a>`; CSS: surface1 chip, hover surface2 + translateY(-1px) under `@media (hover:hover)`, instant (no transition).

- [ ] **Step 2: FeatureBlock.astro + feature-block.ts** — fieldset-legend title chip `[−]/[+]` (`toggle-indicator` pattern), collapse = `max-height:19px;overflow:hidden`, expand anywhere-on-block, collapse only via chip; persist `am-feature-open:<idx>-<title>`; media height snap to `Math.round(w·(naturalH/naturalW)/19)·19` px; embed click-catcher → `data-embed-active` (green outline, iframe pointer-events), document click deactivates.

- [ ] **Step 3: Write popup-bounds.test.ts** (pure functions first):

```ts
import { describe, it, expect } from 'vitest';
import { clampRect, parseSavedRect } from '../src/scripts/popup-window';
describe('popup bounds', () => {
  it('clamps restored rect into viewport', () => {
    expect(clampRect({ x: 5000, y: -200, w: 900, h: 700 }, 1280, 800))
      .toEqual({ x: 380, y: 0, w: 900, h: 700 });
  });
  it('rejects corrupt saved rect', () => {
    expect(parseSavedRect('{bad json', 1280, 800)).toBeNull();
    expect(parseSavedRect('{"x":"a"}', 1280, 800)).toBeNull();
  });
  it('enforces min size 200x150', () => {
    expect(clampRect({ x: 0, y: 0, w: 50, h: 20 }, 1280, 800).w).toBe(200);
  });
});
```

- [ ] **Step 4: Run → FAIL; implement popup-window.ts** — `<popup-window>` per ref §7.5: 66%×66% centred + 40px cascade, drag (pointer capture, grabbing cursor), se-resize handle, z = 100 + MRU index, Esc/outside-click closes top-most, title click <3px opens new tab, `role="dialog"`, focus → close button, restore on close, per-src rect via `am-popup-bounds:<src>` (through `getJSON` — corrupt values handled), ≤800px short-circuits to `window.open`. Include exported `clampRect/parseSavedRect`. Run tests → PASS.

- [ ] **Step 5: Commit** — `feat: button chips, feature-blocks, draggable popup windows`

---

### Task 5: Pages — all routes + markdown pipeline

**Files:**
- Create: `src/pages/index.astro` (hero), `src/pages/projects/index.astro`, `src/pages/projects/[slug].astro`, `src/pages/archive/index.astro`, `src/pages/archive/[slug].astro`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/resume.astro`, `src/pages/shell.astro` (mounts Task 11 element), `src/pages/404.astro`
- Create: `src/plugins/remark-editor.mjs` (registered in astro.config)
- Modify: `tests/e2e/shell.spec.ts` → add route coverage

**Interfaces:**
- Consumes: everything from Tasks 1–4; content collections (Task 2).

- [ ] **Step 1: remark-editor plugin** — walk mdast: (a) insert `aria-hidden` `&nbsp;` paragraph pairs before each h2 (2) and singles before h3/after lists (ref §2.5); (b) wrap inline links in `.button` spans (color via `?color=pink` query or frontmatter map); (c) `:::block kind=media|embed|code title=…` directives → feature-block HTML.

- [ ] **Step 2: index.astro (hero)** — `.disable-max-width` variant (no 100ch cap); vertically centred on the line grid via `center-spacer` paragraphs computed in JS (`Math.floor((innerHeight − top − height)/2/19)`); real `<h1>{README.name}</h1>` + pitch `<p>` (these get `color:transparent;user-select:none` once Task 8's ASCII heading layer mounts, with `aria` intact); CTA `.cta-row` Explore button → `/projects/`; `<div class="ascii-container">` mount point for Task 7/8.

- [ ] **Step 3: projects/archive index + case-study pages** — index lines: button + `: tagline`; case-study template per ref §2.3 adapted: h1, h2 tagline, stack icon-list (button chips per tech), ## Highlights with metrics rendered as `<strong>`-free plain lines (`value — label`), ## Story prose, Links buttons, "Next project →" button cycling by `order`.

- [ ] **Step 4: about/contact/resume/404** — about: text buffer from pages/about.md; contact: hero-style centered mailto button `data-boid-anchor` with lamp icon `\u{F1A26}`→hover `\u{F1A25}` + seo-only h1/h2; resume: placeholder buffer; 404: hero-style "lost in the buffer" + Return button (`\u{F0A54}`), ASCII meadow mount point (reuse home rain with bloom char `×` — configured in Task 8).

- [ ] **Step 5: shell.astro** — minimal: `<site-terminal></site-terminal>` inside the content pane (element defined by Task 11; page ships a graceful loading line until then).

- [ ] **Step 6: e2e** — extend Playwright: all 18+ routes return 200 and contain `.content-lines`; case-study "Next project" cycles; popup interceptor works on a bookmarks-style link; reduced-motion emulation loads pages with content visible immediately (no wave-pending left hanging). Run → PASS.

- [ ] **Step 7: Commit** — `feat: all routes and markdown pipeline`

---

### Task 6: Motion — text wave, hover wave, boot classes

**Files:**
- Create: `src/scripts/text-wave.ts`, `src/scripts/button-hover-wave.ts`
- Create: `tests/wave-timing.test.ts`
- Modify: `src/layouts/PageLayout.astro` (wire wave after fonts.ready)

**Interfaces:**
- Produces: `runTextWave(root): Promise<number>`, `attachHoverWave(doc)`. Consumes `html.wave-pending`.

- [ ] **Step 1: Write wave-timing.test.ts** — pure phase math (no DOM):

```ts
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
```

- [ ] **Step 2: Run → FAIL; implement text-wave.ts** — splitter: targets `p, li, h1–h6, blockquote, .astro-code .line` in viewport, nonempty, not in `[data-text-wave="skip"]`, leaf-ish; per-word `.wv-word` + per-char `.wv-char` (opacity 0) + `.wv-space`; rAF driver shows chars at `blockStart + phase·500ms` with 40ms symbol slots then real char; `.button-inner` transparent → `transition:background-color 400ms linear` back; `normalize()` restore on completion; returns maxDelay. Exported pure `charDelay/blockStart`. Run → PASS.

- [ ] **Step 3: button-hover-wave.ts** — pointerenter on `.button` (hover-capable, not reduced-motion, not while `wave-pending`, not `[data-no-hover-wave]`): 30ms slots, left→right offsets ≤ `cols·20ms`, restore plain text after.

- [ ] **Step 4: Wire in PageLayout** — after `document.fonts.ready` + 1 rAF: `runTextWave(document.querySelector('.content-lines'))` then remove `wave-pending`. Reduced-motion: remove class immediately, no split.

- [ ] **Step 5: e2e** — Playwright: page load → chars appear staggered (assert opacity transitions over ~1s), final DOM equals original textContent; reduced-motion context → instant. Run → PASS.

- [ ] **Step 6: Commit** — `feat: glitch text wave and hover wave`

---

### Task 7: ASCII engine — surface, renderer, rain

**Files:**
- Create: `src/scripts/ascii/surface.ts`, `src/scripts/ascii/renderer.ts`, `src/scripts/ascii/rain.ts`
- Create: `tests/ascii-surface.test.ts`, `tests/rain.test.ts`

**Interfaces:**
- Produces: AsciiSurface/AsciiRenderer/AsciiProgram (Shared Interfaces) + `makeRain(opts): AsciiProgram` where `opts = { density: number; minLen: number; maxLen: number; minSpeed: number; maxSpeed: number; color: string; onBottomHit?: (x: number) => void; onCell?: (x,y,drop) => void }` — reused by home (Task 8), meadow/404, and configurable.

- [ ] **Step 1: ascii-surface.test.ts**:
```ts
import { describe, it, expect } from 'vitest';
import { AsciiSurface } from '../src/scripts/ascii/surface';
describe('AsciiSurface', () => {
  it('ignores out-of-range writes', () => {
    const s = new AsciiSurface(4, 3);
    expect(() => s.set(9, 9, '|')).not.toThrow();
    s.set(9, 9, '|'); s.set(1, 1, '|');
    expect(s.dirtyRows()).toEqual([1]);
  });
  it('run-length groups same-colour cells', () => {
    const s = new AsciiSurface(5, 1);
    s.set(0, 0, '|', 'red'); s.set(1, 0, '|', 'red'); s.set(2, 0, '-', 'blue');
    expect(s.rowRuns(0).map(r => r.text)).toEqual(['||', '-']);
  });
  it('clears a row to spaces when cells reset', () => {
    const s = new AsciiSurface(3, 1);
    s.set(0, 0, '|'); s.flush();
    s.set(0, 0, ' ');
    expect(s.rowRuns(0)[0].text.trim()).toBe('');
  });
});
```

- [ ] **Step 2: Implement surface.ts → PASS** (cells array, per-row min/max dirty, run builder, resize reallocs).

- [ ] **Step 3: renderer.ts** — measures cell metrics via hidden 5×20 `X` `<pre>` in target font; builds `<pre class="ascii-overlay">` + row divs; per-frame: program.update(surface, ctx) → dirty rows → regenerate only changed runs (diff cached spans, touch `textContent`/`className` only when changed); colour pairs → lazily generated classes via `CSSStyleSheet.insertRule`; rAF with `delta = min(acc, max(0.1, 1/fps))`, pause on `visibilitychange`; pointer → cell coords into `ctx.cursor`.

- [ ] **Step 4: rain.test.ts** (deterministic RNG injected):
```ts
it('maintains floor(cols*density) drops', () => { /* seed rng, run 60 frames, count drops */ });
it('drop dies after tail passes bottom and onBottomHit fires with column', () => { /* … */ });
it('out-of-range columns never write (surface stays clean)', () => { /* … */ });
```
Implement rain.ts per ref §8.2 (`|` glyph, trail, speed/length ranges, spawn `y=-rand*10`); pointer-spawned drops via opts hook (wired in Task 8). Run → PASS.

- [ ] **Step 5: Commit** — `feat: zero-dependency ascii renderer and rain field`

---

### Task 8: The AM monogram — glyph, rain-hatch logo, bloom, home intro

**Files:**
- Create: `assets/mark/am-monogram.svg` (original design), `scripts/add-glyph.py` (FontForge), `public/fonts/IosevkaTermNF-AM.woff2` (rebuilt)
- Create: `src/scripts/ascii/logo-mask.ts`, `src/scripts/ascii/home.ts`
- Create: `tests/logo-mask.test.ts`
- Modify: `src/pages/index.astro`, `public/favicon.svg`

**Interfaces:**
- Consumes: AsciiRenderer + makeRain (Task 7), runTextWave (Task 6), unlock (Task 9 — wire via dynamic import guard so Task 8 lands first if needed: `import('../trophies.js').then(m=>m.unlock?.('complete-the-mark'))`).

- [ ] **Step 1: Design the AM monogram** — draw `assets/mark/am-monogram.svg`: bold geometric conjoined A+M, single-weight strokes that read at glyph size (1000upm canvas, advance 500). Original work; do not trace anyone's logo. Insert at U+100000 via FontForge script `scripts/add-glyph.py` (import SVG outline → set glyph width 500 → regenerate woff2), then re-run the Task 1 subset command. Update `public/favicon.svg` to the same mark (cream circle, dark glyph, per ref §6 favicon recipe).

- [ ] **Step 2: logo-mask.test.ts**:
```ts
it('rasterises glyph to cell mask with 50% coverage threshold', () => { /* fake 8x8 canvas alpha data → expected mask cells */ });
it('ring index increases with distance from centre', () => { /* … */ });
it('completion fires exactly once when all face cells filled', () => { /* drive drops over mask; count onLogoComplete calls === 1 */ });
```

- [ ] **Step 3: Implement logo-mask.ts + home.ts** per ref §8.3: 4× supersampled offscreen canvas of the U+100000 glyph at `logoScale` (0.5 desktop / 0.9 ≤700px), aspect-corrected, centred; coverage ≥50% → mask cell; ring index `min(255, round(hypot((x-cx)*aspect, y-cy)/8))`; drops entering mask get `logoDrag 0.3–0.7`, per-row 30% turn chance toggling drift −1/0/+1; face chars `1→"/" 2→"|" 3→"\"` in surface2 permanently; completion → bloom: `bloomColors[(ring − floor(time*8)) mod 12]` = [red,orange,yellow,lime,green,aqua,skye,snow,blue,purple,pink,cherry]; fire trophy unlock. Headings: h1/h2 DOM lines transparent; engine draws their strings centred via glitch-reveal (0.5s diagonal, 0.33s glitch at 0.067s slots from `! @ # $ % & * ? ~ < > | /`); rain trail overlap re-triggers a char's glitch. Run → PASS.

- [ ] **Step 4: Intro choreography** (ref §7.2) in home.ts: `intro-pending` hides sidebar/trophies/menu; rain starts at load → heading reveal → CTA wave → `D+900ms` → sidebar cascade (items i·60ms, icon glitch `=~-~=` 40ms, current item green bg fades 300ms) → remove `intro-pending`. Skip ≤700px (Menu button gets the wave only). Pointer/click spawns user rain drops that paint face cells green.

- [ ] **Step 5: e2e** — Playwright desktop: `/` shows rain overlay behind heading; after ~3s sidebar visible; reduced-motion → everything visible immediately, rain without introReveal. Run → PASS.

- [ ] **Step 6: Commit** — `feat: AM monogram glyph, rain-hatch logo and bloom, home intro`

---

### Task 9: Trophies + drawer + the moth

**Files:**
- Create: `src/scripts/trophies.ts`, `src/scripts/trophy-drawer.ts`, `src/scripts/moth.ts`, `src/scripts/marquee-text.ts`, `src/scripts/ascii/steering.ts`
- Create: `tests/trophies.test.ts`, `tests/steering.test.ts`
- Modify: `src/layouts/PageLayout.astro` (mount `<trophy-drawer>`)

**Interfaces:**
- Produces: TROPHIES/unlock/isUnlocked/unlockedCount (Shared Interfaces); `arrive(out,pos,vel,target,opts)` steering fn reused by Task 10.

- [ ] **Step 1: Define the 7 trophies (original names/copy/icons):**
| id | Unlocked title | Trigger |
|---|---|---|
| `first-visit` | **WELCOME IN** — "Visit the buffer" | any page load |
| `explorer` | **PATHFINDER** — "Open 5+ pages" | `am-trophy-visits` ≥5 distinct pathnames |
| `gander` | **PEER REVIEW** — "Interact with a project embed" | click inside `.fb-embed-catcher` on `/projects/*` |
| `secret` | **BREACH** — "Find the terminal's secret" | terminal `secret` command (Task 11 dispatch hook) |
| `complete-the-mark` | **CLOSER** — "Complete the monogram" | home logo completion |
| `reach-out` | **SIGNAL** — "Reach out!" | pointerover contact CTA **or** any mailto click |
| `free-the-moth` | **NIGHT SHIFT** (rare) | all six above unlocked |

- [ ] **Step 2: trophies.test.ts** — unlock returns false twice; persistence across "reload" (fresh store read); `trophy:unlocked` event detail; rare trophy auto-unlocks only when all six set; corrupt `am-trophy-visits` resets to []. Implement trophies.ts → PASS (uses persistent.ts).

- [ ] **Step 3: steering.test.ts** — `arrive` clamps force to maxForce; speed scales down inside arriveRadius; zero-distance doesn't NaN. Implement steering.ts → PASS (seek+arrive per ref §17.3 snippet).

- [ ] **Step 4: trophy-drawer.ts** — bottom-right fixed, toggle `Trophies [n/7] [+]`, open state `am-trophy-ui:open`; cards: locked = `?`-masked title (mask length = title length), overlay2 text; unlocked = colour-tinted bg `color-mix(in srgb, color 20%, surface1)` (10% locked) + marquee description (`<marquee-text>`: overflow-only, linear hold-return loop, reduced-motion off); toasts: inert clone, 1px flashing outline (0.4s step-end), 5s ttl, `role=status aria-live=polite`, waits for wave/intro-pending clear (rAF poll, 4s cap).

- [ ] **Step 5: moth.ts** — caged `/\`-`\/` flap in last card (overlay2 → aqua when freed); on free: reparent to fixed `.moth-host`, seek-orbit pointer (ellipse rx 44, one orbit/2.9s, wobble, re-randomise every ~2.5s), wander when idle>4s/no-hover; click cage toggles return; state persisted to sessionStorage `am-moth-state` every 250ms + pagehide, restored next page; reduced-motion → never starts.

- [ ] **Step 6: e2e** — unlock explorer by visiting 5 routes → toast appears, count 2/7; state survives reload. Run → PASS.

- [ ] **Step 7: Commit** — `feat: trophy system, drawer, marquee, cursor moth`

---

### Task 10: Contact boids + lamp glow

**Files:**
- Create: `src/scripts/ascii/boids.ts`, `src/scripts/contact.ts`
- Create: `tests/boids.test.ts`
- Modify: `src/pages/contact.astro`

- [ ] **Step 1: boids.test.ts** — flock of N with deterministic rng: separation increases min pairwise distance vs no-separation baseline; flee steering points away from pointer within 7 cells; gather moves mean position toward anchor within T frames; no NaN at zero distance.

- [ ] **Step 2: Implement boids.ts** per ref §11: 48 (24 ≤700px) boids as `/\`-`\/` 2-cell sprites; roam targets (margin 2, arriveRadius 2, reroll <1.5), maxSpeed 32 cells/s aspect-corrected, separation weight 1.6; flee radius 7 (×1.6 speed, ×1.8 flap); gather on `[data-boid-anchor]` pointerover (×2.3, alignment 1 + cohesion 0.6, arriveRadius 4, colours cycle [green,yellow,orange,pink,purple,blue,aqua]); lamp glow field: `/` chars ramp surface0→green over 4 bands radius 12 cells, eases in `1−exp(−5dt)`, 0.3Hz pulse; 0.33s glitch trails under moths; anchor label chars scramble when moths pass. Uses steering.ts.

- [ ] **Step 3: contact.ts** — start flock `950ms + waveDelay` after load; lamp icon swap on hover; reduced-motion → renderer never starts. Wire in contact.astro.

- [ ] **Step 4: Commit** — `feat: contact moth flock with lamp glow`

---

### Task 11: The terminal — `<site-terminal>` rewrite

**Files:**
- Create: `src/scripts/terminal/fs.ts` (virtual filesystem data), `src/scripts/terminal/machine.ts`, `src/scripts/terminal/site-terminal.ts`, `src/scripts/terminal/matrix.ts`
- Create: `tests/terminal-machine.test.ts`
- Modify: `src/pages/shell.astro`

**Interfaces:**
- Produces: `createMachine()` (Shared Interfaces). All commands from the React original with meadow copy.
- Consumes: `unlock('secret')`-equivalent via document event for Task 9's `secret` trophy.

- [ ] **Step 1: Port the filesystem + command table.** Read `src/routes/SecurityPortfolio.tsx` (git history: `git show main:src/routes/SecurityPortfolio.tsx`) and extract the virtual FS tree, command list, easter eggs (matrix, cowsay, secret, stats, neofetch art) into `fs.ts` as plain data + `machine.ts` handler map. Re-theme output: errors red, paths green, strings lime; strip neon `#00ff41`/`#ff4d00`.

- [ ] **Step 2: terminal-machine.test.ts** (write first):
```ts
const m = createMachine();
it('empty input echoes a prompt line with no output', () => { expect(m.exec('', s0).lines).toEqual([]); });
it('unknown command → "command not found" error line', () => { /* contains 'not found' */ });
it('cd missing dir → error, cwd unchanged', () => { /* … */ });
it('cd .. at root stays at root', () => { /* … */ });
it('cat directory → "is a directory" error', () => { /* … */ });
it('clear sets clear flag', () => { expect(m.exec('clear', s0).clear).toBe(true); });
it('exit → navigate "/"', () => { expect(m.exec('exit', s0).navigate).toBe('/'); });
it('secret dispatches trophy hook', () => { /* document event captured */ });
it('200-char input line handled without throw', () => { /* … */ });
it('history records commands', () => { /* … */ });
```
Implement machine.ts → PASS (pure functions; ~250–350 lines).

- [ ] **Step 3: site-terminal.ts** — custom element: boot sequence lines (typewriter 8ms/char, skippable on keypress), input line with block cursor, output renderer, tab autocomplete (commands + paths), ↑/↓ history, matrix rain overlay (rain.ts reuse, `matrix`/`stats` commands), CRT scanline overlay (CSS only, 1px repeating-linear — wait: **no gradients allowed** → use two alternating row background classes instead), theme via tokens. `exit` → `location.href='/'`. `secret` → dispatches `document` event consumed by trophies.

- [ ] **Step 4: e2e** — `/shell/` boots; `help` lists commands; `secret` fires trophy toast; `exit` lands on `/`. Run → PASS.

- [ ] **Step 5: Commit** — `feat: vanilla security terminal with full command parity`

---

### Task 12: Settings, persistence hardening, a11y pass

**Files:**
- Create: `src/scripts/site-settings.ts`, `src/components/SiteSettings.astro`
- Create: `tests/persistence-hardening.test.ts`
- Modify: `src/layouts/PageLayout.astro`

- [ ] **Step 1: persistence-hardening.test.ts** — poison every `am-*` key used by the site (`am-theme: "Blue"`, `am-font-size: "abc"`, `am-nav-open`, `am-popup-bounds:*`, `am-trophy-visits`, `am-feature-open:*`, `am-moth-state`) → boot script + each module reads must fall back to defaults without a single thrown error (assert via captured console.error/window.onerror in a jsdom boot harness).

- [ ] **Step 2: Implement guards** — theme validated against `Dark|Light`; font-size clamped 12–20 integer; every consumer already goes through persistent.ts — add the theme/font validators to the boot script. → PASS.

- [ ] **Step 3: SiteSettings** — top-right `[+]` panel: Theme select, Font Size (12/13/14/16/18/20), FPS/memory readout (10px UI, tabular-nums, aria-hidden). Applies instantly, persists. Draggable by title. Destroyed ≤700px.

- [ ] **Step 4: a11y audit pass** — verify against ref §14: skip link focus order, tree keyboard operability (arrow + vim keys), popup focus restore, `aria-current`, decorative layers `aria-hidden`, contrast spot-check body text `#839e9a` on `#232a2e` ≈ 5.4:1. Fix what fails; add Playwright checks for skip-link and tree keyboard flow. Reduced-motion full sweep: no wave, no intro, no rain intro-reveal, no moth/boids, marquee/toast animations off.

- [ ] **Step 5: Commit** — `feat: site settings, persistence hardening, accessibility pass`

---

### Task 13: SEO, deploy, removal of the old stack

**Files:**
- Create: `public/robots.txt`, `public/llms.txt`, `public/site.webmanifest`, `public/og.jpg` (1200×630, generate from the AM mark), `.github/workflows/deploy.yml`
- Modify: `src/layouts/PageLayout.astro` (JSON-LD graph: Person + WebSite + WebPage, own data only)
- Delete: `vite.config.ts`, any remaining React-era files; superseded docs left in history (marked in spec header)

**Interfaces:**
- Consumes: everything. This is the ship task.

- [ ] **Step 1: Meta completion** — per-page titles/descriptions, OG/Twitter tags, canonical with trailing slash; JSON-LD via a small Astro partial; manifest (name "Atharv Mittal", theme `#1c2225`, background `#f8f9e8`, maskable icons generated from the AM mark); robots (`Allow: /`, sitemap); llms.txt (title, sections, project list, contact).

- [ ] **Step 2: deploy.yml** — official `withastro/action` GitHub Pages workflow on push to `main`.

- [ ] **Step 3: Full verification gate**:
```bash
npm run test && npm run build && npx playwright test
```
Then manual QA against adapted ref §18: one font/400/19px grid; two-tone chrome; gutter `~`; wave + hover wave; rain completes the AM → bloom → trophy; popups drag/resize/persist; feature-block collapse persists; terminal command parity; moth across pages; contact flock; keyboard nav; reduced motion; Lighthouse ≥95 perf, ≤~100KB home JS.

- [ ] **Step 4: Delete old stack files, final commit** — `chore: remove react-era build files` then `feat: astro meadow portfolio complete`.

- [ ] **Step 5: Open PR `redesign/editor-portfolio` → `main`** with before/after screenshots; hand to user for approval and merge (user approval is the ship gate — the site's `main` deploy only happens on merge).

---

## Task dependency graph

```
1 ─→ 2 ─→ 3 ─→ 4 ─→ 5 ─→ 6
           │              │
           7 ─→ 8 ─→ 9 ←──┘   (9 also consumes 11's event, guarded)
           7 ─→ 10
           11 (parallel after 2)
           12 (after 4, 6)
           13 (after all)
```

Subagent-dispatchable in waves: [1] → [2] → [3] → [4+7+11] → [5] → [6+8+10] → [9] → [12] → [13].
