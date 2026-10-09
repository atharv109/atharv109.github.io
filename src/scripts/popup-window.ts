// popup-window.ts — <popup-window> custom element + openPopup() + the global
// data-popup-src link interceptor. Behavior per the reference spec §7.5:
// 66%×66% centered cascade, drag, se-resize, Esc/outside-click close, per-src
// persisted rect, ≤50rem short-circuits to window.open. Pure helpers
// (clampRect/parseSavedRect) are exported and unit-tested; the element class is
// only defined when a DOM exists so this module imports safely under node.

import { getJSON, setJSON } from './persistent';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_W = 200;
const MIN_H = 150;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function clampRect(r: Rect, vw: number, vh: number): Rect {
  const w = clamp(Math.round(r.w), MIN_W, vw);
  const h = clamp(Math.round(r.h), MIN_H, vh);
  return {
    w,
    h,
    x: clamp(Math.round(r.x), 0, Math.max(0, vw - w)),
    y: clamp(Math.round(r.y), 0, Math.max(0, vh - h)),
  };
}

export function parseSavedRect(json: string, vw: number, vh: number): Rect | null {
  try {
    const v = JSON.parse(json) as Partial<Rect>;
    if (
      typeof v?.x !== 'number' ||
      typeof v?.y !== 'number' ||
      typeof v?.w !== 'number' ||
      typeof v?.h !== 'number' ||
      !isFinite(v.x) ||
      !isFinite(v.y) ||
      !isFinite(v.w) ||
      !isFinite(v.h)
    ) {
      return null;
    }
    return clampRect(v as Rect, vw, vh);
  } catch {
    return null;
  }
}

// Minimal structural view of the custom element for callers.
export interface PopupEl extends HTMLElement {
  close(): void;
  saveBounds(): void;
}

// MRU z-order stack: last element is top-most.
const stack: PopupEl[] = [];
const raise = (el: PopupEl) => {
  const i = stack.indexOf(el);
  if (i >= 0) stack.splice(i, 1);
  stack.push(el);
  stack.forEach((p, idx) => (p.style.zIndex = String(100 + idx)));
};
const unstack = (el: PopupEl) => {
  const i = stack.indexOf(el);
  if (i >= 0) stack.splice(i, 1);
};

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  class PopupWindow extends HTMLElement implements PopupEl {
    private onPointerMove = (e: PointerEvent) => this.dragMove(e);
    private onPointerUp = (e: PointerEvent) => this.endInteraction(e);
    private startX = 0;
    private startY = 0;
    private origX = 0;
    private origY = 0;
    private origW = 0;
    private origH = 0;
    private moved = 0;
    private mode: 'drag' | 'resize' | null = null;
    private prevFocus: Element | null = null;

    connectedCallback() {
      const src = this.getAttribute('src') ?? '';
      const type = this.getAttribute('type') ?? 'iframe';
      const title = this.getAttribute('popup-title') ?? titleFromSrc(src);

      this.setAttribute('role', 'dialog');

      const border = document.createElement('div');
      border.setAttribute('data-popup-border', '');
      const content = document.createElement('div');
      content.setAttribute('data-content', '');
      if (type === 'image') {
        const img = document.createElement('img');
        img.src = src;
        img.alt = title;
        img.style.imageRendering = 'pixelated';
        img.addEventListener('load', () => (img.style.imageRendering = 'auto'), { once: true });
        content.appendChild(img);
      } else {
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = title;
        iframe.setAttribute('allow', 'fullscreen');
        iframe.setAttribute('loading', 'lazy');
        content.appendChild(iframe);
      }
      border.appendChild(content);

      const titleId = `popup-title-${Math.random().toString(36).slice(2, 8)}`;
      const titleChip = document.createElement('button');
      titleChip.id = titleId;
      this.setAttribute('aria-labelledby', titleId);
      titleChip.setAttribute('data-popup-title', '');
      titleChip.textContent = title;
      titleChip.title = `Open ${title} in new tab`;

      const close = document.createElement('button');
      close.setAttribute('data-close', '');
      close.setAttribute('aria-label', 'Close');
      close.textContent = '×';

      const resize = document.createElement('div');
      resize.setAttribute('data-resize-handle', '');

      this.appendChild(border);
      this.appendChild(titleChip);
      this.appendChild(close);
      this.appendChild(resize);

      this.prevFocus = document.activeElement;
      raise(this as PopupEl);

      titleChip.addEventListener('click', () => {
        if (this.moved < 3) window.open(src, '_blank', 'noopener,noreferrer');
      });
      close.addEventListener('click', () => this.close());
      this.addEventListener('pointerdown', (e) => this.beginInteraction(e));

      close.focus();
    }

    private beginInteraction(e: PointerEvent) {
      raise(this as PopupEl);
      const target = e.target as HTMLElement;
      if (target.closest('[data-close]')) return;
      this.mode = target.closest('[data-resize-handle]') ? 'resize' : 'drag';
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.origX = this.offsetLeft;
      this.origY = this.offsetTop;
      this.origW = this.offsetWidth;
      this.origH = this.offsetHeight;
      this.moved = 0;
      this.setPointerCapture(e.pointerId);
      this.addEventListener('pointermove', this.onPointerMove);
      this.addEventListener('pointerup', this.onPointerUp);
      if (this.mode === 'drag') this.style.cursor = 'grabbing';
    }

    private dragMove(e: PointerEvent) {
      if (!this.mode) return;
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      this.moved = Math.max(this.moved, Math.abs(dx) + Math.abs(dy));
      if (this.mode === 'drag') {
        this.style.left = `${this.origX + dx}px`;
        this.style.top = `${this.origY + dy}px`;
      } else {
        this.style.width = `${Math.max(MIN_W, this.origW + dx)}px`;
        this.style.height = `${Math.max(MIN_H, this.origH + dy)}px`;
      }
    }

    private endInteraction(e: PointerEvent) {
      this.removeEventListener('pointermove', this.onPointerMove);
      this.removeEventListener('pointerup', this.onPointerUp);
      this.style.cursor = '';
      if (this.mode) this.saveBounds();
      this.mode = null;
      try {
        this.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }

    saveBounds() {
      const src = this.getAttribute('src');
      if (!src) return;
      setJSON(`popup-bounds:${src}`, {
        x: this.offsetLeft,
        y: this.offsetTop,
        w: this.offsetWidth,
        h: this.offsetHeight,
      });
    }

    close() {
      this.saveBounds();
      unstack(this as PopupEl);
      this.remove();
      if (this.prevFocus instanceof HTMLElement) this.prevFocus.focus();
    }
  }

  if (!customElements.get('popup-window')) {
    customElements.define('popup-window', PopupWindow);
  }
}

