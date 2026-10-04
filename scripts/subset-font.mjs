// scripts/subset-font.mjs — single source of truth for the shipped font subset.
//
// Produces public/fonts/IosevkaTermNF-Regular.woff2 from a locally supplied
// Iosevka Term NF source font, using pyftsubset (fonttools; `pip install fonttools`).
//
//   node scripts/subset-font.mjs path/to/IosevkaTermNF-Regular-full.woff2
//     (defaults INPUT to ./IosevkaTermNF-Regular.woff2 in the repo root)
//
// Subset contents: printable ASCII + é ñ + hand-picked Nerd-Font PUA icons +
// the custom "AM" logo glyph at U+100000 (added by Task 8 — see fonts/README.txt).
// Nerd-Font icon list may shrink/grow in later tasks; edit UNICODES here only.

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const INPUT = resolve(process.argv[2] ?? 'IosevkaTermNF-Regular.woff2');
const OUTPUT = resolve('public/fonts/IosevkaTermNF-Regular.woff2');

const UNICODES = [
  'U+0020-007E', // printable ASCII
  'U+00E9', // é
  'U+00F1', // ñ
  'U+E5FE', // folder open
  'U+E5FF', // folder closed
  'U+F0219', // generic page/file
  'U+F1860', // "index"
  'U+F0337', // generic external link
  'U+F09EB', // mailto
  'U+E709', // GitHub
  'U+F16D', // Instagram
  'U+F09E', // RSS
  'U+F0A54', // 404 button
  'U+F1A25', // lamp on
  'U+F1A26', // lamp off
  'U+EFB7', // trophy icon
  'U+F1020', // trophy icon
  'U+E28E', // trophy icon
  'U+F0DFA', // trophy icon
  'U+F0CFD', // trophy icon
  'U+EEF7', // trophy icon
  'U+100000', // AM logo glyph (added in Task 8)
].join(',');

const result = spawnSync(
  'pyftsubset',
  [INPUT, `--output-file=${OUTPUT}`, `--unicodes=${UNICODES}`, '--flavor=woff2', '--layout-features=*'],
  { stdio: 'inherit', shell: true },
);

if (result.error || result.status !== 0) {
  console.error('\npyftsubset failed or is not installed.');
  console.error('Fallback: see public/fonts/README.txt for the interim font arrangement.');
  process.exit(result.status ?? 1);
}

console.log(`\nWrote ${OUTPUT}`);
