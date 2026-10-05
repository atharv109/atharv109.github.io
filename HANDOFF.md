# HANDOFF — Astro "Meadow" Portfolio Rewrite
**Saved:** 2026-10-05 ~13:40 EDT (2nd checkpoint, supersedes 2026-10-04 version)
**Branch:** `redesign/editor-portfolio` · **Status: 5.5/13 tasks done, Task 5 in flight**

> **Resume instructions for any future session/model are at the bottom (§9).**

## 1. What we're building

Full rewrite of atharv109.github.io as an **Astro static MPA** that feels like
digitalmeadow.studio: one code-editor window — left file-tree sidebar, line-numbered
buffer (vim `~` gutter), ASCII rain that hatches an **AM monogram** into existence and
blooms rainbow rings when complete, glitch text-wave reveals, draggable popup windows,
feature-blocks, a trophy drawer (7 achievements), a cursor-following ASCII moth,
contact-page boids with a lamp glow, and the security terminal rewritten as a vanilla
`<site-terminal>` custom element at `/shell/`.

**Stack locks (non-negotiable):** Astro + vanilla TS custom elements only. NO React,
Tailwind, GSAP, Lenis, Three.js, no CSS framework, no animation library. One font
(Iosevka Term NF subset, weight 400 only), root 14px, line-height 19px, `1ch == 7px`.
Dark "meadow" palette default; light opt-in only via `data-theme="light"`. No
border-radius/shadows/gradients/easing — depth via 1px outlines + background steps;
motion is rAF-driven, linear/step-end. Everything vertical snaps to 19px lines; blank
lines are real `<p aria-hidden>&nbsp;</p>`.

**Key documents:**
- Spec: `docs/superpowers/specs/2026-10-04-astro-meadow-redesign-design.md`
- Plan (13 tasks, exact values + test code + dependency waves):
  `docs/superpowers/plans/2026-10-04-astro-meadow-redesign.md`
- Authoritative mechanics reference (scraped digitalmeadow.studio):
  `C:\Users\athar\Downloads\digital-meadow-reference\dm-ref\spec-source.md`
  (cited as "ref §N"; screenshots in `dm-ref/screens/`)
- SDD workspace (ledger, per-task briefs, reports, review diffs — git-ignored by design):
  `.superpowers/sdd/2026-10-04-astro-meadow-redesign/` — **read progress.md first**

## 2. Decisions locked (don't re-litigate)

1. Astro MPA rewrite (not React SPA).
2. Terminal: vanilla TS rewrite of the 893-line React original — DONE (Task 11).
3. Full feature set incl. trophies + moth + contact boids.
4. Mark = **AM monogram glyph at U+100000**; home rain hatches it; completion blooms.
5. Clean replacement on `redesign/editor-portfolio` → PR to `main`; merge = user approval.
6. No blog/bookmarks/field-studies; control panel reduced to Site Settings + FPS readout.
7. Original content only (tokens/timings/algorithm constants from ref OK; text/photos/
   flower glyph/trophy names NO).
8. Trophy set (plan Task 9): WELCOME IN, PATHFINDER, PEER REVIEW, BREACH (terminal
   secret), CLOSER (complete the mark), SIGNAL (reach out), rare NIGHT SHIFT frees moth.
9. Persistence: `am-` prefix via `src/scripts/persistent.ts` (never-throw JSON helpers).
10. Terminal matrix effect is self-contained (`terminal/matrix.ts`) — does NOT import
    the ASCII engine (pre-flight ruling).
