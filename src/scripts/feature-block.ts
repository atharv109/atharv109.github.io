// feature-block.ts — behavior for <feature-block> (markup: FeatureBlock.astro,
// styles: components.css). Collapse persistence via am-feature-open:<key>; media
// heights snap to the 19px line grid; embeds arm iframe pointer-events only
// after an explicit click (prevents scroll-hijack).

import { getJSON, setJSON } from './persistent';

const LINE = 19;

function snapMediaHeights(block: HTMLElement) {
  const inner = block.querySelector<HTMLElement>('.fb-inner');
  const img = block.querySelector<HTMLImageElement>('img');
  if (!inner || !img || !img.naturalWidth || !img.naturalHeight) return;
  const lines = Math.max(1, Math.round((inner.clientWidth * (img.naturalHeight / img.naturalWidth)) / LINE));
  inner.style.height = `${lines * LINE}px`;
}

function setOpen(block: HTMLElement, open: boolean) {
  const title = block.querySelector<HTMLElement>('.fb-title');
  const toggle = block.querySelector<HTMLElement>('.fb-toggle');
  block.toggleAttribute('collapsed', !open);
  title?.setAttribute('aria-expanded', String(open));
  if (toggle) toggle.textContent = open ? '[-]' : '[+]';
}

function init(block: HTMLElement) {
  const key = block.dataset.key;
  if (key) {
    const saved = getJSON<boolean | null>(`feature-open:${key}`, null);
    if (saved !== null) setOpen(block, saved);
  }

  if (block.dataset.kind === 'media') {
    const img = block.querySelector<HTMLImageElement>('img');
    if (img) {
      if (img.complete) snapMediaHeights(block);
      else img.addEventListener('load', () => snapMediaHeights(block), { once: true });
      new ResizeObserver(() => snapMediaHeights(block)).observe(block.querySelector('.fb-inner')!);
    }
  }

  block.addEventListener('click', (e) => {
    const isCollapsed = block.hasAttribute('collapsed');
    const onTitle = (e.target as HTMLElement).closest('.fb-title') !== null;
    if (isCollapsed) {
      e.stopPropagation(); // never let a collapsed-block click reach popup interceptors
      setOpen(block, true);
    } else if (onTitle) {
      setOpen(block, false);
    } else {
      return;
    }
    const key2 = block.dataset.key;
    if (key2) setJSON(`feature-open:${key2}`, block.hasAttribute('collapsed') ? false : true);
  });

  if (block.dataset.kind === 'embed') {
    const catcher = block.querySelector<HTMLElement>('.fb-embed-catcher');
    catcher?.addEventListener('click', (e) => {
      e.stopPropagation();
      block.setAttribute('data-embed-active', '');
      block.querySelector('iframe')?.focus();
    });
    document.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('feature-block') !== block) {
        block.removeAttribute('data-embed-active');
      }
    });
  }
}

export function initFeatureBlocks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('feature-block').forEach(init);
}
