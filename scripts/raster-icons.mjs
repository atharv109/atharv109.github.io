// scripts/raster-icons.mjs — generate the raster image set from the AM mark
// (asset/mark/am-monogram.svg, ref §6 adapted). sharp is blocked on this box
// (npm allow-scripts policy), so the sanctioned fallback is a Playwright
// headless-chromium screenshot of the SVG renders:
//
//   node scripts/raster-icons.mjs
//
// Writes into public/: og.jpg (1200x630, dark bg + cream mark), and
// icon-96.png / apple-touch-icon.png (180) / icon-192.png / icon-512.png
// (cream disc + dark mark, maskable-safe because the art is a full-bleed
// circle). favicon.ico is NOT produced (multi-size ICO needs a raster
// pipeline we don't have) — documented as a follow-up.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

// The mark (user round 2026-10-06: bubble letters — dark outline under a
// green core, round caps; no gradients per the stack locks). Mirrors
// public/favicon.svg — keep the two in sync.
const LETTERS = `<path d="M290 200 150 800" /><path d="M290 200 430 800" /><path d="M215 595 365 595" /><path d="M590 200 590 800" /><path d="M590 200 710 555 830 200" /><path d="M830 200 830 800" />`;
const BUBBLE = (core, outline) =>
  `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${outline}" stroke-width="172">${LETTERS}</g>
    <g stroke="${core}" stroke-width="116">${LETTERS}</g>
  </g>`;

const MONOGRAM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  ${BUBBLE('currentColor', 'transparent')}
</svg>`;

const FAICON = (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <circle cx="500" cy="500" r="500" fill="#F8F9E8" />
  <g transform="translate(501 495) scale(0.62) translate(-501 -495)">${BUBBLE('#5AAE5A', '#1C2225')}</g>
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

// Icon set — cream disc + dark mark, one render per size.
for (const size of [96, 180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;} img{display:block;width:${size}px;height:${size}px;}
  </style></head><body><img alt="" src="data:image/svg+xml;base64,${Buffer.from(
    FAICON('#1C2225'),
  ).toString('base64')}" /></body></html>`;
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