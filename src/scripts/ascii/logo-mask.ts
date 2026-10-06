// logo-mask.ts — the monogram (U+100000) rasterised to a cell mask the rain
// hatches into existence (ref §8.3). The pure geometry here (mask threshold,
// ring index, hatch/completion state) is DOM-free and unit-tested under node;
// only rasterGlyph touches canvas.

export const GLYPH = '\u{100000}'; // the AM monogram (Task 8: scripts/add-glyph.py)
export const LOGO_COLOR = 'var(--color-surface2)';
export const PAINTED_COLOR = 'var(--color-green)';
export const COVERAGE_MAX = 16 * 255; // 4080: one cell's 4x4 sub-pixels at full alpha
export const RING = 8; // logoBloomRing (ref §8.3.1)
export const BLOOM_SPEED = 8; // colour steps per second (ref §8.3.4)

/** Bloom order (ref §8.3.4) — token SUFFIXES; every one exists in tokens.css. */
export const BLOOM_TOKENS = [
  'red', 'orange', 'yellow', 'lime', 'green', 'aqua',
  'skye', 'snow', 'blue', 'purple', 'pink', 'cherry',
] as const;

export const bloomColors = BLOOM_TOKENS.map((t) => `var(--color-${t})`) as unknown as string[];

export interface RasterAlpha {
  width: number; // canvas px
  height: number;
  alpha: Uint8ClampedArray | number[]; // 0..255 per px
}

export interface LogoMask {
  cols: number;
  rows: number;
  cells: Uint8Array; // 1 = mask cell (cols*rows)
  ring: Uint8Array; // ring index per cell (0 for non-mask)
  count: number; // total mask cells
  bbox: { x0: number; y0: number; x1: number; y1: number }; // inclusive; -1 when empty
  cx: number; // bbox centre, cell units
  cy: number;
  aspect: number; // cellW/lineH, used by the ring formula (ref §8.3.1)
}

/** Cell belongs to the mask when the summed alpha over its cellPx² sub-pixels
    reaches 50% coverage (ref §8.3.1: 4080×0.5 with cellPx=4 in the browser). */
export function maskFromAlpha(
  raster: RasterAlpha,
  opts: { cols: number; rows: number; aspect: number; cellPx?: number; lineH?: number },
): LogoMask {
  const cols = Math.max(1, opts.cols);
  const rows = Math.max(1, opts.rows);
  const cellPx = opts.cellPx ?? 4;
  const cells = new Uint8Array(cols * rows);
  const ring = new Uint8Array(cols * rows);
  let count = 0;
  let x0 = -1, y0 = -1, x1 = -1, y1 = -1;
  for (let cRow = 0; cRow < rows; cRow++) {
    for (let cCol = 0; cCol < cols; cCol++) {
      let sum = 0;
      const px = cCol * cellPx;
      const py = cRow * cellPx;
      for (let sy = 0; sy < cellPx; sy++) {
        const rowOff = (py + sy) * raster.width + px;
        for (let sx = 0; sx < cellPx; sx++) sum += raster.alpha[rowOff + sx] ?? 0;
      }
      if (sum >= COVERAGE_MAX * 0.5) {
        cells[cRow * cols + cCol] = 1;
        count++;
        if (x0 === -1 || cCol < x0) x0 = cCol;
        if (cCol > x1) x1 = cCol;
        if (y0 === -1 || cRow < y0) y0 = cRow;
        if (cRow > y1) y1 = cRow;
      }
    }
  }
  const cx = x0 === -1 ? 0 : (x0 + x1) / 2;
  const cy = y0 === -1 ? 0 : (y0 + y1) / 2;
  // Ring index. The ref formula divides by logoBloomRing(=8) in row units,
  // which collapses every letterform's bloom to one or two colours; divide in
  // screen px (lineH per row) instead — lineH = 19 → ~27 rings across a tall
  // mark, which is what makes the "concentric rainbow rings" (§8.3.4) read.
  // Raw row-unit rings (the pasted formula) when no lineH is given.
  const ringSize = opts.lineH ? RING / opts.lineH : RING;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i])
      ring[i] = ringIndex(i % cols, Math.floor(i / cols), cx, cy, opts.aspect, ringSize);
  }
  return { cols, rows, cells, ring, count, bbox: { x0, y0, x1, y1 }, cx, cy, aspect: opts.aspect };
}

