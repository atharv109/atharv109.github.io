# Task 3 report — editor shell (CONTROLLER-COMPILED)

The original implementer (sonnet) completed all files and reported "Build is green. Running
unit tests and the e2e suite" when it was killed by an API 429 before committing or writing
this report. The controller subsequently verified and committed its work unchanged.

## What landed (commit 94b0e0b, 15 files, +797/-17)
- src/layouts/PageLayout.astro — head (charset/viewport/theme-color/title pattern/font preload),
  inline boot script (am-theme, am-font-size, embedded detection, wave-pending/intro-pending
  gated on reduced-motion), skip link, aside+main grid shell
- src/components/Sidebar.astro + TreeFolder.astro + NavItem.astro — recursive NAV render,
  one-line items, depth indent, folder glyphs \u{E5FE}/\u{E5FF} wired (T2 review debt closed),
  server-side open-state resolution for the folder containing the current route (no flash)
- src/components/ContentPage.astro — content-wrapper/content-page/content-row/content-lines
  contract per plan
- src/scripts/tree-folder.ts + nav-tree.ts — roving tabindex, arrows + j/k/h/l, Home/End,
  Space activates, folder persistence via persistent.ts, keyboard-nav focus restore
- src/scripts/line-numbers.ts — gutter rows numbered to content height then `~`, rAF-throttled
  recompute (ResizeObserver/resize/fonts.ready), aria-hidden
- src/scripts/site-sidebar.ts — mobile Menu [+] off-canvas toggle + overlay/link close;
  embedded mode hides chrome
- playwright.config.ts (build + preview on :4321), tests/e2e/shell.spec.ts (7 tests)
- src/pages/index.astro now mounts the shell; tokens.css layout refinements; vitest config tweak

## Verification (controller-ran, after the interruption)
- `npx astro build` — 1 page built, Complete (twice)
- `npx vitest run` — 2 files, 7/7 passed
- `npx playwright test tests/e2e/shell.spec.ts` — 7/7 passed (sidebar render, gutter alignment,
  two-tone bg, sticky sidebar while scrolling, mobile Menu toggle, j/k tree focus,
  aria-current + green block)

## Fix round 1 (review Important): synchronous folder-state restore in boot script
- Problem: `customElements.define('tree-folder')` + `am-nav-open` restore ran in a
  deferred type=module script (tree-folder.ts module eval); closed folders could
  paint before the restore snapped them open on slow loads.
- Fix (src/layouts/PageLayout.astro head boot script, same try/catch, dependency-free):
  parse `am-nav-open` once, then `customElements.define('tree-folder', …)` inline with a
  `connectedCallback` that applies/removes `open` per the saved label and drops
  `data-persist`. Because the element is registered in <head>, each `<tree-folder>`
  upgrades as the parser reaches it — final open/closed state at first paint. Matches
  ref spec §7.1. Server-side forced-open for the current branch untouched (no
  `data-persist` marker).
- tree-folder.ts now never re-applies saved state: keeps a guarded `define()` (no-op
  once the boot class is registered), moves click-toggle/persist to a document-delegated
  listener, and does a one-time `aria-expanded` sync at module eval (during parsing, a
  folder's connectedCallback ran before its summary button existed, so the button's aria
  needs correcting post-parse; visual state was already correct pre-paint).
- Bug found while fixing: TreeFolder.astro passed `open={forceOpen}` which Astro rendered
  as `open="false"` (attribute PRESENT) — folders looked open and `toggleAttribute` could
  not clear the value. Now spread-omitted: `{...(forceOpen ? { open: '' } : {})}`.
- Covering check: new e2e test `saved folder open state is applied synchronously at first
  paint` seeds `am-nav-open` via addInitScript (before any page script) and asserts
  `projects` renders `[open]` + `aria-expanded=true` and `archive` stays closed.
- Re-ran: `npx astro build` green; `npx vitest run` 7/7;
  `npx playwright test tests/e2e/shell.spec.ts` — 8/8 passed.
