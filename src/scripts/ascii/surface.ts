// surface.ts — the ASCII cell grid. A flat cols×rows cell array with per-row
// dirty tracking and run-length grouping, DOM-free so it unit-tests under node.

export interface Cell {
  char: string;
  color?: string;
  bg?: string;
}

export interface Run {
  text: string;
  color?: string;
  bg?: string;
}

const BLANK = ' ';

export class AsciiSurface {
  cols: number;
  rows: number;
  private cells: Cell[];
  private dirty: boolean[];
  private rowMinX: number[];
  private rowMaxX: number[];

  constructor(cols: number, rows: number) {
    this.cols = Math.max(1, cols);
    this.rows = Math.max(1, rows);
    this.cells = Array.from({ length: this.cols * this.rows }, () => ({ char: BLANK }));
    this.dirty = new Array(this.rows).fill(false);
    this.rowMinX = new Array(this.rows).fill(0);
    this.rowMaxX = new Array(this.rows).fill(0);
  }

  set(x: number, y: number, char: string, color?: string, bg?: string): void {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows || !char) return;
    const i = y * this.cols + x;
    const c = this.cells[i];
    const next = char === '' ? BLANK : char;
    if (c.char === next && c.color === color && c.bg === bg) return;
    c.char = next;
    c.color = color;
    c.bg = bg;
    if (!this.dirty[y]) {
      this.dirty[y] = true;
      this.rowMinX[y] = x;
      this.rowMaxX[y] = x;
    } else {
      if (x < this.rowMinX[y]) this.rowMinX[y] = x;
      if (x > this.rowMaxX[y]) this.rowMaxX[y] = x;
    }
  }

  get(x: number, y: number): Cell {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return { char: BLANK };
    return this.cells[y * this.cols + x];
  }

  resize(cols: number, rows: number): void {
    cols = Math.max(1, cols);
    rows = Math.max(1, rows);
    if (cols === this.cols && rows === this.rows) return;
    const next: Cell[] = Array.from({ length: cols * rows }, () => ({ char: BLANK }));
    const copyCols = Math.min(cols, this.cols);
    const copyRows = Math.min(rows, this.rows);
    for (let y = 0; y < copyRows; y++) {
      for (let x = 0; x < copyCols; x++) {
        next[y * cols + x] = this.cells[y * this.cols + x];
      }
    }
    this.cols = cols;
    this.rows = rows;
    this.cells = next;
    // Everything must be repainted after a resize.
    this.dirty = new Array(rows).fill(true);
    this.rowMinX = new Array(rows).fill(0);
    this.rowMaxX = new Array(rows).fill(this.cols - 1);
  }

  dirtyRows(): number[] {
    const out: number[] = [];
    for (let y = 0; y < this.rows; y++) if (this.dirty[y]) out.push(y);
    return out;
  }

  /** Run-length render of row y. Trailing unstyled blank runs are trimmed
      (they paint as background anyway); a fully blank row keeps a single
      blank run so the DOM writer always has something to diff. */
  rowRuns(y: number): Run[] {
    const runs: Run[] = [];
    let cur: Run | null = null;
    for (let x = 0; x < this.cols; x++) {
      const c = this.cells[y * this.cols + x];
      if (cur && cur.color === c.color && cur.bg === c.bg) {
        cur.text += c.char;
      } else {
        cur = { text: c.char, color: c.color, bg: c.bg };
        runs.push(cur);
      }
    }
    while (
      runs.length > 1 &&
      runs[runs.length - 1].color === undefined &&
      runs[runs.length - 1].bg === undefined &&
      runs[runs.length - 1].text.trim() === ''
    ) {
      runs.pop();
    }
    if (runs.length === 0 || runs.every((r) => r.text.trim() === '' && !r.color && !r.bg)) {
      return [{ text: String(BLANK) }];
    }
    return runs;
  }

  /** Clear a single row back to blanks (used by rain tails etc.). */
  clearRow(y: number): void {
    for (let x = 0; x < this.cols; x++) this.set(x, y, BLANK);
  }

  clearAll(): void {
    for (let y = 0; y < this.rows; y++) this.clearRow(y);
  }

  flush(): void {
    this.dirty.fill(false);
  }
}
