# HANDOFF — Astro "Meadow" Portfolio Rewrite
**Saved:** 2026-10-04 ~11:45 EDT · **Branch:** `redesign/editor-portfolio` · **Status: 2/13 tasks done, Task 3 in flight (interrupted)**

> Resume instructions for any future session/model are at the bottom (§8).

## 1. What we're building

Full rewrite of atharv109.github.io as an **Astro static MPA** that feels like
digitalmeadow.studio: one code-editor window — left file-tree sidebar, line-numbered
buffer (vim `~` gutter), ASCII rain that hatches an **AM monogram** into existence and
blooms rainbow rings when complete, glitch text-wave reveals, popup windows,
trophy drawer (7 achievements), a cursor moth, contact-page boids, and the security
terminal rewritten as a vanilla `<site-terminal>` custom element at `/shell/`.

**Stack locks (non-negotiable):** Astro + vanilla TS custom elements. NO React, Tailwind,
GSAP, Lenis, Three.js. One font (Iosevka Term NF subset, weight 400 only), root 14px,
line-height 19px, `1ch == 7px`. Dark Catppuccin-derived "meadow" palette; light opt-in
only. No border-radius/shadows/gradients/easing — motion is rAF + linear/step-end.

**Key documents:**
- Spec: `docs/superpowers/specs/2026-10-04-astro-meadow-redesign-design.md`
- Plan (13 tasks, exact values + test code): `docs/superpowers/plans/2026-10-04-astro-meadow-redesign.md`
- Authoritative mechanics reference (scraped digitalmeadow.studio): `C:\Users\athar\Downloads\digital-meadow-reference\dm-ref\spec-source.md` (cited as "ref §N"; screenshots in `dm-ref/screens/`)
- SDD workspace (ledger, briefs, reports, review diffs — git-ignored, local only):
  `.superpowers/sdd/2026-10-04-astro-meadow-redesign/`

## 2. Decisions locked (all already made — don't re-litigate)

1. Astro MPA rewrite (chose option B over keeping React SPA).
2. Terminal: **vanilla TS rewrite** of the 893-line React `SecurityPortfolio.tsx` — full command parity.
3. **Full feature set** incl. trophies + moth + contact boids.
4. Mark = **AM monogram glyph at U+100000** in the font subset; rain completes it.
5. Clean replacement on `redesign/editor-portfolio` → PR to `main` at the end (merge = user approval gate).
6. No blog/bookmarks/field-studies in v1. Control panel reduced to Site Settings + FPS.
7. Original content only from the reference (tokens/timings/algorithms yes; text/photos/flower glyph/trophy names no).
8. Trophy set defined (plan Task 9): WELCOME IN, PATHFINDER, PEER REVIEW, BREACH, CLOSER, SIGNAL, + rare NIGHT SHIFT (frees moth).
9. Persistence prefix `am-` (keys: am-theme, am-font-size, am-nav-open, am-popup-bounds:*, am-feature-open:*, am-trophy-visits, am-trophy:<id>, am-trophy-ui:open, am-moth-state, am-moth flight state in sessionStorage).

## 3. Done (committed, reviewed clean)

| Task | Commit(s) | What landed |
|---|---|---|
| T1 Scaffold | `7a0bb4c` + fix `b49cf7d` | Astro skeleton (hand-written), `astro.config.mjs` (site, static, trailingSlash always, prefetch hover, sitemap), tokens.css (25 dark+light tokens, verified == ref §4.1), reset.css, layout.css (36ch\|1fr grid, sticky sidebar, 50rem collapse), `src/scripts/persistent.ts` (`am-` prefix, never-throw JSON) + 3 passing tests, `scripts/subset-font.mjs` (canonical unicode list incl. U+EA76), **interim font = stock Iosevka Term 34.9.0** (no NF glyphs, no AM glyph — see `public/fonts/README.txt`), deleted React app + tailwind + vite configs |
| T2 Data layer | `b192722` | `src/data/nav.ts` (NAV tree, 20 routes, NAV_HEADER `~/atharv`), `src/data/readme.ts` (ATHARV MITTAL / SECURITY × PRODUCT / pitch), `src/content.config.ts` (zod schema: title/tagline/stack/metrics/links/order/draft), **17 markdown files** (6 featured projects, 8 archive, about/contact/resume) — all facts verified verbatim from git history, `src/data/projects.ts` deleted, 7/7 vitest, astro build green |

## 4. Task 3 (editor shell) — INTERRUPTED, nearly done, UNCOMMITTED

The implementer was killed by a 429 after finishing the files; its last words: "Build is
green. Running unit tests and the e2e suite."

**On disk (uncommitted):** `src/layouts/PageLayout.astro`, `src/components/{Sidebar,TreeFolder,NavItem,ContentPage}.astro`,
`src/scripts/{tree-folder,nav-tree,line-numbers,site-sidebar}.ts`, `playwright.config.ts`,
`tests/e2e/shell.spec.ts`, modified `src/pages/index.astro`, `src/styles/tokens.css`, `vitest.config.ts`.

**To finish T3:**
1. Review the uncommitted work against `task-3-brief.md` (in the SDD workspace).
2. Run `npx astro build` then `npx playwright test tests/e2e/shell.spec.ts` (config should
   build+preview on port 4321; Playwright browsers may need `npx playwright install chromium`).
3. Fix whatever fails, commit as `feat: editor shell — layout, nav tree, gutter, mobile drawer`.
4. Generate review package + dispatch task reviewer (sonnet); fix-loop per SDD rules.
5. Ledger: `.superpowers/sdd/2026-10-04-astro-meadow-redesign/progress.md`.

