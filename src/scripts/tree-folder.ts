// tree-folder.ts — <tree-folder> behaviour: click toggle, aria-expanded sync,
// persistence of open state in the am-nav-open JSON map (label -> "true"/"false").
//
// Folders containing the current route are server-rendered with [open] and no
// data-persist marker; every other folder carries data-persist and is hydrated
// from storage here, at module-eval time (before first paint), so folders never
// flash open/closed after load.
import { getJSON, setJSON } from './persistent';

const KEY = 'nav-open';
type OpenMap = Record<string, string>;

class TreeFolder extends HTMLElement {
  connectedCallback() {
    const button = this.querySelector<HTMLButtonElement>(':scope > button[data-summary]');
    button?.addEventListener('click', () => this.toggle());
    this.syncAria(button ?? undefined);
  }

  toggle(): void {
    this.toggleAttribute('open', !this.hasAttribute('open'));
    this.syncAria(this.querySelector<HTMLButtonElement>(':scope > button[data-summary]') ?? undefined);
    const label = this.getAttribute('label');
    if (!label) return;
    const map = getJSON<OpenMap>(KEY, {});
    map[label] = String(this.hasAttribute('open'));
    setJSON(KEY, map);
  }

  private syncAria(button?: HTMLButtonElement): void {
    button?.setAttribute('aria-expanded', String(this.hasAttribute('open')));
  }
}

export function restoreFolderState(scope: ParentNode = document): void {
  const map = getJSON<OpenMap>(KEY, {});
  for (const el of scope.querySelectorAll<HTMLElement>('tree-folder[data-persist]')) {
    const label = el.getAttribute('label');
    if (label && map[label] === 'true') el.setAttribute('open', '');
    else if (label && map[label] === 'false') el.removeAttribute('open');
    el.removeAttribute('data-persist');
  }
}

if (!customElements.get('tree-folder')) customElements.define('tree-folder', TreeFolder);
restoreFolderState();
