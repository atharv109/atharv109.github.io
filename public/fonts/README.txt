INTERIM FONT ARRANGEMENT (Task 1 fallback — recorded here per the task brief)
=============================================================================

public/fonts/IosevkaTermNF-Regular.woff2 currently contains a STOCK, UNSUBSET
Iosevka Term Regular (v34.9.0) web font, NOT a real Iosevka Term NF subset.

What was done:
  - Downloaded PkgWebFont-IosevkaTerm-34.9.0.zip from
    https://github.com/be5invis/Iosevka/releases/tag/v34.9.0
  - Copied WOFF2/IosevkaTerm-Regular.woff2 (about 1.7 MB) into this folder under
    the production filename so the @font-face in src/styles/tokens.css resolves.

Consequences of the fallback:
  - No Nerd Fonts private-use icons are present. Components that reference NF
    codepoints will render .notdef; until a real NF subset lands, those glyphs
    are temporarily rendered as ASCII stand-ins (handled per-task, not here).
  - The custom AM logo glyph at U+100000 does NOT exist yet — that is Task 8's
    job (requires the designed mark).
  - File is un-subset (1.7 MB vs the reference's ~31 KB target). Fine for dev;
    must be replaced before launch.

Path to the real font (later task):
  1. Download Iosevka Term (Regular) TTF + Nerd Fonts 3.4 patcher
     (font-patcher), produce Iosevka Term NF, weight 400.
  2. Run scripts/subset-font.mjs against it — that script holds the canonical
     --unicodes list (ASCII + e-acute + n-tilde + NF icons + U+100000).
  3. Replace this file with the subset output (same filename).

License: SIL Open Font License 1.1 (Iosevka, (c) Belleve Invis).
