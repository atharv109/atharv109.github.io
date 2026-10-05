// tree-folder.ts — <tree-folder> interaction: click toggle, aria-expanded sync,
// persistence of open state in the am-nav-open JSON map (label -> "true"/"false").
//
// Open state itself is restored synchronously by the inline boot script in
// PageLayout.astro: it defines the custom element in <head>, so each
// <tree-folder> upgrades as the parser reaches it and renders in its final
// open/closed state at first paint. This module therefore never re-applies
// saved state on load — it only wires interaction (document-delegated, so it
// works whichever definition won registration).
import { getJSON, setJSON } from './persistent';

const KEY = 'nav-open';
type OpenMap = Record<string, string>;

function summaryButton(folder: HTMLElement): HTMLButtonElement | null {
  return folder.querySelector<HTMLButtonElement>(':scope > button[data-summary]');
}

export function syncAria(folder: HTMLElement): void {
  summaryButton(folder)?.setAttribute(
    'aria-expanded',
    String(folder.hasAttribute('open')),
  );
}

export function toggleFolder(folder: HTMLElement): void {
  folder.toggleAttribute('open', !folder.hasAttribute('open'));
  syncAria(folder);
  const label = folder.getAttribute('label');
  if (!label) return;
  const map = getJSON<OpenMap>(KEY, {});
  map[label] = String(folder.hasAttribute('open'));
  setJSON(KEY, map);
}

// Guarded define: normally a no-op because the boot script registered the
// element synchronously; kept as a fallback if the inline script was skipped.
if (!customElements.get('tree-folder'))
  customElements.define('tree-folder', class extends HTMLElement {});

document.addEventListener('click', (e) => {
  const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-summary]');
  if (button && button.parentElement?.tagName.toLowerCase() === 'tree-folder') {
    toggleFolder(button.parentElement as HTMLElement);
  }
});

// One-time aria sync: during parsing, a folder's connectedCallback ran before
// its summary button was parsed, so restored-open folders need their
// aria-expanded corrected here (visual state was already correct pre-paint).
for (const folder of document.querySelectorAll<HTMLElement>('tree-folder'))
  syncAria(folder);
