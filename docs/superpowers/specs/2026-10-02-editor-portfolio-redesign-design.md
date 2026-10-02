# Editor Portfolio Redesign — Design Spec

**Date:** 2026-10-02
**Status:** Draft, awaiting review
**Scope:** Full visual + structural redesign of `atharv109.github.io`

## 1. Goal

Rebuild the existing portfolio (React 19 + Vite + Tailwind, currently a cinematic
near-black/orange single-page site with a separate `/security` terminal) into a
premium **code-editor / file-explorer** experience whose feel and motion match
`digitalmeadow.studio`, while carrying the user's own content (6 featured + 8
archive projects, about, contact, and the interactive security terminal).

**Success criteria**

- The site reads as *one* editor: a persistent file-tree sidebar + a syntax-highlighted,
  line-numbered content pane + a status bar.
- The "meadow" palette (Catppuccin-derived, warm dark) and Iosevka monospace are applied
  throughout.
- Signature motion is editor-native: wave scroll-reveal, boot intro, marquee strip,
  achievements drawer, popup links — replacing the current cinematic effects.
- The security terminal survives fully, re-homed as a `shell` file in the tree.
- Content is the user's own; nothing from the reference site (code, text, names, assets)
  is copied. The design language (metaphor, palette, typography, motion *patterns*) is
  reconstructed as original work. The palette is Catppuccin-derived (open source, SIL/MIT).

## 2. Locked decisions (from brainstorming)

1. **Full metaphor** — the whole site is an editor/file explorer, not a reskin.
2. **Security terminal = a file in the tree** (`shell`), replacing the `/security` route.
3. **Content = highlighted prose** — headings render as code keywords, prose as
   strings/comments, metrics as numbers, tech as tokens.
4. **Motion = editor-native set** — drop Three.js generative canvases, mouse spotlight,
   custom cursor, cinematic preloader, grain/scanlines; keep Lenis + magnetic + scramble
   re-skinned.
5. **Add `resume.md`** to the file tree.

## 3. Design language (absorbed reference, reconstructed)

**Metaphor.** A code editor with a left file-tree sidebar (≈36ch) and a right content
pane showing the active "file" with a line-number gutter (5ch) and syntax-highlighted
content, plus a status bar. Navigation is a literal filesystem.

**Palette — "meadow" theme (Catppuccin-derived).** Dark by default, light opt-in.

| Token | Dark | Role |
|---|---|---|
| `base` | `#1c2225` | page background |
| `mantle` / `crust` | `#171c1f` | deepest chrome |
| `surface0/1/2` | `#232a2e` / `#2b3337` / `#374145` | panels |
| `overlay0/1/2` | `#4a585c` / `#58686d` / `#6f8788` | borders, comments |
| `text` | `#f8f9e8` | primary text (warm cream) |
| `subtext0/1/2` | `#839e9a` / `#96b4aa` / `#adc9bc` | muted text |
| `red` | `#f57f82` | keyword / danger |
| `green` | `#cbe3b3` | **link / primary accent** (sage) |
| `lime` | `#dbe6af` | string |
| `orange` / `yellow` | `#f7a182` / `#f5d098` | secondary accents |
| `aqua` / `skye` / `snow` | `#b3e3ca` / `#b3e6db` / `#afd9e6` | accents |
| `blue` / `purple` / `pink` | `#b2caed` / `#d2bdf3` / `#f3c0e5` | accents |
| `cherry` | `#fae6ef` | accents |

**Syntax token theme** (for highlighted prose):

- keyword → `red`, string → `lime`, function → `green`, constant → `pink`,
  comment → `overlay2`, punctuation → `subtext0`, link → `skye`, parameter → `text`.

**Typography.** Iosevka (Term) monospace for everything; tight line-height ≈1.357rem;
spacing in `ch` units (sidebar 36ch, line numbers 5ch, margins 3ch).

**Motion.** Wave scroll text-reveal (with per-element opt-out, like the reference's
`data-text-wave="skip"`); boot intro on load; a marquee ribbon; an achievements drawer
(metrics as trophy cards); OS-window popups for external links; smooth theme switch.

## 4. Architecture

Keep **React 19 + Vite 7 + Tailwind v3 + react-router-dom 7**. The editor is an SPA:
a persistent editor shell with client-side "file" routing. Clicking a file in the tree
navigates to its route; the content pane renders that file. Content stays data-driven.

Rejected alternative: static multi-page (Astro-style) — more faithful to how the
reference is actually built, but abandons the existing SPA and adds risk for no
functional gain.

## 5. File tree (content mapping)