/** Ring index per mask cell (ref §8.3.1): min(255, round(hypot((x−cx)×aspect, y−cy) / 8)). */
export function ringIndex(x: number, y: number, cx: number, cy: number, aspect: number, size = RING): number {
  const d = Math.hypot((x - cx) * aspect, y - cy) / size;
  return Math.min(255, Math.round(d));
}

export interface LogoDropExt {
  inLogo: boolean; // drop's body was in the mask last frame
  dragged: boolean; // speed already scaled into logoDrag
  origSpeed: number;
  drag: number;
  drift: number; // −1 | 0 | +1 sideways drift while hatching
  lastRow: number; // last mask row this drop crossed
  maskSeen: number; // frame the drop last touched a mask cell
}

export function newDropExt(): LogoDropExt {
  return { inLogo: false, dragged: false, origSpeed: 0, drag: 1, drift: 0, lastRow: -1, maskSeen: -1 };
}

/** 1 → '/', 2 → '|', 3 → '\' (face = drift+2, ref §8.3.3). */
export function faceChar(v: number): string {
  return v === 1 ? '/' : v === 2 ? '|' : v === 3 ? '\\' : ' ';
}

/** Hatch state for one mask: fills face cells and fires completion once. */
export class LogoHatch {
  readonly face: Uint8Array;
  readonly painted: Uint8Array;
  filled = 0;
  complete = false;
  private turnChance: number;
  private rng: () => number;
  private onComplete?: () => void;

  constructor(
    private mask: LogoMask,
    opts: { turnChance?: number; rng?: () => number; onComplete?: () => void } = {},
  ) {
    this.face = new Uint8Array(mask.cols * mask.rows);
    this.painted = new Uint8Array(mask.cols * mask.rows);
    this.turnChance = opts.turnChance ?? 0.3;
    this.rng = opts.rng ?? Math.random;
    this.onComplete = opts.onComplete;
  }

  /** Drop's head crossed a new row: the §8.3.2 turn roll (30%/new mask row)
      + lastRow bookkeeping. Called from the rain drift hook (pre-draw) so the
      sideways drift is applied once per crossed row, not per frame. */
  rollTurn(ext: LogoDropExt, col: number, row: number): void {
    if (row <= ext.lastRow) return;
    if (col < 0 || col >= this.mask.cols || row < 0 || row >= this.mask.rows) return;
    ext.lastRow = row;
    const i = row * this.mask.cols + col;
    if (!this.mask.cells[i]) return; // off the mark: fall straight
    // §8.3.2: "with logoTurnChance 0.3 it toggles a sideways drift (−1 or +1
    // per row; if already drifting, 30 % returns to 0)" — 30 % per new row to
    // start drifting when stopped, and 30 % per new row back to 0 when
    // drifting (independent rolls, so falls stay mostly vertical).
    if (ext.drift === 0) {
      if (this.rng() < this.turnChance) ext.drift = this.rng() < 0.5 ? -1 : 1;
    } else if (this.rng() < 0.3) {
      ext.drift = 0;
    }
  }

  /** One in-mask drop cell: enter handling + face fill (ref §8.3.2/3). The
      enter roll (drag) fires when the drop's body first lands on the mark. */
  enterCell(col: number, row: number, ext: LogoDropExt): void {
    if (col < 0 || col >= this.mask.cols || row < 0 || row >= this.mask.rows) return;
    const i = row * this.mask.cols + col;
    if (!this.mask.cells[i]) return;
    if (!ext.inLogo) {
      ext.inLogo = true;
      ext.drag = 0.3 + this.rng() * 0.4;
    }
    this.fillCell(col, row, ext.drift + 2);
  }

