// marquee-text.ts — <marquee-text>: a description that scrolls only when it
// overflows its box (ref §9: "each description is a <marquee-text>"). Linear
// hold-return loop: scroll left at constant speed, hold at the far end,
// return to 0, repeat. Reduced motion (ref §14): never animates — static text.

const SPEED = 12; // px/s, linear
const HOLD_MS = 1200; // pause at the far end before returning

class MarqueeText extends HTMLElement {
  private wrap!: HTMLSpanElement;
  private raf = 0;
  private phaseAt = 0; // performance.now() of the current phase start
  private overflow = 0;
  private holding = false;
  private reduced = false;

  connectedCallback() {
    if (this.isConnectedSetup) return;
    this.isConnectedSetup = true;
    this.wrap = document.createElement('span');
    this.wrap.className = 'marquee-inner';
    while (this.firstChild) this.wrap.appendChild(this.firstChild);
    if (this.wrap.childNodes.length === 0) this.wrap.textContent = ' ';
    this.appendChild(this.wrap);
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.measure();
    window.addEventListener('resize', this.measure);
    document.fonts?.ready?.then(() => this.measure()).catch(() => {});
  }

  private isConnectedSetup = false;

  /** Re-wrap late content and re-evaluate overflow; safe to call anytime. */
  measure = (): void => {
    if (!this.wrap) return;
    while (this.firstChild && this.firstChild !== this.wrap) {
      this.wrap.appendChild(this.firstChild);
    }
    this.overflow = Math.max(0, this.wrap.scrollWidth - this.clientWidth);
    this.setOffset(0);
    if (!this.reduced && this.overflow > 1) this.play();
    else this.stop();
  };

  disconnectedCallback() {
    this.isConnectedSetup = false;
    this.stop();
    window.removeEventListener('resize', this.measure);
  }

  private setOffset(x: number): void {
    this.wrap.style.transform = x ? `translateX(-${x}px)` : '';
  }

  private play(): void {
    if (this.raf) return;
    this.phaseAt = performance.now();
    this.holding = false;
    this.raf = requestAnimationFrame(this.tick);
  }

  private stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.wrap.style.transform = '';
  }

  private tick = (now: number): void => {
    this.raf = 0;
    if (this.holding) {
      if (now - this.phaseAt >= HOLD_MS) {
        this.holding = false;
        this.phaseAt = now;
        this.setOffset(0);
      }
    } else {
      const ms = (this.overflow / SPEED) * 1000;
      const k = Math.min(1, (now - this.phaseAt) / ms);
      this.setOffset(k * this.overflow);
      if (k >= 1) {
        this.holding = true;
        this.phaseAt = now;
      }
    }
    this.raf = requestAnimationFrame(this.tick);
  };
}

if (!customElements.get('marquee-text')) customElements.define('marquee-text', MarqueeText);

export {};