```
README.md              → Home — name, "SECURITY × PRODUCT" identity, one-line pitch
projects/
  vulnswarm-vex.md     → featured project
  adversary-lab.md
  prompt-optimiser.md
  eleventh-round.md
  crypton.md
  acctomatic.md
archive/
  tinyvulnscanner.md   → archive project (×8, from archiveProjects)
  eduai.md
  protopaper.md
  billshield.md
  ai-outfit.md
  blinks.md
  buildora-agent-pipeline.md
  android-app.md
about.md               → About (bento cells re-rendered as highlighted prose)
contact.md             → Contact (email + socials)
shell                  → interactive security terminal (executable file)
resume.md              → resume (placeholder for now — source supplied later)
github                 → external link (root-level, like the reference)
linkedin               → external link
email                  → mailto link
```

URLs mirror file paths: `/`, `/projects/:id`, `/archive/:id`, `/about`, `/contact`,
`/shell`, `/resume`.

## 6. Components

**New (editor chrome + effects)**

- `Editor` — top-level grid `[sidebar | content]`, persistent across routes.
- `FileTree` — collapsible folders, Nerd-Font-style icons, depth indentation,
  `cwd` header, `role="tree"` / `role="treeitem"` / `aria-current`, keyboard nav.
- `ContentPane` — line-number gutter + highlighted content + status bar.
- `StatusBar` — `Ln x, Col y · UTF-8 · <filetype>` per active file.
- `HighlightedCode` — renders structured prose with the meadow token theme.
- `ThemeToggle` + `FontSizeControls` — dark default, light opt-in, persisted.
- `WaveReveal` — scroll-driven line/word reveal (GSAP ScrollTrigger).
- `Intro` — editor "boot" load animation (replaces Preloader).
- `Marquee` — scrolling ribbon (project names / tech / tagline).
- `AchievementsDrawer` — slide-out panel of metrics as trophy cards.
- `PopupWindow` — OS-window frame for external links / resume.

**Re-skinned / relocated (existing)**

- Security terminal → `shell` file (see §7).
- `useLenis`, `useMagneticButton`, `useTextScramble` — kept, re-themed.

**Removed**

- `BridgeField` (Three.js), `Spotlight`, `CustomCursor`, `Preloader`, `grain`,
  `scanline-swe`, cinematic `Hero`, `Work` section, `Nav`, `ScrollSpy`, `RouteTransition`.

## 7. Security terminal (`shell`)

Reuse `SecurityPortfolio.tsx` wholesale, re-homed inside the content pane:

- Keep every command: `help, whoami, neofetch, ls, cd, pwd, cat, run, tree, scan,
  status, matrix, stats, history, cowsay, secret, clear, reboot, exit`.
- Re-color from neon-green `#00ff41` / orange `#ff4d00` to the meadow palette
  (`green` `#cbe3b3` primary, `red` `#f57f82` for errors, `lime` for strings).
- `exit` navigates to `/` (README) instead of the `/security` toggle.
- Matrix rain, CRT scanlines, and the boot sequence stay (terminal-authentic).

## 8. Data

- Reuse `src/data/projects.ts` (featured + archive) as-is.
- Extract About cells → `about.md` content; Contact → `contact.md` content.
- New `readme` data (name, identity, pitch) — reuse the current Hero copy
  ("ATHARV MITTAL · SECURITY × PRODUCT · full-stack / security-trained / product-obsessed").
- Resume: placeholder entry for now; source provided later.

## 9. Dependency changes

- **Remove:** `three`, `@types/three`.
- **Keep:** `gsap`, `lenis`, `react`, `react-dom`, `react-router-dom`, `tailwindcss`,
  `typescript`, `vite`, `@vitejs/plugin-react`.
- **Add:** Iosevka (self-hosted woff2 or `@fontsource/iosevka`; SIL OFL). File/folder
  icons via inline SVG or a minimal Nerd-Font subset — decide in implementation.

## 10. Accessibility & reduced motion

- Tree: real `role="tree"`, keyboard navigation, `aria-current="page"`.
- `prefers-reduced-motion: reduce` disables wave/intro/marquee; content renders static.
- Theme respects `prefers-color-scheme` (dark default, light opt-in), persisted.
- Line numbers hidden from the a11y tree (`aria-hidden`), content text remains plain.

## 11. Out of scope (YAGNI)

- No multi-user, no CMS, no backend, no analytics, no new content authoring.
- No porting of the reference's trophy system beyond the achievements drawer.
- No font-size persistence beyond a simple localStorage toggle.

## 12. Resolved questions

1. **Resume source** — placeholder for now; user will supply the source later.
2. **README copy** — reuse the current Hero identity ("ATHARV MITTAL · SECURITY ×
   PRODUCT · full-stack / security-trained / product-obsessed").
3. **Root external files** — include `github`, `linkedin`, `email` as root-level tree
   entries (matching the reference).
