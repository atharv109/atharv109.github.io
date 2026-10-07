// scripts/raster-icons.mjs — generate the raster image set. Source of truth
// since the user round 2026-10-06 is the user's own PNG
// (assets/cocoa-am.png — the cocoa "cute AM" monogram they made; the
// hand-drawn SVG marks below are retired from the icon set and only feed
// og.jpg now). sharp is blocked on this box (npm allow-scripts policy), so
// the sanctioned fallback is a Playwright headless-chromium screenshot of
// the resizes:
//
//   node scripts/raster-icons.mjs
//
// Writes into public/: og.jpg (1200x630, dark bg + cream mark), and
// icon-96.png / apple-touch-icon.png (180) / icon-192.png / icon-512.png
// from assets/cocoa-am.png (full-bleed cream square; maskable-safe: the AM
// art sits inside the middle ~60%). favicon.ico NOT produced (no ICO
// pipeline) — documented follow-up; the tab uses icon-96.png.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

// Retired icon mark (kept only for og.jpg): bubble letters, dark outline
// under a green core, round caps; no gradients per the stack locks.
const LETTERS = `<path d="M290 200 150 800" /><path d="M290 200 430 800" /><path d="M215 595 365 595" /><path d="M590 200 590 800" /><path d="M590 200 710 555 830 200" /><path d="M830 200 830 800" />`;
const BUBBLE = (core, outline) =>
  `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${outline}" stroke-width="172">${LETTERS}</g>
    <g stroke="${core}" stroke-width="116">${LETTERS}</g>
  </g>`;

const MONOGRAM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  ${BUBBLE('currentColor', 'transparent')}
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();

// og.jpg — 1200x630, dark base, cream mark centred + wordmark line.
const OG_W = 1200;
const OG_H = 630;
await page.setViewportSize({ width: OG_W, height: OG_H });
const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#1c2225;}
  body{width:${OG_W}px;height:${OG_H}px;display:grid;place-items:center;}
  .mark{width:400px;height:400px;color:#f8f9e8;}
  .caption{position:absolute;left:50%;transform:translateX(-50%);bottom:96px;
    font-family:'Courier New',monospace;font-size:34px;letter-spacing:0.35em;
    color:#f8f9e8;}
</style></head><body>
  <div class="mark">${MONOGRAM}</div>
  <div class="caption">ATHARV&nbsp;MITTAL</div>
</body></html>`;
await page.setContent(ogHtml, { waitUntil: 'networkidle' });
writeFileSync(
  'public/og.jpg',
  await page.screenshot({ clip: { x: 0, y: 0, width: OG_W, height: OG_H }, type: 'jpeg', quality: 92 }),
);

// Icon set — the user's cocoa AM PNG, downscaled one render per size.
const COCOA = readFileSync('assets/cocoa-am.png').toString('base64');
for (const size of [96, 180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;} img{display:block;width:${size}px;height:${size}px;image-rendering:auto;}
  </style></head><body><img alt="" src="data:image/png;base64,${COCOA}" /></body></html>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  mkdirSync('public', { recursive: true });
  writeFileSync(
    `public/${name}`,
    await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, type: 'png' }),
  );
}

await browser.close();
console.log('wrote public/og.jpg + icon-96/180/192/512.png');