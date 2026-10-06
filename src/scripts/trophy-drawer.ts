// trophy-drawer.ts — <trophy-drawer> (ref §9). Bottom-right toggle
// "Trophies [n/7] [+]", a panel of the 7 trophy cards (locked = ?-masked
// title, colour-mix card bg at 10%; unlocked = 20% tint + real title), each
// with a <marquee-text> description (overflow-only linear hold-return loop,
// off under reduced motion), all inside a panel whose open state persists in
// am-trophy-ui:open. Toasts (role=status aria-live=polite) are inert clones
// of the unlocked card for 5 s, with a 1px outline flashing step-end every
// 0.4 s, shown only once the arrival wave / intro has cleared (rAF poll,
// 4 s cap). The element itself stays visibility:hidden (CSS) until it marks
// data-ready. Mounting this starts the moth (moth.ts) and wires the trophy
// triggers — the 'trophy:secret' listener is the T11 contract (site-terminal
// dispatches that name).

import {
  TROPHIES,
  isUnlocked,
  unlockedCount,
  initTrophyTriggers,
} from './trophies';
import type { TrophyDef } from './trophies';
import { getJSON, setJSON } from './persistent';
import { initMoth } from './moth';
import './marquee-text';

const TOAST_TTL = 5000;
const TOAST_WAIT_CAP = 4000;

class TrophyDrawer extends HTMLElement {
  private cards = new Map<string, HTMLElement>();
  private toggle!: HTMLButtonElement;
  private countEl!: HTMLSpanElement;
  private panel!: HTMLDivElement;
  private toasts!: HTMLDivElement;
  private ready = false;

  connectedCallback() {
    if (this.ready) return;
    this.ready = true;

    this.toggle = document.createElement('button');
    this.toggle.type = 'button';
    this.toggle.classList.add('trophy-toggle');
    this.toggle.setAttribute('aria-expanded', 'false');

    this.countEl = document.createElement('span');
    this.countEl.className = 'trophy-count';
    const indicator = document.createElement('toggle-indicator');
    indicator.setAttribute('aria-hidden', 'true');
    this.toggle.append(this.countEl, ' ', indicator);

    this.panel = document.createElement('div');
    this.panel.className = 'trophy-panel';
    this.panel.hidden = true;

    this.toasts = document.createElement('div');
    this.toasts.className = 'trophy-toasts';
    this.toasts.setAttribute('role', 'status');
    this.toasts.setAttribute('aria-live', 'polite');

    this.replaceChildren(this.toggle, this.panel, this.toasts);
    this.renderCards();
    this.updateCount();
    this.toggleOpen(getJSON<boolean>('trophy-ui:open', false));
    this.toggle.addEventListener('click', () => {
      this.toggleOpen(this.panel.hidden);
    });

    // Listening BEFORE initTrophyTriggers(): unlock events dispatched during
    // the init already have a drawer (tint + toast + count) to receive them.
    document.addEventListener('trophy:unlocked', this.onUnlock);
    for (const t of TROPHIES) {
      if (isUnlocked(t.id)) this.unlockCard(t.id, t);
    }
    initMoth();
    initTrophyTriggers();

    this.setAttribute('data-ready', '');
  }

  disconnectedCallback() {
    document.removeEventListener('trophy:unlocked', this.onUnlock);
  }

  private renderCards(): void {
    for (const t of TROPHIES) {
      const card: HTMLElement = t.rare
        ? document.createElement('button')
        : document.createElement('div');
      if (t.rare) (card as HTMLButtonElement).type = 'button';
      card.classList.add('trophy-card');
      if (t.rare) card.classList.add('trophy-cage');
      card.setAttribute('data-id', t.id);
      card.style.setProperty('--trophy-color', 'var(--color-' + t.color + ')');
      if (t.rare) card.setAttribute('tabindex', '-1'); // cage button: -1 until unlocked

      const head = document.createElement('div');
      head.className = 'trophy-head';
      const icon = document.createElement('span');
      icon.className = 'trophy-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = t.icon;
      const name = document.createElement('span');
      name.className = 'trophy-name';
      name.textContent = isUnlocked(t.id) ? t.title : t.locked;
      head.append(icon, name);
      card.appendChild(head);

      if (t.desc) {
        const m = document.createElement('marquee-text');
        m.textContent = t.desc;
        card.appendChild(m);
      } else if (t.rare) {
        // The caged moth sprite: moth.ts adopts + animates it, or (when
        // freed state restores) re-parents it out to .moth-host.
        const moth = document.createElement('span');
        moth.className = 'moth';
        moth.setAttribute('aria-hidden', 'true');
        moth.textContent = String.fromCharCode(47, 92);
        card.appendChild(moth);
      }

      if (isUnlocked(t.id)) this.unlockCard(t.id, t);
      this.cards.set(t.id, card);
      this.panel.appendChild(card);
    }
  }

  /** Unmask + tint one card (fresh unlock or restored state). */
  private unlockCard(id: string, t: TrophyDef): void {
    const card = this.cards.get(id);
    if (!card) return;
    card.setAttribute('data-unlocked', '');
    card.querySelector('.trophy-name')!.textContent = t.title;
    if (t.rare && card instanceof HTMLButtonElement) card.removeAttribute('tabindex');
  }

  private updateCount(): void {
    const n = unlockedCount();
    this.countEl.textContent = 'Trophies [' + n + '/7]';
    this.toggle.setAttribute('aria-label', 'Trophies, ' + n + ' of 7');
  }

  private toggleOpen(open: boolean): void {
    this.panel.hidden = !open;
    this.toggle.setAttribute('aria-expanded', String(open));
    setJSON('trophy-ui:open', open);
  }

  private onUnlock = (e: Event): void => {
    const id = (e as CustomEvent<{ id: string }>).detail.id;
    const t = TROPHIES.find((x) => x.id === id);
    if (!t) return;
    this.unlockCard(id, t);
    this.updateCount();
    this.enqueueToast(t, this.cards.get(id)!);
  };

  /** Toasts wait until wave-pending/intro-pending have cleared (rAF poll,
      4 s cap), then show for 5 s and self-remove. */
  private enqueueToast(t: TrophyDef, card: HTMLElement): void {
    const html = document.documentElement;
    const beganAt = performance.now();
    const poll = (): void => {
      const pending =
        (html.classList.contains('wave-pending') || html.classList.contains('intro-pending')) &&
        performance.now() - beganAt < TOAST_WAIT_CAP;
      if (pending) {
        requestAnimationFrame(poll);
        return;
      }
      this.showToast(t, card);
    };
    requestAnimationFrame(poll);
  }

  private showToast(t: TrophyDef, card: HTMLElement): void {
    if (!card) return;
    const clone = card.cloneNode(true) as HTMLElement;
    clone.removeAttribute('data-id');
    clone.setAttribute('inert', '');
    clone.classList.add('trophy-toast');
    this.toasts.appendChild(clone);
    setTimeout(() => clone.remove(), TOAST_TTL);
  }
}

if (!customElements.get('trophy-drawer')) customElements.define('trophy-drawer', TrophyDrawer);

export {};
