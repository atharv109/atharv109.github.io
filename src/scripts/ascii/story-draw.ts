// story-draw.ts — glyph helpers for story scene draws (Task 14). Pure surface
// painters: DOM-free, stateless, no rng consumption (flicker uses pure integer
// hashes keyed on (slot, row) so the same p always yields the same frame).
// Colours are token strings, resolved live by the renderer's insertRule class
// cache (same mechanism as boids.ts).
//
// GLYPH NOTE: the shipped woff2 is an ASCII subset (scripts/subset-font.mjs);
// box-drawing/block/symbol codepoints fall back to system fonts at a different
// advance (~7.7px vs the 7px cell), which drifts everything drawn to their
// right. Scene structure is therefore pure ascii (+ - | # . :) — crisp in-font
// cells — and the brief's red ✗ appears only as an isolated stamp with nothing
// drawn after it in its row, so the fallback advance has nothing to shift.

import type { AsciiSurface } from './surface';

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** 1234567 → "1,234,567" — manual grouping, no locale dependence in tests. */
export function fmt(n: number): string {
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Write a string left-to-right. Spaces without a bg never erase neighbours. */
export function str(
  surface: AsciiSurface,
  x: number,
  y: number,
  text: string,
  color?: string,
  bg?: string,
): void {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ' && bg === undefined) continue;
    surface.set(x + i, y, text[i], color, bg);
  }
}

/** Horizontally centered text; returns the x it started at. */
export function strC(surface: AsciiSurface, y: number, text: string, color?: string, bg?: string): number {
  const x = Math.max(0, Math.floor((surface.cols - text.length) / 2));
  str(surface, x, y, text, color, bg);
  return x;
}

/** Left-aligned inside a given box span (x0 included), clamped to width. */
export function strIn(
  surface: AsciiSurface,
  x0: number,
  width: number,
  y: number,
  text: string,
  color?: string,
  bg?: string,
): void {
  // Clip instead of spilling into the next column region on narrow panes.
  const clipped = width > 0 ? text.slice(0, width) : '';
  str(surface, x0, y, clipped, color, bg);
}

export function hline(
  surface: AsciiSurface,
  x0: number,
  x1: number,
  y: number,
  color?: string,
  ch = '-',
): void {
  for (let x = Math.max(0, x0); x <= Math.min(surface.cols - 1, x1); x++)
    surface.set(x, y, ch, color);
}

export function vline(
  surface: AsciiSurface,
  x: number,
  y0: number,
  y1: number,
  color?: string,
  ch = '|',
): void {
  for (let y = Math.max(0, y0); y <= Math.min(surface.rows - 1, y1); y++)
    surface.set(x, y, ch, color);
}

/** 1-cell ascii frame: '+' corners, '-' edges, '|' sides. */
export function box(surface: AsciiSurface, x: number, y: number, w: number, h: number, color?: string): void {
  if (w < 2 || h < 2) return;
  hline(surface, x + 1, x + w - 2, y, color);
  hline(surface, x + 1, x + w - 2, y + h - 1, color);
  vline(surface, x, y + 1, y + h - 2, color);
  vline(surface, x + w - 1, y + 1, y + h - 2, color);
  surface.set(x, y, '+', color);
  surface.set(x + w - 1, y, '+', color);
  surface.set(x, y + h - 1, '+', color);
  surface.set(x + w - 1, y + h - 1, '+', color);
}

/** Label punched into a border row (bg covers the border glyphs). */
export function borderLabel(
  surface: AsciiSurface,
  x: number,
  y: number,
  text: string,
  color: string,
  bg: string,
): void {
  str(surface, x, y, text, color, bg);
}

/** Stable pure hash of two ints → non-negative int (flicker slots etc.). */
export function hash2(a: number, b: number): number {
  let h = (a * 0x85ebca6b) ^ (b * 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2d);
  h ^= h >>> 16;
  return h >>> 0;
}