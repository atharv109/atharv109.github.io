// text-wave.ts — ref §7.3 "glitch type-in" (the signature effect). Every
// in-viewport text block splits into per-word `.wv-word` / per-char `.wv-char`
// spans; chars type in along a top-left → bottom-right diagonal (500ms sweep
// per block, blocks stagger ≤450ms by viewport position) through the symbol
// sequence `= ~ - ~ =` at 40ms slots, then the original DOM is restored via
// text-node reinsertion + normalize(). Driven by requestAnimationFrame only —
// no CSS animations, and the one allowed transition is the sanctioned 400ms
// linear background-color restore on .button-inner.
// charDelay / blockStart / SEQ / SLOT are pure and unit-tested in node.

export const SEQ = ['=', '~', '-', '~', '='];
export const SLOT = 40; // ms per symbol slot — one glitch pass is 200ms
export const WAVE = 500; // ms the diagonal sweep takes inside one block
export const STAGGER = 450; // ms max start stagger between blocks
const CHAR_EPS = 0.05; // ms/char tie-break for chars sharing a diagonal slot
const BUTTON_RESTORE = 400; // ms .button-inner background-color fade back

const TARGET_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, .astro-code .line';
const SKIP_SELECTOR = '[data-text-wave="skip"]';
const ICON_SELECTOR = '.button-icon';
const DASH_RE = /[-–—]/;

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Delay of one char = its diagonal phase (top-left → bottom-right in the
    block) × 500ms. `index` (0-based index of the char within its block) adds
    a tiny ε so chars on the same anti-diagonal still type in reading order. */
export function charDelay(
  cell: { left: number; top: number },
  bounds: { left: number; top: number; width: number; height: number },
  index: number,
): number {
  const nx = bounds.width > 0 ? (cell.left - bounds.left) / bounds.width : 0;
  const ny = bounds.height > 0 ? (cell.top - bounds.top) / bounds.height : 0;
  return clamp01((nx + ny) / 2) * WAVE + index * CHAR_EPS;
}

/** Blocks lower on the screen start later — at most 450ms stagger. */
export function blockStart(
  blockTop: number,
  topmostBlockTop: number,
  innerHeight: number,
): number {
  const denom = innerHeight > 0 ? innerHeight : 1;
  return clamp01((blockTop - topmostBlockTop) / denom) * STAGGER;
}

interface CharSpan {
  el: HTMLSpanElement;
  real: string;
  delay: number;
  done: boolean;
}
interface SplitRec {
  parent: Node;
  text: string;
  inserted: Node[];
}
interface InnerRec {
  el: HTMLElement;
  at: number; // restore time = blockStart + earliestCharPhase × 500ms
  restored: boolean;
  cleared: boolean;
}

function inViewport(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
}

function collectBlocks(root: Element): HTMLElement[] {
  const blocks: HTMLElement[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(TARGET_SELECTOR)) {
    if (el.closest(SKIP_SELECTOR)) continue;
    if (el.querySelector(TARGET_SELECTOR)) continue; // leaf-ish: animate the innermost blocks
    if (!(el.textContent ?? '').trim()) continue; // nonempty only
    if (!inViewport(el)) continue;
    blocks.push(el);
  }
  return blocks;
}

