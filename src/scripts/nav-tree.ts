// nav-tree.ts — <nav-tree> role="tree" keyboard behaviour.
// Roving tabindex; arrows + vim keys (j/k/h/l); Space activates; Home/End.
// Folder toggles persist via tree-folder.ts. Keyboard-origin link activations
// (click.detail === 0) set a session flag so the next page re-focuses the
// current tree item — focus continuity across hard navigations.
import { getSessionStr, setSessionStr } from './persistent';

const RESTORE_KEY = 'nav-tree-restore-focus';

class NavTree extends HTMLElement {
  connectedCallback() {
    // Roving tabindex: exactly one tab stop — the current page, else the first item.
    const items = this.items();
    const stop = this.querySelector<HTMLElement>('.is-current') ?? items[0];
    for (const el of items) el.tabIndex = el === stop ? 0 : -1;

    this.addEventListener('focusin', (e) => this.onFocusIn(e));
    this.addEventListener('keydown', (e) => this.onKeydown(e));
    this.addEventListener('click', (e) => this.onClick(e as MouseEvent));

    if (getSessionStr(RESTORE_KEY, '') === '1') {
      setSessionStr(RESTORE_KEY, '');
      this.querySelector<HTMLElement>('.is-current')?.focus();
    }
  }

  /** Tree items whose folder chain is fully open (i.e. focusable). */
  private visible(): HTMLElement[] {
    return this.items().filter((el) => el.offsetParent !== null);
  }

  private items(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('[role="treeitem"]')];
  }

  private onFocusIn(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]');
    if (!target) return;
    for (const el of this.items()) el.tabIndex = el === target ? 0 : -1;
  }

  private onClick(e: MouseEvent): void {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.nav-item--page');
    // Keyboard activation (Enter/Space) produces click events with detail 0.
    if (link && e.detail === 0 && !link.target) setSessionStr(RESTORE_KEY, '1');
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const current = document.activeElement as HTMLElement | null;
    if (!current || !this.contains(current)) return;
    const items = this.visible();
    const idx = items.indexOf(current);
    if (idx === -1) return;

    const focus = (el: HTMLElement | undefined) => {
      if (el) {
        e.preventDefault();
        el.focus();
      }
    };

    const folderOf = (el: HTMLElement): HTMLElement | null => el.closest('tree-folder');
    const isFolderButton = current.hasAttribute('data-summary');

    switch (e.key) {
      case 'ArrowDown':
      case 'j':
        focus(items[idx + 1] ?? items[0]);
        break;
      case 'ArrowUp':
      case 'k':
        focus(items[idx - 1] ?? items[items.length - 1]);
        break;
      case 'Home':
        focus(items[0]);
        break;
      case 'End':
        focus(items[items.length - 1]);
        break;
      case 'ArrowRight':
      case 'l': {
        e.preventDefault();
        if (isFolderButton) {
          const folder = folderOf(current)!;
          if (!folder.hasAttribute('open')) current.click(); // expand
          else items[idx + 1]?.focus(); // move into the folder
        } else {
          current.click(); // enter: activate the link
        }
        break;
      }
      case 'ArrowLeft':
      case 'h': {
        e.preventDefault();
        const own = folderOf(current);
        if (isFolderButton && own?.hasAttribute('open')) {
          current.click(); // collapse
        } else {
          const parent = isFolderButton
            ? own?.parentElement?.closest('tree-folder')
            : own;
          parent
            ?.querySelector<HTMLElement>(':scope > button[data-summary]')
            ?.focus();
        }
        break;
      }
      case ' ': {
        // <button> toggles natively on Space; links need a synthetic click.
        if (current instanceof HTMLAnchorElement) {
          e.preventDefault();
          current.click();
        }
        break;
      }
    }
  }
}

if (!customElements.get('nav-tree')) customElements.define('nav-tree', NavTree);
