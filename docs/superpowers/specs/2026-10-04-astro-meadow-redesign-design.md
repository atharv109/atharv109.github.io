# Astro "Meadow" Portfolio Rewrite — Design Spec

**Date:** 2026-10-04
**Status:** Draft, awaiting review
**Scope:** Full rewrite of `atharv109.github.io` as an Astro MPA, replacing the React SPA
**Supersedes:** `2026-10-02-editor-portfolio-redesign-design.md` + its plan (React SPA variant, abandoned)

**Authoritative mechanics reference:** `C:\Users\athar\Downloads\digital-meadow-reference\dm-ref\spec-source.md`
(577-line code-level spec scraped 2026-10-04 from digitalmeadow.studio, with screenshots in
`dm-ref/screens/`). This document references its sections as (ref §N). All mechanics — tokens,
line grid, wave timings, ASCII engine, trophies, moth, boids, popups — are re-implemented from
those descriptions as original code with the user's own content, per the scrape's own guidance:
never copy their text, photos, flower glyph, trophy names/jokes, or code verbatim.

## 1. Intent & success criteria

Rebuild the portfolio as a terminal/editor-style file-explorer MPA whose look, feel and motion
match digitalmeadow.studio, carrying Atharv's own content. Positioning (carried from the
2026-09 grilling): **"security engineer who ships"**, recruiter-conversion primary, creative
wow secondary.

**Success criteria**

- Static Astro output; passable fidelity to (ref §18 QA checklist), adapted to our content.
- Home page JS ≤ ~100 KB; one self-hosted subset font (Iosevka Term NF + AM glyph); 14px/19px grid.
- All 14 projects (6 featured + 8 archive), about, contact, resume placeholder, and the
  security terminal (`/shell`) survive the rewrite.
