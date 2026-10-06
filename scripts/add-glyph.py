#!/usr/bin/env python3
"""scripts/add-glyph.py - add the AM monogram to the NF Iosevka source font.

FontForge is NOT installed (Task 8 brief) - this uses fontTools directly:

  py scripts/add-glyph.py [-o out.ttf]

Loads the Nerd Fonts pre-patched Iosevka Term TTF (fonts-src/, kept out of
git), outlines the monogram polylines (assets/mark/am-monogram.svg design
coordinates on the 1000-unit canvas) as filled contours into a new glyph
'uni100000' at U+100000, gives it the Term advance (0.5 em), and appends a
cmap format-12 subtable (format 4 tops out at the BMP, so U+100000 needs
fmt 12; getBestCmap then resolves the round-trip).

Idempotent: a pristine copy fonts-src/IosevkaTermNerdFont-Regular.orig.ttf is
taken on first run and reused as the source, so reruns never stack edits.
Default output overwrites fonts-src/IosevkaTermNerdFont-Regular.ttf (which the
Task 1 subset command then reads); -o overrides the output path.
"""
import os
import shutil
import sys
import math

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import _c_m_a_p as cmap_mod
from fontTools.pens.ttGlyphPen import TTGlyphPen

# --- the mark (design canvas 1000x1000, y down; stroke-width 90) -------------
# The A is ONE mitered tent: two butt-capped legs meeting at (390,110) would
# notch the apex, so the legs share the vertex and the join miters.
POLYLINES = [
    [(100, 900), (390, 110), (720, 900)],   # A: left leg -> apex -> right leg
    [(240, 560), (610, 560)],               # A crossbar
    [(600, 110), (600, 900)],               # M left stem (the shared stem)
    [(600, 110), (750, 560), (900, 110)],   # M mid V
    [(900, 110), (900, 900)],               # M right stem
]
STROKE = 80.0
GLYPH_NAME = "uni100000"
CODEPOINT = 0x100000


def unit(vx, vy):
    l = math.hypot(vx, vy)
    return (vx / l, vy / l) if l else (0.0, 0.0)


def offset_contour(pts, half):
    """Filled outline (one closed contour) of a stroked open polyline.

    Built as per-segment offset quads chained into a single contour: at each
    interior vertex the two offset edge points are connected directly (bevel
    join). Miter joins spike above the cap line at the sharp A apex (~123u
    past the vertex - reads as a floating dot in the mask); bevels keep the
    ink flush with the stroke's own cap edges. Butt ends. """
    n = len(pts)
    dirs = [unit(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(n - 1)]
    norms = [(-d[1], d[0]) for d in dirs]  # left normal per segment

    left, right = [], []
    for i in range(n - 1):
        nx, ny = norms[i]
        ox, oy = nx * half, ny * half
        p, q = pts[i], pts[i + 1]
        left.append((p[0] + ox, p[1] + oy))
        left.append((q[0] + ox, q[1] + oy))
    for i in reversed(range(n - 1)):  # back along the other side
        nx, ny = norms[i]
        ox, oy = nx * half, ny * half
        p, q = pts[i], pts[i + 1]
        right.append((q[0] - ox, q[1] - oy))
        right.append((p[0] - ox, p[1] - oy))
    return left + right


def shoelace(poly):
    s = 0.0
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % len(poly)]
        s += x1 * y2 - x2 * y1
    return s / 2.0


def main():
    src_default = os.path.join("fonts-src", "IosevkaTermNerdFont-Regular.ttf")
    src = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else src_default
    out = sys.argv[sys.argv.index("-o") + 1] if "-o" in sys.argv else src

    orig = os.path.splitext(src)[0] + ".orig.ttf"
    if src == out and not os.path.exists(orig):
        shutil.copyfile(src, orig)
    load_from = orig if (src == out and os.path.exists(orig)) else src

    font = TTFont(load_from)
    upm = font["head"].unitsPerEm
    print(f"source: {load_from}  upm: {upm}")

    scale = upm / 1000.0
    half = STROKE * scale / 2.0

    pen = TTGlyphPen(None)
    for poly in POLYLINES:
        contour = [(round(x * scale), round(upm - y * scale)) for x, y in offset_contour(poly, half)]
        # TrueType convention: clockwise (negative shoelace, y up) fills.
        if shoelace(contour) > 0:
            contour.reverse()
        pen.moveTo(contour[0])
        for pt in contour[1:]:
            pen.lineTo(pt)
        pen.closePath()
    glyph = pen.glyph()

    # glyf.__setitem__ maintains glyphOrder (appends the name when new), while
    # a direct glyphs-dict insert + setGlyphOrder would double-add and skew
    # maxp.numGlyphs - so always assign through the table.
    font["glyf"][GLYPH_NAME] = glyph
    font["hmtx"][GLYPH_NAME] = (upm // 2, 0)

    # Cmap: merge into the existing format-12 UCS-4 subtable if the NF source
    # has one (it does), else append a fresh one. Format 4 is BMP-only, so
    # U+100000 must resolve through a fmt-12 table for getBestCmap.
    cmap = font["cmap"]
    target = next(
        (
            t
            for t in cmap.tables
            if t.format == 12 and t.platformID == 3 and t.platEncID == 10
        ),
        None,
    )
    if target is None:
        target = cmap_mod.CmapSubtable.getSubtableClass(12)()
        target.platformID, target.platEncID, target.format = 3, 10, 12
        target.reserved = 0
        target.length = 0
        target.language = 0
        target.cmap = {}
        cmap.tables.append(target)
    target.cmap[CODEPOINT] = GLYPH_NAME

    font.save(out)

    # round-trip check: the subset pipeline resolves glyphs via getBestCmap
    check = TTFont(out)
    got = check.getBestCmap().get(CODEPOINT)
    assert got == GLYPH_NAME, f"cmap round-trip failed: {got!r}"
    adv = check["hmtx"][GLYPH_NAME][0]
    assert adv == upm // 2, f"advance drift: {adv} != {upm // 2}"
    print(f"U+{CODEPOINT:X} -> {got}, advance {adv} (0.5 em); wrote {out}")


if __name__ == "__main__":
    main()