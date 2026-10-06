# HANDOFF — Astro "Meadow" Portfolio Rewrite
**Saved:** 2026-10-05 ~13:40 EDT (2nd checkpoint, supersedes 2026-10-04 version)
**Branch:** `redesign/editor-portfolio` · **Status: T1-T6 done + reviewed, T8+T10 implementers live**

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
| T7/T11 fix | `e4d9a7f` | overlay CSS, fps-cap freeze (last=painted frame), resolvePath ~ strip; re-review APPROVED |
| T5 Routes | `4362a19`+`41e9ec2` | 22 routes (hero/index/case-study/404), remark-editor registered + soft-wrap split, hero chrome CSS, contact CTA+lamp+popup chips, routes e2e 27; review APPROVED (metrics template lines dropped after adjudication) |
| T6 Wave | `11c34b7`+`418e87a` | text-wave + hover wave (ref §7.3 exact), wave-pending try/finally contract with fault-injection e2e; review APPROVED; hardening commit |

**T7+T11 review COMPLETED — findings FIXED (commit e4d9a7f, scoped re-review APPROVED).**
Fix details in the ledger ("Task 7 fix round 1/5", "Task 11 fix round 1/5"; reviewer
note: Task 8 must pass an explicit pointerTarget — container and overlay are both
pointer-events:none). Deferred minors live in the ledger's fix-round records.

## 4. Task 5 (all routes + markdown pipeline) — DONE (implemented inline)

Commit `4362a19` (fix round pending review — reviewer dispatched, verdict may
add fixes; see ledger section "## Task 5" for composition notes).

Done:
1. remark-editor.mjs registered in astro.config.mjs + EXTENDED: soft-wrapped
   single-newline paragraphs split into separate buffer lines (5 unit tests).
2. index.astro hero — center-spacers marker, README h1+pitch, Explore CTA,
   ascii-container mount, attachCentering wired (same in contact/404).
3. projects/index + [slug], archive/index + [slug] — case-study template,
   next-project cycling by order, empty-tolerance (seo-only h2 fallback).
4. about.astro, contact.astro (hero mailto CTA, data-boid-anchor, lamp
   glyph hover swap + popup-linked GitHub/LinkedIn chips), resume.astro,
   404.astro ("lost in the buffer", Return button, ascii mount).
5. e2e routes.spec.ts: 21 routes 200 + .content-lines + h1, 404 doc, next
   cycle, index lines, popup interceptor, reduced-motion.
6. Gates: vitest 39/39, astro build 22 pages, playwright 39/39.

Known tension awaiting reviewer adjudication: metrics `value — label` lines
duplicate every featured entry's identical `Impact:` sentence (T2 data has
both). Reviewer may rule to drop the template metrics lines.

## 5. Remaining after T5 (wave order)

```
done: 1 2 3 4 5 6 7 11
[live: 8+10 parallel] → [9] → [12] → [13]
(steering.ts ruling: T10 creates it per plan T9 Step 3; T9's moth consumes)
```