- No React, no GSAP, no Tailwind, no Lenis, no Three.js anywhere in the shipped site.
- Deployed to GitHub Pages from `main` via Actions (or Pages' native static publish).

## 2. Locked decisions

From prior sessions (still in force):

1. Full editor metaphor: persistent file-tree sidebar + line-numbered buffer + status bar feel.
2. Two-tier content: 6 featured + 8 archive projects (data from `src/data/projects.ts`).
3. `resume.md` in the tree (placeholder; source supplied later).
4. Root-level external entries: `github`, `linkedin`, `email`.

From the 2026-10-04 scrape review (new):

5. **Stack:** Astro (static MPA) + vanilla TS custom elements. No UI framework, no CSS
   framework, no animation library. Native scroll, `linear`/`step-end` only, instant hover.
6. **Terminal:** `SecurityPortfolio.tsx` (893 lines React) is **rewritten as a vanilla TS
   custom element** `<site-terminal>` on `/shell/`. Same command set, re-themed to meadow
   palette. Matrix, CRT, boot sequence stay; `exit` → `/`.
7. **Feature scope (full set):** ASCII engine + rain (ref §8), rain-drawn logo + bloom,
   text-wave + hover-wave (ref §7.3–7.4), popups (§7.5), feature-blocks (§4.4), trophies (§9),
   cursor moth (§10), contact-page boids + lamp (§11), theme + font-size controls, marquee.
8. **The mark:** a custom **"AM" monogram** glyph at U+100000 in the font subset. The home
   rain hatches the monogram into existence (replaces their flower); completion blooms rainbow
   rings and unlocks the PERFECTIONIST-equivalent trophy.
9. **Repo:** clean replacement on branch `redesign/editor-portfolio` → becomes `main` via PR.
   Old React app lives on in git history. The stale uncommitted `src/index.css` meadow edit
   is discarded by the scaffold (its tokens move to `src/styles/`).
10. **No** blog, bookmarks, field-studies, or control-panel experiment UI in v1 (YAGNI — no
    content for them). The control panel is reduced to Site Settings (theme + font size) +
    FPS/memory readout.

## 3. Architecture & project layout

Follows the reference blueprint (ref §17.1) closely:

```
src/
  layouts/PageLayout.astro        # html, head meta, inline boot script, sidebar, main,
                                  # popup/trophy/control-panel mounts
  components/
    Sidebar.astro  TreeFolder.astro  NavItem.astro   # driven by src/data/nav.ts
    ContentPage.astro            # .content-wrapper > .content-page > .content-row >
                                 # .line-numbers + .content-lines
    FeatureBlock.astro  Button.astro  Hero.astro
  scripts/                        # vanilla TS, custom elements
    tree-folder.ts nav-tree.ts site-sidebar.ts popup-window.ts feature-block.ts
    trophy-drawer.ts trophies.ts moth.ts marquee-text.ts persistent.ts
    text-wave.ts line-numbers.ts center-content.ts button-hover-wave.ts
    site-terminal.ts             # the /shell terminal (see §7)
    ascii/ renderer.ts surface.ts rain.ts logo-mask.ts boids.ts steering.ts
  styles/ tokens.css reset.css layout.css components.css
  content/                        # Astro content collections (markdown)
    projects/*.md  archive/*.md  pages/{about,contact,resume}.md
  data/ nav.ts readme.ts         # tree config + home identity copy
public/
  fonts/IosevkaTermNF-AM.woff2   # subset: ASCII + chosen NF icons + AM glyph U+100000
  favicon.*  og.jpg  site.webmanifest  robots.txt  llms.txt
scripts/subset-font.mjs          # pyftsubset wrapper (or docker) to build the woff2
```

- Astro config: `output: 'static'`, `trailingSlash: 'always'`, `@astrojs/sitemap`,
  prefetch hover, Shiki `css-variables` theme mapped to the meadow tokens.
- Deploy: GitHub Actions → Pages. `main` currently auto-deploys the old site; the PR merge
  swaps it.
- **Testing:** Vitest for pure logic (ASCII surface diffing, wave timing phase math, steering,
  terminal command handlers as a pure state machine, nav/tree data). Playwright smoke suite
  for every route + keyboard nav + reduced-motion. TDD for the ASCII engine (ref §17.2
  suggests per-step verification; we formalise).

## 4. Design system foundation (ref §3, §4)

- **Font:** Iosevka Term NF, weight 400 only, no bold/italic anywhere. Subset woff2 with
  printable ASCII, our chosen Nerd-Font icons, and the AM monogram at U+100000. Verify
  `1ch == 7px @ 14px`, line-height `19px`.
- **Tokens:** `tokens.css` carries the exact dark + light palettes (ref §4.1) as CSS custom
  properties. Dark default, light opt-in (`localStorage['dm-theme']` equivalent key, ours
  `am-theme`). Hierarchy by colour only: h1→text, h2→subtext2, body→subtext0.
- **No bold, no radius, no shadow, no gradients, no transitions on chrome.** Depth via 1px
  outlines and background steps (base → surface0 → surface1 → surface2).
- **Line grid:** root 14px, `--line-height: 19px`, `--sidebar-width: 36ch`,
  `--line-numbers-width: 5ch`, everything vertical snaps to line multiples; blank lines are
  real `aria-hidden` `&nbsp;` paragraphs; media heights JS-snapped; gutter fills `~` after
  content ends; 2 blank lines before each h2 (ref §2.5 rhythm convention).
- **Body grid:** `[sidebar 36ch | main 1fr]`, sidebar `position:sticky`, `main` bg one step
  lighter than sidebar. ≤800px: single column, off-canvas sidebar via Menu [+], gutter hidden.
- Replaces (not reuses) the old `index.css`; the half-done uncommitted edit is discarded.

## 5. Core chrome (ref §4.4, §7.6)

- **Nav tree:** `role="tree"`, roving tabindex, vim keys (j/k/h/l) + arrows, folder state in
  localStorage without flash (inline boot script), current item = green block + `aria-current`.
- **Buttons:** inline chips `--link-color` per link, `surface1` chip bg → `surface2` + 1px lift
  on hover, instant. Icon glyph + 1.5ch spacing.
- **Feature-block:** framed `media | embed | code` blocks with the fieldset-legend title chip,
  click-to-expand persistence, line-snapped media, embed click-to-activate with green outline.
- **Popup windows:** draggable/resizable `role="dialog"` panes for external links, resume, and
  project embeds; rect persisted per-src; ≤800px → plain `window.open`; Esc/outside-click close;
  title-click opens new tab.
- **Site Settings:** theme select, font size 12–20 (persisted, applied pre-paint), FPS/memory
  readout. No experiment sliders in v1.

## 6. Signature motion (ref §7, §8)

- **Text wave:** on every page load, in-viewport text blocks split per-char and play the
  diagonal glitch wave `= ~ - ~ =` (40ms slots, rAF-driven, DOM restored via `normalize()`);
  blocks below the fold appear instantly. Hover-wave on buttons (30ms slots). Reduced-motion:
  no-op; `wave-pending`/`intro-pending` classes gate pre-reveal visibility.
- **ASCII engine:** zero-dep cell-grid → `<pre>` renderer with per-row dirty diffing and
  run-length span generation (ref §8.1), mounted absolute behind hero content.
- **Home rain + AM logo:** rain (density 0.2, `|` glyphs), pointer/click spawns drops, drops
  entering the monogram mask get drag/turn behaviour and hatch `/ | \` strokes; completion →
  concentric rainbow ring bloom (12 palette colours, 8 steps/s) + trophy. Headings "Digital
  Meadow"-equivalent ("ATHARV MITTAL" / "SECURITY × PRODUCT") reveal with per-char glitch and
  re-glitch when rain sweeps them.
- **Intro choreography:** (ref §7.2) rain starts → heading reveal 0.5s diagonal → CTA wave →
  sidebar cascade (items 60ms apart, icons glitch separately, current item's green bg fades in).
  Skipped ≤700px except Menu button.
- **Marquee:** overflow-only scrolling trophy descriptions, linear, hold-and-return pattern.

## 7. Pages & content

File tree (sidebar) and routes:

```
README                → /          hero: AM rain logo, "ATHARV MITTAL", "SECURITY × PRODUCT"
                                    pitch line, Explore button (→ /projects)
projects/
  index               → /projects/                      featured index
  vulnswarm-vex       → /projects/vulnswarm-vex/        case-study template (ref §2.3):
  adversary-lab          adversary-lab/                    h1, tagline, stack list, highlights,
  prompt-optimiser       prompt-optimiser/                 story, outcome metrics, links,
  eleventh-round         eleventh-round/                   optional embed/media feature-blocks,
  crypton                crypton/                          "Next project" button
  acctomatic             acctomatic/
archive/
  index + 8 files     → /archive/…    compact entries (from archiveProjects)
about.md              → /about/      text buffer; bento cells rewritten as prose + icon lists
contact.md            → /contact/    hero-style, ASCII boids background, one big mailto
                                     "reach out" button with lamp icon swap; seo-only h1/h2
shell                 → /shell/      security terminal (below)
resume.md             → /resume/     placeholder page; source supplied later
github  linkedin  email              root externals (github/linkedin open as popups, email mailto)
```

Content authoring: markdown content collections with a remark pass that inserts spacer
paragraphs, wraps inline links as `.button`s, and turns directives into feature-blocks.

**Security terminal (`/shell`):** rewrite of `SecurityPortfolio.tsx` as `<site-terminal>`
custom element. Command handlers as a pure, Vitest-tested state machine (input + fs state →
output lines); DOM/renderer thin around it. Full command parity: `help, whoami, neofetch, ls,
cd, pwd, cat, run, tree, scan, status, matrix, stats, history, cowsay, secret, clear, reboot,
exit`. Palette: green primary, red errors, lime strings (meadow tokens, not neon). Matrix
rain / CRT scanlines / boot sequence kept. `exit` → `/`. Replaces the old `/security` route,
which is simply removed (no redirect — GitHub Pages can't issue one; the route has no inbound
links to preserve beyond our own nav, which the tree replaces).

## 8. Trophies & the moth (ref §9–§11)

Seven achievements, **own names/copy/icons** (TBD during implementation, e.g. first-visit,
explore 5+ pages, complete the monogram, open a project embed, reach out, find the terminal
`secret`, plus the rare one that frees the moth). Mechanics per ref §9: localStorage state,
bottom-right drawer `[n/7]`, `?`-masked locked cards, flashing-outline toasts (5s, step-end).
The **moth** (ref §10) caged in the last trophy card; freed when the other six unlock; seeks/
orbits/wanders the cursor; persists mid-flight across page loads via sessionStorage; recall by
clicking its card. Contact-page **boids** flock (ref §11): 48 (24 mobile) moths idle-roaming,
fleeing the pointer, gathering on the mailto CTA with the `/`-char lamp glow field and 0.33s
glitch trails.

## 9. SEO, persistence, a11y (ref §6, §13, §14)

- `<title>` pattern `"<Page> ~ Atharv Mittal"`; OG/Twitter cards, canonical trailing slash,
  JSON-LD (Person/WebSite/WebPage — **own data only**), sitemap, robots.txt, manifest,
  `llms.txt`. No RSS in v1 (no blog).
- Persistence keys (own prefix `am-`): theme, font-size, nav folders, feature-block state,
  popup bounds, trophies, moth; sessionStorage for moth flight + keyboard nav focus restore.
- A11y per ref §14: skip link, landmarks, roving tabindex tree, popup focus management,
  `aria-live` toasts, decorative layers `aria-hidden`, real (transparent) hero headings for
  SR/SEO, full reduced-motion fallbacks, contrast targets (body ~5.4:1).

## 10. Out of scope (v1)

Blog, bookmarks, field studies gallery, WebGPU/three.js demos, control-panel sliders,
OBS capture harness, RSS, light-theme fine art direction (tokens exist, defaults fine),
CMS/backend, analytics.

## 11. Resolved questions

1. Terminal: vanilla TS rewrite (not React island).
2. Scope: full set incl. trophies + moth + contact boids.
3. Mark: AM monogram glyph at U+100000; rain completes it.
4. Repo: clean replacement on `redesign/editor-portfolio` → PR to `main`.
5. Stack: Astro MPA, no framework/CSS-lib/animation-lib; old React app preserved in history.
