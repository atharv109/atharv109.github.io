// button-hover-wave.ts — ref §7.4. On pointerenter of any `.button`
// (hover-capable devices only, not reduced-motion, not while wave-pending,
// not [data-no-hover-wave]) the label's characters (excluding the icon) each
// play the same `= ~ - ~ =` glitch but at 30ms per symbol, with start offsets
// spread left→right at 20ms/char (capped at cols·20ms). Pure rAF — no CSS.
// Ends by restoring the plain label text.

import { SEQ } from './text-wave';

const HOVER_SLOT = 30; // ms per symbol slot (150ms glitch per char)
const CHAR_STEP = 20; // ms left→right spread per column

interface HoverChar {
  el: HTMLElement;
  real: string;
  offset: number;
  done: boolean;
}
interface SplitRec {
  parent: Node;
  text: string;
  inserted: Node[];
}

/** Wrap the label's chars (minus the icon) in `.wv-char` spans. */
function splitLabel(btn: HTMLElement): { chars: HoverChar[]; recs: SplitRec[] } | null {
  const host = btn.querySelector<HTMLElement>('.button-inner') ?? btn;
  const chars: HoverChar[] = [];
  const recs: SplitRec[] = [];
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || parent.closest('.button-icon')) return NodeFilter.FILTER_REJECT;
      return (node.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  let out = '';
  for (const tn of textNodes) {
    const text = tn.textContent ?? '';
    out += text;
    const parent = tn.parentElement!;
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const el = document.createElement('span');
      el.className = 'wv-char';
      el.style.opacity = '1'; // no hidden phase on hover — only the glitch
      el.textContent = ch;
      frag.appendChild(el);
      chars.push({
        el,
        real: ch,
        // left→right spread: nth char starts at n·20ms — with cols = char count
        // this is always ≤ cols·20ms total, per ref §7.4
        offset: chars.length * CHAR_STEP,
        done: false,
      });
    }
    const inserted = Array.from(frag.childNodes);
    parent.replaceChild(frag, tn);
    recs.push({ parent, text, inserted });
  }
  if (!out.trim()) return null;
  return { chars, recs };
}

function restore(recs: SplitRec[]): void {
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

function play(btn: HTMLElement, running: Set<HTMLElement>): void {
  const split = splitLabel(btn);
  if (!split) return;
  const { chars, recs } = split;
  running.add(btn);
  const start = performance.now();
  const step = (now: number) => {
    let pending = false;
    try {
      const t = now - start;
      for (const c of chars) {
        if (c.done) continue;
        const p = t - c.offset;
        if (p < 0) {
          pending = true;
          continue;
        }
        const slot = Math.floor(p / HOVER_SLOT);
        if (slot >= SEQ.length) {
          c.el.textContent = c.real;
          c.done = true;
        } else {
          c.el.textContent = SEQ[slot];
          pending = true;
        }
      }
    } catch {
      // Restoring the plain label matters more than the effect — and this must
      // not wedge the rAF loop (pending would stay true) or the button would
      // stay in `running` and never wave again.
      restore(recs);
      running.delete(btn);
      return;
    }
    if (pending) {
      requestAnimationFrame(step);
    } else {
      restore(recs);
      running.delete(btn);
    }
  };
  requestAnimationFrame(step);
}

/** Delegated pointerenter (capture — pointerenter does not bubble) on `.button`. */
export function attachHoverWave(doc: Document): void {
  const running = new Set<HTMLElement>();
  doc.addEventListener(
    'pointerenter',
    (e) => {
      const target = e.target as Element | null;
      const btn = target?.closest?.('.button');
      if (!(btn instanceof HTMLElement) || !btn.isConnected) return;
      if (btn.hasAttribute('data-no-hover-wave')) return;
      if (doc.documentElement.classList.contains('wave-pending')) return;
      if (running.has(btn)) return; // while one is running, re-entries queue nothing
      const view = doc.defaultView;
      if (!view) return;
      if (view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!view.matchMedia('(hover: hover)').matches) return;
      play(btn, running);
    },
    true,
  );
}