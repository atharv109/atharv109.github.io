// site-settings.ts — the reduced control panel (plan decision 6, ref §4.4
// summary): top-right absolute panel, 10px/1.1 surface0, summary row = title +
// [+]/[-] + right-floated tabular-nums `NN FPS` (plus `NN MB` when
// performance.memory exists, aria-hidden). Controllers are 50/50 label|control
// rows with selects only — Theme (Dark|Light, applies instantly + persists to
// am-theme) and Font Size (12/13/14/16/18/20 → html inline style + am-font-size,
// clamped 12..20 like the boot script). Draggable by its title (>3 px move
// suppresses the toggle click). Destroyed at innerWidth ≤ 700 and not mounted
// when html[data-embedded] — markup ships hidden in SiteSettings.astro, the
// script un-hides it only here.
import { getStr, setStr } from './persistent';

const FONT_SIZES = ['12', '13', '14', '16', '18', '20'];
const DEFAULT_FONT = '14';

function applyTheme(theme: string): void {
  const html = document.documentElement;
  if (theme === 'Light') html.dataset.theme = 'light';
  else delete html.dataset.theme;
  setStr('theme', theme === 'Light' ? 'Light' : 'Dark');
}

function clampFont(raw: string): string | null {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return null;
  return String(Math.min(20, Math.max(12, n)));
}

let armed = false;

export function initSiteSettings(): void {
  if (typeof document === 'undefined' || armed) return;
  const el = document.querySelector<HTMLElement>('site-settings');
  if (!el) return;
  const html = document.documentElement;
  if (html.hasAttribute('data-embedded') || window.innerWidth <= 700) return;
  armed = true;
  el.hidden = false;
  const root = el.querySelector<HTMLElement>('.cp-root');
  const title = el.querySelector<HTMLButtonElement>('.cp-title');
  const stats = el.querySelector<HTMLElement>('.cp-stats');
  const controllers = el.querySelector<HTMLElement>('.cp-controllers');
  const themeSel = el.querySelector<HTMLSelectElement>('#cp-theme');
  const fontSel = el.querySelector<HTMLSelectElement>('#cp-font-size');
  if (!root || !title || !stats || !controllers || !themeSel || !fontSel) return;

  // Restore current values (the boot script already applied them pre-paint).
  themeSel.value = getStr('theme', 'Dark') === 'Light' ? 'Light' : 'Dark';
  const savedFont = clampFont(getStr('font-size', ''));
  fontSel.value = savedFont && FONT_SIZES.includes(savedFont) ? savedFont : DEFAULT_FONT;

  themeSel.addEventListener('change', () => applyTheme(themeSel.value));
  fontSel.addEventListener('change', () => {
    const f = clampFont(fontSel.value);
    if (f) {
      html.style.fontSize = f + 'px';
      setStr('font-size', f);
    }
  });

  // Summary toggles the controllers; drag by the title beyond 3 px moves the
  // panel and suppresses that toggle.
  let suppressClick = false;
  title.addEventListener('click', () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const open = title.getAttribute('aria-expanded') === 'true';
    title.setAttribute('aria-expanded', String(!open));
    controllers.hidden = open;
  });
  title.addEventListener('pointerdown', (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const r = root.getBoundingClientRect();
    let moved = false;
    const move = (ev: PointerEvent): void => {
      if (!moved && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 3) return;
      moved = true;
      root.style.right = 'auto';
      root.style.left = r.left + ev.clientX - startX + 'px';
      root.style.top = r.top + ev.clientY - startY + 'px';
    };
    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      suppressClick = moved;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });

  // NN FPS (and NN MB when performance.memory exists), 2×/s. Decorative.
  const mem = (): string => {
    const m = (performance as Performance & { memory?: { usedJSHeapSize: number } })
      .memory;
    return m ? ' / ' + Math.round(m.usedJSHeapSize / 1048576) + ' MB' : '';
  };
  let raf = 0;
  let frames = 0;
  let last = performance.now();
  const tick = (now: number): void => {
    frames++;
    if (now - last >= 500) {
      stats.textContent = Math.round((frames * 1000) / (now - last)) + ' FPS' + mem();
      frames = 0;
      last = now;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // Destroyed ≤700px (ref §4.4: mobile never gets the panel). One-way.
  const destroy = (): void => {
    el.hidden = true;
  };
  const onResize = (): void => {
    if (window.innerWidth <= 700) {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      destroy();
    }
  };
  window.addEventListener('resize', onResize);
}