function splittableTextNodes(block: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      if (parent.closest(ICON_SELECTOR)) return NodeFilter.FILTER_REJECT; // icons excluded
      if (parent instanceof HTMLScriptElement || parent instanceof HTMLStyleElement) {
        return NodeFilter.FILTER_REJECT;
      }
      return (node.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

function charSpan(ch: string, chars: CharSpan[]): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = 'wv-char';
  el.style.opacity = '0';
  el.textContent = ch;
  chars.push({ el, real: ch, delay: 0, done: false });
  return el;
}

function makeWord(text: string, chars: CharSpan[]): HTMLElement {
  const word = document.createElement('span');
  word.className = 'wv-word';
  word.style.whiteSpace = 'nowrap';
  for (const ch of text) word.appendChild(charSpan(ch, chars));
  return word;
}

/** Words also break after `-`/`–`/`—` so nowrap words keep their wrap spots. */
function appendWord(frag: DocumentFragment, word: string, chars: CharSpan[]): void {
  let cur = '';
  for (const ch of word) {
    cur += ch;
    if (DASH_RE.test(ch)) {
      frag.appendChild(makeWord(cur, chars));
      const br = document.createElement('wbr');
      br.className = 'wv-break';
      frag.appendChild(br);
      cur = '';
    }
  }
  if (cur) frag.appendChild(makeWord(cur, chars));
}

function splitBlock(block: HTMLElement, chars: CharSpan[], recs: SplitRec[]): void {
  for (const tn of splittableTextNodes(block)) {
    const text = tn.textContent ?? '';
    const parent = tn.parentElement!;
    const frag = document.createDocumentFragment();
    const tokenRe = /(\s+)|([^\s]+)/g;
    let m: RegExpExecArray | null;
    while ((m = tokenRe.exec(text)) !== null) {
      if (m[1]) {
        const ws = document.createElement('span');
        ws.className = 'wv-space';
        ws.style.display = 'inline';
        ws.textContent = m[1];
        frag.appendChild(ws);
      } else {
        appendWord(frag, m[2], chars);
      }
    }
    const inserted = Array.from(frag.childNodes);
    parent.replaceChild(frag, tn);
    recs.push({ parent, text, inserted });
  }
}

/** Restore the original DOM: reinsert each split text node, then merge. */
function normalize(recs: SplitRec[]): void {
  for (const rec of recs) {
    const first = rec.inserted[0] ?? null;
    rec.parent.insertBefore(document.createTextNode(rec.text), first);
    for (const node of rec.inserted) node.parentNode?.removeChild(node);
  }
  const seen = new Set<Node>();
  for (const rec of recs) {
    if (!seen.has(rec.parent)) {
      seen.add(rec.parent);
      rec.parent.normalize();
    }
  }
}

/**
 * Split + play the glitch type-in. Resolves with the largest char delay (ms)
 * so callers can chain intro steps. The DOM is fully normalized again by the
 * time it resolves, even if the drive loop throws mid-run.
 */
export async function runTextWave(root: Element | null): Promise<number> {
  if (!root) return 0;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;

  const blocks = collectBlocks(root);
  if (!blocks.length) return 0;

  const chars: CharSpan[] = [];
  const recs: SplitRec[] = [];
  const inners: InnerRec[] = [];
  try {
    for (const block of blocks) splitBlock(block, chars, recs); // split first, measure after

    const tops = blocks.map((b) => b.getBoundingClientRect().top);
    const topmost = Math.min(...tops);
    const vh = window.innerHeight;
    let maxDelay = 0;
    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      const base = blockStart(rect.top, topmost, vh);
      const mine = chars.filter((c) => block.contains(c.el));
      mine.forEach((c, i) => {
        const r = c.el.getBoundingClientRect();
        c.delay = base + charDelay({ left: r.left, top: r.top }, rect, i);
        if (c.delay > maxDelay) maxDelay = c.delay;
      });
    }

    // Button chips: transparent while the wave crosses; restore right when the
    // block's own text starts arriving. Icon-only chips have no chars — skip.
    for (const block of blocks) {
      for (const inner of block.querySelectorAll<HTMLElement>('.button-inner')) {
        const mine = chars.filter((c) => inner.contains(c.el));
        if (!mine.length) continue;
        inners.push({
          el: inner,
          at: Math.min(...mine.map((c) => c.delay)),
          restored: false,
          cleared: false,
        });
      }
    }
    for (const b of inners) b.el.style.backgroundColor = 'transparent';

    // Lift wave-pending's hide (inline override of
    // `html.wave-pending .content-lines { opacity: 0 }`) so the reveal plays
    // visibly; the caller drops the class itself once this resolves.
    if (root instanceof HTMLElement) root.style.opacity = '1';

    await drive(chars, inners, maxDelay);
    return maxDelay;
  } finally {
    normalize(recs);
    if (root instanceof HTMLElement) root.style.removeProperty('opacity');
  }
}

function drive(chars: CharSpan[], inners: InnerRec[], maxDelay: number): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      let pending = false;
      try {
        for (const c of chars) {
          if (c.done) continue;
          const p = now - start - c.delay;
          if (p < 0) {
            pending = true;
            continue;
          }
          const slot = Math.floor(p / SLOT);
          if (slot >= SEQ.length) {
            c.el.textContent = c.real;
            c.done = true;
          } else {
            c.el.style.opacity = '1';
            c.el.textContent = SEQ[slot];
            pending = true;
          }
        }
        for (const b of inners) {
          if (b.cleared) continue;
          if (now - start >= b.at + BUTTON_RESTORE + 20) {
            b.el.style.removeProperty('transition');
            b.cleared = true;
          } else if (now - start >= b.at && !b.restored) {
            b.el.style.transition = `background-color ${BUTTON_RESTORE}ms linear`;
            b.el.style.backgroundColor = '';
            b.restored = true;
          }
          pending = true;
        }
      } catch {
        // normalize() still runs in the caller's finally; resolve to let boot finish
      }
      if (pending) {
        requestAnimationFrame(step);
      } else {
        resolve(maxDelay);
      }
    };
    requestAnimationFrame(step);
  });
}