  fillCell(col: number, row: number, face: number): void {
    const i = row * this.mask.cols + col;
    if (col < 0 || col >= this.mask.cols || row < 0 || row >= this.mask.rows) return;
    if (!this.mask.cells[i] || face < 1 || face > 3) return;
    if (!this.face[i]) {
      this.face[i] = face;
      this.filled++;
      if (!this.complete && this.filled >= this.mask.count) {
        this.complete = true;
        this.onComplete?.();
      }
    }
  }

  /** User-coloured drops repaint face cells (ref §8.2, default --color-green). */
  paintCell(col: number, row: number): void {
    const i = row * this.mask.cols + col;
    if (i >= 0 && i < this.painted.length && this.face[i]) this.painted[i] = 1;
  }
}

/** Bloom colour of a ring at time t (ref §8.3.4). */
export function bloomColor(ring: number, time: number): string {
  const step = Math.floor(time * BLOOM_SPEED);
  const i = (((ring - step) % bloomColors.length) + bloomColors.length) % bloomColors.length;
  return bloomColors[i];
}

/** Rasterise U+100000 with the page font onto a cols×4 × rows×4 offscreen
    canvas (4× supersample per cell), scaled so the glyph bbox fits `logoScale`
    of the canvas, corrected by the cell aspect (ref §8.3.1) and centred —
    horizontally at `centreX` (0..1 of the canvas, where the page's own content
    column centre sits, so mark + headings + CTA line up on one axis as in the
    ref), vertically at mid-canvas. Browser-only; returns the alpha channel
    (see maskFromAlpha). */
export function rasterGlyph(opts: {
  cols: number;
  rows: number;
  cellW: number;
  lineH: number;
  logoScale: number;
  font: string;
  centreX?: number;
}): RasterAlpha {
  const w = opts.cols * 4;
  const h = opts.rows * 4;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) return { width: w, height: h, alpha: new Uint8ClampedArray(w * h) };

  // Reference bbox at 100px, then font-size that fits logoScale of the canvas
  // with the mark's designed proportions ON SCREEN (ref §8.3.1 "corrected by
  // cell aspect"): canvas px map to (cellW, lineH) screen px per cell, so the
  // draw is stretched horizontally by 1/aspect and the fit budget in x is
  // likewise scaled — the mark keeps its design aspect on the cell grid.
  g.font = `100px ${opts.font}`;
  const m = g.measureText(GLYPH);
  const left = m.actualBoundingBoxLeft ?? 0;
  const bw = (m.actualBoundingBoxLeft ?? 0) + (m.actualBoundingBoxRight ?? 0) || 100;
  const bh = (m.actualBoundingBoxAscent ?? 0) + (m.actualBoundingBoxDescent ?? 0) || 100;
  const asc = m.actualBoundingBoxAscent ?? bh / 2;
  g.textBaseline = 'alphabetic';
  const aspect = opts.cellW / opts.lineH;
  const s = Math.min((opts.logoScale * w * aspect) / bw, (opts.logoScale * h) / bh);
  const cx = (opts.centreX ?? 0.5) * w;
  const X = cx * aspect - ((bw - 2 * left) * s) / 2;
  const Y = h / 2 + (asc - bh / 2) * s;
  g.save();
  g.scale(1 / aspect, 1);
  g.font = `${100 * s}px ${opts.font}`;
  g.fillText(GLYPH, X, Y);
  g.restore();

  const data = g.getImageData(0, 0, w, h).data; // RGBA; every 4th byte is alpha
  const alpha = new Uint8ClampedArray(w * h);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  return { width: w, height: h, alpha };
}