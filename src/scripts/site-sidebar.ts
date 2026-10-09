// site-sidebar.ts — <site-sidebar> hosts the off-canvas drawer state (mobile).
// The fixed Menu [+] button toggles [open]; tapping the transparent overlay or
// any link inside the sidebar closes it. Instant (no transition) per spec.
// The drawer hides by transform only — while closed it is also INERT at
// ≤50rem so its links stay out of the tab order (mobile QA round): a
// foldable/keyboard device no longer tabs into an invisible drawer.

class SiteSidebar extends HTMLElement {
  static observedAttributes = ['open'];

  connectedCallback() {
    const button = document.querySelector<HTMLButtonElement>('.menu-button');
    const overlay = this.querySelector<HTMLElement>('[data-sidebar-overlay]');
    const nav = this.querySelector<HTMLElement>('.sidebar nav');

    button?.addEventListener('click', () => this.toggleAttribute('open'));
    overlay?.addEventListener('click', () => this.removeAttribute('open'));
    this.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) this.removeAttribute('open');
    });
    // Escape closes the drawer — a keyboard user's way out of the open
    // state (and the only one a foldable keyboard-only session would have).
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.removeAttribute('open');
    });

    // Inert bookkeeping: mobile-only (the desktop sidebar is permanently
    // visible and must never be inert). Re-evaluated on resize so a rotate
    // or fold across the breakpoint can't strand the wrong state.
    const sync = (): void => {
      const mobile = window.matchMedia('(width <= 50rem)').matches;
      if (nav) nav.inert = mobile ? !this.hasAttribute('open') : false;
    };
    this.syncInert = sync;
    sync();
    window.addEventListener('resize', sync);
  }

  attributeChangedCallback(name: string): void {
    if (name !== 'open') return;
    document
      .querySelector<HTMLButtonElement>('.menu-button')
      ?.setAttribute('aria-expanded', String(this.hasAttribute('open')));
    this.syncInert?.();
  }

  syncInert?: () => void;
}

if (!customElements.get('site-sidebar')) customElements.define('site-sidebar', SiteSidebar);