11. Popup windows use `overflow:visible` (not the ref's `hidden`) — required for the
    legend-on-border title chip; content clipping lives on `[data-popup-border]`.
12. Folder open-state restore runs synchronously in the inline boot script (fix applied).

## 3. Done (committed + reviewed)

| Task | Commits | What landed |
|---|---|---|
| T1 Scaffold | `7a0bb4c`, fix `b49cf7d` | Astro skeleton, tokens.css (25 tokens dark+light, verified exact vs ref §4.1), reset/layout css, persistent.ts + tests, font subset script, interim stock Iosevka Term 34.9.0 (NO NF glyphs, NO AM glyph — see `public/fonts/README.txt`), React app deleted |
| T2 Data | `b192722` | `nav.ts` (20 routes, `~/atharv` header), `readme.ts`, `content.config.ts` zod schema, **17 markdown files** (6 featured + 8 archive + about/contact/resume), facts verified verbatim from git history, legacy projects.ts deleted |
| T3 Editor shell | `94b0e0b`, fix `a2fe681` | PageLayout + inline boot script (theme/font/embed/wave classes + synchronous folder-define), Sidebar/TreeFolder/NavItem (folder glyphs wired, server-side current-branch open), nav-tree vim keys + roving tabindex, line-number gutter with `~`, mobile drawer, sync folder restore, Playwright config + 8 shell e2e tests |
| T4 Components | `062ed85`, fix `f0fe607` + tip tweak | Button.astro chips, FeatureBlock.astro (collapse persist, media line-snap, embed click-to-activate), popup-window.ts (drag/resize/Esc/persist/new-tab; clampRect+parseSavedRect tested), components.css; fixes: embed 30-line height, popup aria-labelledby |
| T7 ASCII engine | `4ce66aa` | surface.ts (cells, dirty rows, run-length w/ trailing-blank trim), renderer.ts (metric probe, dirty-row diffing, insertRule class cache, fps cap, visibility pause), rain.ts (injectable rng, spawn/top-up, onCell/onBottomHit hooks) — 6 tests |
| T11 Terminal | `b1dc418` | fs.ts (faithful port; stats archive 3→8 corrected), machine.ts PURE (13 tests: cd/cat/run/clear/exit/secret/200-char etc.), site-terminal.ts (boot seq, scramble reveal, tab complete, history arrows, glitch, Ctrl+L), matrix.ts canvas overlay, shell.astro route, terminal e2e 4/4 |

**T7+T11 review COMPLETED after checkpoint — 1 Critical + 2 Important findings, UNFIXED.**
The fixes are spelled out in the Resume Prompt (§9) step 1 and recorded verbatim in the
ledger section "T7+T11 review landed". Nothing else from that review blocks work.

## 4. Task 5 (all routes + markdown pipeline) — IN FLIGHT

Done so far (committed as `wip` checkpoint on branch tip):
- `src/plugins/remark-editor.mjs` — spacer paragraphs before h2 (×2)/h3 (×1)/after lists;
  links → `.button` chips (`?color=name` suffix support). **NOT yet registered** in
  astro.config.mjs.
- `src/scripts/center-content.ts` — hero vertical centring on the line grid.

Remaining for T5 (per task-5-brief.md):
1. Register remark plugin: `markdown: { remarkPlugins: [remarkEditorRhythm] }` in astro.config.mjs.
2. `src/pages/index.astro` hero rewrite (replace temp filler): disable-max-width, h1+
   pitch, `p#center-spacers` marker, Explore CTA → `/projects/`, `<div class="ascii-container">`
   mount (consumed by T8), wire attachCentering.
3. `projects/index.astro` + `projects/[slug].astro` (getStaticPaths from collections;
   case-study: h1, tagline, metrics as `value — label` lines, links as Button chips,
   `<Content/>` body, "Next project →" cycling by order). Same for `archive/*` (title-only lines OK).
4. `about.astro` (render pages/about.md), `contact.astro` (hero-style mailto CTA with
   `data-boid-anchor` + lamp glyph \u{F1A26}→hover \u{F1A25}, seo-only h1/h2), `resume.astro`,
   `404.astro` (hero-style, Return button \u{F0A54}, ascii mount for T8's meadow overlay).
5. e2e: new spec asserting all ~19 routes 200 + `.content-lines`; case-study next-button
   cycle; popup interceptor on a contact-page popup link; reduced-motion instant load.
6. Commit `feat: all routes and markdown pipeline`, review, loop.

## 5. Remaining after T5 (wave order)

```
done: 1 2 3 4 7 11
[5 in flight] → [6+8+10 parallel] → [9] → [12] → [13]
```

| # | Task | Special care |
|---|---|---|
| 6 | Text wave + hover wave | Test code IN plan. `= ~ - ~ =` 40ms slots, diagonal phase, normalize() restore. **MUST remove `wave-pending` class even on error, or pages render blank** (T3 review note). Wire in PageLayout after fonts.ready. |
| 8 | AM monogram + rain-hatch + bloom + intro | **Design the AM glyph FIRST** (assets/mark/am-monogram.svg, 1000upm canvas, FontForge insert at U+100000, rebuild subset incl. NF icons — replaces interim font). logo-mask tests IN plan. Trophy unlock via guarded dynamic import. Intro choreography ref §7.2. |
| 9 | Trophies + drawer + moth | 7 trophies listed above; steering.ts (test in plan) shared with T10; drawer bottom-right `[n/7]`, `?`-masked locked cards, step-end flashing toasts 5s; moth caged→free, orbits cursor (ellipse rx44, ~2.9s/orbit), sessionStorage continuity across pages, recall on cage click. Listens for `trophy:secret` event (T11 dispatches it) and logo-completion. |
| 10 | Contact boids + lamp | 48/24 boids (2-cell `/\` `\/` sprites), flee within 7 cells, gather on `[data-boid-anchor]` hover, `/`-char lamp glow field (surface0→green 4 bands), 0.33s glitch trails, start 950ms+wave after load. Uses T7 engine + T9 steering. |
| 12 | Settings + hardening + a11y | Poison-pill test EVERY am-* key + fix fallbacks; Site Settings panel (theme/font-size 12–20/FPS); fold `astro build &&` into playwright webServer command (T3 minor); full reduced-motion sweep; skip-link/popup-focus/tree-keyboard checks. |
| 13 | SEO + deploy + teardown | titles `"<Page> ~ Atharv Mittal"`, OG/Twitter, JSON-LD (own data), robots/llms.txt/manifest, og.jpg from AM mark, favicon from AM mark, GH Actions Pages workflow, delete react-era leftovers (vite.config etc. already gone — check `dist/`, README), verification gate `npm run test && astro build && playwright test`, adapted ref §18 QA, **open PR → hand to user for approval/merge**. |

## 6. Process notes (SDD loop as actually practiced)

- Per task: record BASE → implementer subagent (fresh, sonnet default / haiku for tiny
  fix re-reviews) with brief path + interfaces + report path → review-package
  (`bash <skill>/scripts/review-package PLAN BASE HEAD` FROM REPO ROOT) → reviewer →
  fix loop (resume implementer r1-3, fresh+bump r4-5, adjudicate at cap).
- **429 reality:** the kimi-k3:cloud subagents died twice on session-usage caps
  (2026-10-04 02:20 and 03:30). Tasks 4, 7, 11 were then implemented INLINE by the
  controller with reviews dispatched after (worked: cap seems per-burst; reviews on
  sonnet/haiku succeeded later). If subagents 429: implement inline, strict TDD, ledger it.
- Skill dir: `C:\Users\athar\.claude\plugins\cache\claude-plugins-official\superpowers\6.4.1\skills\subagent-driven-development\`
- All 13 briefs are already extracted in the workspace (`task-N-brief.md`). Reuse.
- `git clean -fdx` would destroy the workspace — don't run it.
- npm allow-scripts policy blocked esbuild/sharp postinstalls; `npm approve-scripts` if a
  weird native-module error appears. Playwright chromium installed at
  `C:\Users\athar\AppData\Local\ms-playwright\` (chromium_headless_shell-1243).

## 7. Deferred minors (fold into T12/T13 or final review)

- nav.test.ts lacks exact-set route count assertion (T2)
- summaryId collision if same-name folders share depth (T3)
- externals wear `nav-item--page` class (misnomer, guarded) (T3)
- no pointercancel handling on popup drags (self-heals) (T4)
- `.fb-toggle` span vs `<toggle-indicator>` pattern (T4)
- media fade-in animation fb-media-fade 0.25s linear (T4 → fold into T5 media pass)
- `overflow-x:hidden` on `<html>` — first suspect if sticky sidebar breaks (T1)
- reset.css extras beyond brief (fine) (T1)
- popup title chip random id each instance (a11y fine, snapshot-test care) (T4)

## 8. Test suite state at checkpoint

`npx vitest run` → 16+13 = 29 unit tests green (persistent 3, nav 4, popup-bounds 3,
surface 3, rain 3, terminal-machine 13). `npx playwright test` → 12 e2e green
(shell 8, terminal 4). `npx astro build` green (routes: /, /shell/).

## 9. RESUME PROMPT (paste into a fresh session)

> Resume the astro-meadow rewrite in C:\Users\athar\atharv109.github.io (branch
> redesign/editor-portfolio). Read HANDOFF.md at the repo root FIRST, then
> .superpowers/sdd/2026-10-04-astro-meadow-redesign/progress.md (the ledger), then the
> plan docs/superpowers/plans/2026-10-04-astro-meadow-redesign.md. Use
> superpowers:subagent-driven-development; if subagent dispatches 429, implement inline
> per HANDOFF §6. First actions: (1) **fix the two landing-blocker findings from the
> already-completed T7+T11 review** (recorded in the ledger's "T7+T11 review landed"
> section): T7 Critical — add CSS for `.ascii-overlay`/`.ascii-row` (absolute pre,
> block rows) or Task 8 is unbuildable; T7 Important — renderer fps-cap freeze (assign
> `last` only on painted frames); T11 Important — `resolvePath` must strip the `~`
> segment (`cd ~/projects` currently fails). Then verify build+vitest+playwright green,
> commit as T7/T11 fix round, scoped re-review, close both in the ledger. (2) Continue
> Task 5 per HANDOFF §4.
