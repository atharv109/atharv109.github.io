SHIPPED FONT (Task 8 — real subset)
===================================

public/fonts/IosevkaTermNF-Regular.woff2 is now a real subset of a Nerd
Fonts pre-patched Iosevka Term weight 400, produced by:

  1. Download https://github.com/ryanoasis/nerd-fonts/releases/download/
     v3.4.0/IosevkaTerm.zip -> IosevkaTermNerdFont-Regular.ttf
     (extracted to fonts-src/, which is gitignored - source stays out of
     the repo; the checked-in font is only the subset).
  2. scripts/add-glyph.py (fontTools, no FontForge needed) outlines the
     AM monogram (assets/mark/am-monogram.svg coordinates) into a new
     glyph 'uni100000' at U+100000 with the Term advance (0.5 em / 500
     upm) and merges it into the font's existing cmap format-12 UCS-4
     subtable (format 4 is BMP-only, so U+100000 resolves via fmt 12).
     A pristine copy is kept at fonts-src/*-orig.ttf so reruns never
     stack edits.
  3. node scripts/subset-font.mjs fonts-src/IosevkaTermNerdFont-Regular.ttf
     (the script holds the canonical --unicodes list: ASCII + e-acute +
     n-tilde + the Nerd-Font PUA icons used site-wide + U+100000).

The subset contains all Nerd-Font codepoints the site references, so NF
icons render for real everywhere (the old ASCII stand-ins were interim).

AM monogram glyph: outline spans x 67..935, y 87..903 (design canvas
1000x1000 -> 1000 upm), stroke 80u, single weight; advance 500 (0.5 em,
the Iosevka Term width). The rain-hatch rasteriser (src/scripts/ascii/
logo-mask.ts) applies the ref §8.3.1 cell-ASPECT correction — the draw is
stretched horizontally by 1/aspect with the x fit-budget scaled — so the
hatched mark keeps its designed ~1.06 screen aspect at any cell size.

License: SIL Open Font License 1.1 (Iosevka, (c) Belleve Invis);
Nerd Fonts icons under the Nerd Fonts license (MIT-variant), both
redistribution-friendly.