**T3 rulings already made (carry forward):** folder open-state resolved server-side at build
time (no flash, client persists toggles after); folder glyphs \u{E5FE}/\u{E5FF} MUST be wired in
TreeFolder (debt from T2 review); CSS breakpoint 800px / JS 700px (documented quirk);
`overflow-x:hidden` on `<html>` is the first suspect if the sticky sidebar misbehaves.

## 5. Remaining tasks (wave order)

```
[3 done] → [4+7+11 parallel] → [5] → [6+8+10 parallel] → [9] → [12] → [13]
```

| # | Task | Notes / special care |
|---|---|---|
| 4 | Buttons, feature-blocks, popup windows | `openPopup(src,type,title)`, `clampRect`/`parseSavedRect` must be exported + unit-tested (popup-bounds.test.ts code is IN the plan); ≤800px → window.open |
| 5 | All routes + remark pipeline | remark-editor.mjs inserts spacer paragraphs + wraps links as .button; case-study template per ref §2.3; archive renders title-only lines (empty taglines, noted); 404 page replaces deleted public/404.html |
| 6 | Text wave + hover wave | Test code IN plan (wave-timing.test.ts); `= ~ - ~ =` 40ms slots; normalize() restore; returns maxDelay for T8/T10 chaining |
| 7 | ASCII engine | surface.ts + renderer.ts + rain.ts; test code IN plan; `makeRain(opts)` is consumed by T8/T10 |
| 8 | AM monogram + rain-hatch logo + bloom + intro choreography | **Design the AM glyph first** (`assets/mark/am-monogram.svg`, FontForge insert at U+100000, rebuild woff2 incl. NF icons — replaces interim font); logo-mask logic + tests IN plan; bloom rings 12 colors; trophy unlock via guarded dynamic import (T9 may not exist yet) |
| 9 | Trophies + drawer + moth | 7 trophies (names in plan T9 step 1); steering.ts shared with T10; moth sessionStorage continuity |
| 10 | Contact boids + lamp | 48/24 boids, lamp glow field, 0.33s glitch trails |
| 11 | Terminal `<site-terminal>` | Port from `git show main:src/routes/SecurityPortfolio.tsx`; **machine.ts pure + TDD (test list IN plan)**; matrix effect self-contained in terminal/matrix.ts — do NOT import ascii/rain.ts (pre-flight ruling: T7+T11 same wave); dispatches 'secret' trophy event; exit → / |
| 12 | Settings + persistence hardening + a11y | Poison-pill tests for every am-* key; reduce-motion sweep; skip link, popup focus restore |
| 13 | SEO + deploy + teardown | JSON-LD (own data!), og.jpg from AM mark, robots/llms.txt/manifest, GH Actions Pages workflow, `npm run test && astro build && playwright test` gate, adapted ref §18 QA checklist, delete React-era leftovers, **open PR to main, hand to user for approval** |

## 6. Environment gotchas (learned the hard way)

- **429 rate limits kill subagents mid-task** on the current model (kimi-k3:cloud). Mitigations: fewer parallel agents, cheaper models for mechanical tasks, or a different model entirely. Subagents resume fine via SendMessage (transcripts persist).
- SDD scripts must run **from repo root** (they resolve plan paths relative to cwd).
- `.superpowers/sdd/` is git-ignored by a nested .gitignore — ledger/reports are local-only by design.
- npm blocked esbuild/sharp postinstall scripts (allow-scripts policy); if a cryptic esbuild error appears, run `npm approve-scripts` — T1 report has details.
- `grep -P` unavailable in this Git Bash (use `grep -oE`).
- review-package diff for scaffold-type commits is ~450KB (package-lock) — tell reviewers to skip it.

## 7. SDD loop mechanics (for whoever resumes)

Per task: record BASE (`git rev-parse HEAD`) → dispatch implementer (fresh
general-purpose agent, model per plan: sonnet default, haiku for transcription-only
fixes, opus/fable for architecture) with brief path + interfaces + report path →
on DONE: review-package (`bash <skill>/scripts/review-package PLAN BASE HEAD`) →
task reviewer (brief + report + diff paths; needs BOTH spec ✅ and quality Approved) →
fix loop (resume implementer rounds 1-3, fresh+bump rounds 4-5, adjudicate at cap) →
ledger completion line. At the end: final whole-branch review on most capable model
(merge-base main..HEAD), one fix wave, then finish + PR.
Skill dir: `C:\Users\athar\.claude\plugins\cache\claude-plugins-official\superpowers\6.4.1\skills\subagent-driven-development\`
All 13 briefs already extracted to the workspace (`task-N-brief.md`) — reuse them.

Ledger lives at `.superpowers/sdd/2026-10-04-astro-meadow-redesign/progress.md` —
it has the pre-flight conflict scan, all rulings, and per-task completion lines.
**Trust ledger + git log over memory.**

## 8. RESUME PROMPT (paste into a fresh session)

> Resume the astro-meadow rewrite in C:\Users\athar\atharv109.github.io (branch
> redesign/editor-portfolio). Read HANDOFF.md at the repo root, then
> .superpowers/sdd/2026-10-04-astro-meadow-redesign/progress.md, then the plan at
> docs/superpowers/plans/2026-10-04-astro-meadow-redesign.md. Use
> superpowers:subagent-driven-development. First action: finish interrupted Task 3
> (§4 of HANDOFF.md) — its files are uncommitted on disk.
