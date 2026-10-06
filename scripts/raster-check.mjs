// scripts/raster-check.mjs — raster legibility check for the AM monogram
// (Task 8 acceptance): the mask must read "AM" at ~9 and ~13 cells wide, and
// the favicon mark must read at 16px. Run:
//
//   node scripts/raster-check.mjs [path/to/font.woff2]
//
// Opens the font in a real browser canvas (Playwright-chromium), rasterises
// U+100000 exactly like src/scripts/ascii/logo-mask.ts does, thresholds at
// 50% coverage, and prints the cell mask. Iterate the design coordinates in
// scripts/add-glyph.py + assets/mark/am-monogram.svg until both dumps read AM.

import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const fontPath = process.argv[2] ?? 'public/fonts/IosevkaTermNF-Regular.woff2';
const fontB64 = readFileSync(fontPath).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(
  `<style>@font-face{font-family:NF;src:url(data:font/woff2;base64,${fontB64}) format('woff2');}</style>`,
);
await page.evaluate(() => document.fonts.load('100px NF', 'X'));

const result = await page.evaluate(() => {
  const GLYPH = String.fromCodePoint(0x100000);

  function rasterize(cols, rows, logoScale) {
    const w = cols * 4;
    const h = rows * 4;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    g.font = '100px NF';
    const m = g.measureText(GLYPH);
    const bw = (m.actualBoundingBoxLeft ?? 0) + (m.actualBoundingBoxRight ?? 0) || 100;
    const bh = (m.actualBoundingBoxAscent ?? 0) + (m.actualBoundingBoxDescent ?? 0) || 100;
    const s = Math.min((logoScale * w) / bw, (logoScale * h) / bh);
    g.textBaseline = 'alphabetic';
    const X = w / 2 - (bw * s) / 2 + (m.actualBoundingBoxLeft ?? 0) * s;
    const Y = h / 2 + ((m.actualBoundingBoxAscent ?? bh / 2) - bh / 2) * s;
    g.font = `${100 * s}px NF`;
    g.fillText(GLYPH, X, Y);
    const data = g.getImageData(0, 0, w, h).data;
    const alpha = [];
    for (let i = 0; i < w * h; i++) alpha.push(data[i * 4 + 3]);
    return { width: w, height: h, alpha, bw, bh, fontSize: 100 * s, advance: m.width };
  }

  function maskOf(r, cols, rows) {
    const cells = [];
    let count = 0;
    let x0 = -1, y0 = -1, x1 = -1, y1 = -1;
    for (let crow = 0; crow < rows; crow++) {
      let line = '';
      for (let ccol = 0; ccol < cols; ccol++) {
        let sum = 0;
        for (let sy = 0; sy < 4; sy++)
          for (let sx = 0; sx < 4; sx++)
            sum += r.alpha[(crow * 4 + sy) * r.width + ccol * 4 + sx] ?? 0;
        const on = sum >= 4080 * 0.5;
        if (on) {
          count++;
          line += '#';
          if (x0 === -1 || ccol < x0) x0 = ccol;
          if (ccol > x1) x1 = ccol;
          if (y0 === -1 || crow < y0) y0 = crow;
          if (crow > y1) y1 = crow;
        } else line += '.';
      }
      cells.push(line);
    }
    return { lines: cells, count, bbox: { x0, y0, x1, y1 } };
  }

  const runs = [];
  for (const [cols, rows, scale, label] of [
    [24, 17, 0.5, 'mark ~9 cells wide (desktop 0.5 scale)'],
    [30, 24, 0.5, 'mark ~13 cells wide'],
    [24, 17, 0.9, 'mobile 0.9 scale on same grid'],
  ]) {
    const r = rasterize(cols, rows, scale);
    const m = maskOf(r, cols, rows);
    runs.push({
      label,
      fontSizePx: +(r.fontSize ?? 0).toFixed(1),
      advance: r.advance,
      widthCells: m.bbox.x1 - m.bbox.x0 + 1,
      heightCells: m.bbox.y1 - m.bbox.y0 + 1,
      count: m.count,
      lines: m.lines,
    });
  }

  // favicon render (the real public/favicon.svg) at 16px
  const favRes = (async () => null)();
  return { runs, fav: null, favDone: favRes };
});

// favicon via <img>
const favB64 = readFileSync('public/favicon.svg').toString('base64');
const fav = await page.evaluate(
  async (b64) => {
    const img = new Image();
    img.src = `data:image/svg+xml;base64,${b64}`;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, 16, 16);
    const d = g.getImageData(0, 0, 16, 16).data;
    const lines = [];
    for (let y = 0; y < 16; y++) {
      let line = '';
      for (let x = 0; x < 16; x++) {
        const i = (y * 16 + x) * 4;
        if (d[i + 3] < 32) line += ' ';
        else {
          const lum = d[i] + d[i + 1] + d[i + 2];
          line += lum < 350 ? '#' : '.'; // dark mark on cream circle
        }
      }
      lines.push('|' + line + '|');
    }
    return lines;
  },
  favB64,
);

for (const r of result.runs) {
  console.log(`\n== ${r.label} ==  font ${r.fontSizePx}px  bbox ${r.widthCells}x${r.heightCells} cells  mask cells ${r.count}`);
  console.log(r.lines.join('\n'));
}
console.log('\n== favicon.svg at 16px ==  (# = dark mark, . = cream circle)');
console.log(fav.join('\n'));
await browser.close();