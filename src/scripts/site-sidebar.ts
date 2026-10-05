// site-sidebar.ts — <site-sidebar> hosts the off-canvas drawer state (mobile).
// The fixed Menu [+] button toggles [open]; tapping the transparent overlay or
// any link inside the sidebar closes it. Instant (no transition) per spec.

class SiteSidebar extends HTMLElement {
  static observedAttributes = ['open'];

  connectedCallback() {
    const button = document.querySelector<HTMLButtonElement>('.menu-button');
    const overlay = this.querySelector<HTMLElement>('[data-sidebar-overlay]');

    button?.addEventListener('click', () => this.toggleAttribute('open'));
    overlay?.addEventListener('click', () => this.removeAttribute('open'));
    this.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) this.removeAttribute('open');
    });
  }

  attributeChangedCallback(name: string): void {
    if (name !== 'open') return;
    document
      .querySelector<HTMLButtonElement>('.menu-button')
      ?.setAttribute('aria-expanded', String(this.hasAttribute('open')));
  }
}

if (!customElements.get('site-sidebar')) customElements.define('site-sidebar', SiteSidebar);