export function titleFromSrc(src: string): string {
  try {
    const u = new URL(src, typeof location !== 'undefined' ? location.href : 'http://local/');
    const seg = u.pathname.split('/').filter(Boolean).pop();
    return seg && seg !== '' ? seg : u.hostname;
  } catch {
    return src;
  }
}

export function openPopup(src: string, type: 'iframe' | 'image' = 'iframe', title?: string): void {
  // External sites ship frame-ancestors 'none' (github, linkedin) — an
  // iframe popup of them renders blank. Cross-origin src routes to a real
  // tab at EVERY width (the mobile divert existed; now it's the rule for
  // anything off-origin), per the mobile QA sweep's finding.
  try {
    const abs = new URL(src, window.location.href);
    if (abs.origin !== window.location.origin) {
      window.open(src, '_blank', 'noopener,noreferrer');
      return;
    }
  } catch {
    window.open(src, '_blank', 'noopener,noreferrer');
    return;
  }
  if (window.matchMedia('(width<=50rem)').matches) {
    window.open(src, '_blank', 'noopener,noreferrer');
    return;
  }
  const existing = stack.find((p) => p.getAttribute('src') === src);
  if (existing) {
    if (stack[stack.length - 1] === existing) existing.close();
    else raise(existing);
    return;
  }

  const el = document.createElement('popup-window') as PopupEl;
  el.setAttribute('src', src);
  el.setAttribute('type', type);
  if (title) el.setAttribute('popup-title', title);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const saved = parseSavedRect(localStorage.getItem(`am-popup-bounds:${src}`) ?? '', vw, vh);
  const rect =
    saved ??
    clampRect(
      {
        w: vw * 0.66,
        h: vh * 0.66,
        x: vw * 0.17 + stack.length * 40,
        y: vh * 0.17 + stack.length * 40,
      },
      vw,
      vh,
    );
  Object.assign(el.style, {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.w}px`,
    height: `${rect.h}px`,
  });

  (document.querySelector('main') ?? document.body).appendChild(el);
}

export function attachPopupInterceptor(doc: Document = document): void {
  doc.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest?.('[data-popup-src]') as HTMLElement | null;
    if (!link) return;
    e.preventDefault();
    openPopup(
      link.dataset.popupSrc!,
      (link.dataset.popupType as 'iframe' | 'image') || 'iframe',
      link.dataset.popupTitle || undefined,
    );
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length) stack[stack.length - 1].close();
  });
  doc.addEventListener('pointerdown', (e) => {
    if (!stack.length) return;
    if (!(e.target as HTMLElement).closest?.('popup-window')) stack[stack.length - 1].close();
  });
}