| # | Task | Special care |
|---|---|---|
| 6 | Text wave + hover wave | Test code IN plan. `= ~ - ~ =` 40ms slots, diagonal phase, normalize() restore. **MUST remove `wave-pending` class even on error, or pages render blank** (T3 review note). Wire in PageLayout after fonts.ready. |
| 8 | AM monogram + rain-hatch + bloom + intro | **Design the AM glyph FIRST** (assets/mark/am-monogram.svg, 1000upm canvas, FontForge insert at U+100000, rebuild subset incl. NF icons — replaces interim font). logo-mask tests IN plan. Trophy unlock via guarded dynamic import. Intro choreography ref §7.2. Pass an explicit `pointerTarget` to the renderer — container and overlay are both pointer-events:none (T7 re-review note). |
| 9 | Trophies + drawer + moth | 7 trophies listed above; steering.ts (test in plan) shared with T10; drawer bottom-right `[n/7]`, `?`-masked locked cards, step-end flashing toasts 5s; moth caged→free, orbits cursor (ellipse rx44, ~2.9s/orbit), sessionStorage continuity across pages, recall on cage click. Listens for `trophy:secret` event (T11 dispatches it) and logo-completion. |
| 10 | Contact boids + lamp | 48/24 boids (2-cell `/\` `\/` sprites), flee within 7 cells, gather on `[data-boid-anchor]` hover, `/`-char lamp glow field (surface0→green 4 bands), 0.33s glitch trails, start 950ms+wave after load. Uses T7 engine + T9 steering. |
| 12 | Settings + hardening + a11y | Poison-pill test EVERY am-* key + fix fallbacks; Site Settings panel (theme/font-size 12–20/FPS); fold `astro build &&` into playwright webServer command (T3 minor); full reduced-motion sweep; skip-link/popup-focus/tree-keyboard checks. |
| 13 | SEO + deploy + teardown | titles `"<Page> ~ Atharv Mittal"`, OG/Twitter, JSON-LD (own data), robots/llms.txt/manifest, og.jpg from AM mark, favicon from AM mark, GH Actions Pages workflow, delete react-era leftovers (vite.config etc. already gone — check `dist/`, README), verification gate `npm run test && astro build && playwright test`, adapted ref §18 QA, **open PR → hand to user for approval/merge**. |

## 6. Process notes (SDD loop as actually practiced)

- Per task: record BASE → implementer subagent (fresh, sonnet default / haiku for tiny
  fix re-reviews) with brief path + interfaces + report path → review-package
  (`bash <skill>/scripts/review-package PLAN BASE HEAD` FROM REPO ROOT) → reviewer →
  fix loop (resume implementer r1-3, fresh+bump r4-5, adjudicate at cap).
- ⚠️ `node_modules/.astro/data-store.json` (content store) is keyed on md-file hash
  only, NOT the remark plugin — after ANY plugin edit run `rm -rf node_modules/.astro`
  before gates or you verify stale render output.
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

## 8. Test suite state (at 4362a19)

`npx vitest run` → 39 unit green (persistent 3, nav 4, popup-bounds 3, surface 3,
rain 3, terminal-machine 16, ascii-renderer 1, remark-editor 6).
`npx playwright test` → 39 e2e green (shell 8, terminal 4, routes 27).
`npx astro build` green (22 pages).

## 9. RESUME PROMPT (paste into a fresh session)

> Resume the astro-meadow rewrite in C:\Users\athar\atharv109.github.io (branch
> redesign/editor-portfolio). Read HANDOFF.md at the repo root FIRST, then
> .superpowers/sdd/2026-10-04-astro-meadow-redesign/progress.md (the ledger), then the
> plan docs/superpowers/plans/2026-10-04-astro-meadow-redesign.md. Use
> superpowers:subagent-driven-development; if subagent dispatches 429, implement inline
> per HANDOFF §6. State: T1-T4, T7, T11 done and reviewed; T7/T11 fix round committed
> (e4d9a7f) and re-review APPROVED; Task 5 committed (4362a19) with its reviewer
> dispatched — read the ledger's T5 section and .superpowers/sdd/.../task-5-review-report.md
> for verdict/fixes, run any fix round it requires, then close T5. Then proceed to the
> wave [6+8+10 parallel] — note T8's special care in §5 (AM glyph FIRST, pointerTarget),
> then T9 → T12 → T13 (§5). If the T5 reviewer verdict is pending in a fresh session,
> check for task-5-review-report.md in the SDD workspace first.> State: T1-T7, T11 done and reviewed (T7/T11 fix round e4d9a7f re-APPROVED); T5
> done+reviewed (4362a19+41e9ec2); T6 done+reviewed (11c34b7+418e87a); T8 (AM monogram
> - USER CHOSE shared-stem ligature; brief task-8-brief.md has glyph coords + the
> no-FontForge font pipeline) and T10 (boids, creates steering.ts) implementers were
> dispatched in parallel - check git log + task-N-report.md for what landed, dispatch
> their reviewers if missing, run their fix rounds. Then T9 -> T12 -> T13 (section 5).
> Parallel-wave process note: reviewers must verify at the COMMIT TREE (throwaway
> worktree) - working-tree churn and stale preview servers poison gate runs.
