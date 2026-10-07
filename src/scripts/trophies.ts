// trophies.ts — plan Task 9 / ref §9 adapted to the AM trophy set (original
// names/copy). State: 'am-trophy:<id>' = '1' via persistent.ts (never-throw
// getStr; store-backed, so a "reload" is just a fresh read). unlock() returns
// false when already unlocked, else stores and dispatches the document event
// 'trophy:unlocked' {detail:{id}}. The rare trophy auto-unlocks when all six
// others are set — checked on every unlock and at load (checkRare). The
// trigger listeners are document-level and delegated (ref §9), wired by
// initTrophyTriggers() from trophy-drawer.
//
// Trigger wiring by id:
//   first-visit        unlock on init (any page load)
//   explorer           am-trophy-visits ≥ 5 distinct pathnames (recordVisit)
//   director           click a story chip (project-page story players) —
//                      the old trigger (project embed click) was unobtainable
//                      capture-phase (the catcher's own click handler calls
//                      stopPropagation, which cannot reach back to capture)
//   secret             document 'trophy:secret' {detail:{id}} (T11 contract,
//                      site-terminal.ts dispatches on the machine's trophy tag)
//   complete-the-mark  home logo completion — Task 8 calls unlock() itself
//   reach-out          pointerover on the contact CTA (a[data-boid-anchor]) or
//                      any click on a mailto: link

import { getJSON, setJSON, getStr, setStr } from './persistent';

export interface TrophyDef {
  id: string;
  title: string;
  /** Locked display label — ?-mask of the unlocked title. */
  locked: string;
  desc: string;
  color: string;
  icon: string;
  rare?: boolean;
}

const def = (
  id: string,
  title: string,
  desc: string,
  color: string,
  icon: string,
  rare?: boolean,
): TrophyDef => ({ id, title, locked: '?'.repeat(title.length), desc, color, icon, rare });

export const TROPHIES: TrophyDef[] = [
  def('first-visit', 'WELCOME IN', 'Visit the buffer', 'yellow', '\u{EFB7}'),
  def('explorer', 'PATHFINDER', 'Open 5+ pages', 'orange', '\u{F0DFA}'),
  def('director', 'DIRECTOR', 'Scrub a beat in any story', 'red', '\u{F0CFD}'),
  def('secret', 'BREACH', "Find the terminal's secret", 'purple', '\u{EEF7}'),
  def('complete-the-mark', 'CLOSER', 'Complete the monogram', 'pink', '\u{100000}'),
  def('reach-out', 'SIGNAL', 'Reach out!', 'green', '\u{F1020}'),
  def('free-the-moth', 'NIGHT SHIFT', '', 'text', '\u{E28E}', true),
];

const byId = new Map(TROPHIES.map((t) => [t.id, t]));
/** The six non-rare trophies — the rare one fires when all of these fall. */
const OTHERS = TROPHIES.filter((t) => !t.rare).map((t) => t.id);

const dispatchEvent = (id: string): void => {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('trophy:unlocked', { detail: { id } }));
  }
};

export function isUnlocked(id: string): boolean {
  return getStr(`trophy:${id}`, '') === '1';
}

export function unlockedCount(): number {
  return TROPHIES.reduce((n, t) => n + (isUnlocked(t.id) ? 1 : 0), 0);
}

/** Unlock id, if it exists and is not yet unlocked. */
export function unlock(id: string): boolean {
  if (!byId.has(id) || isUnlocked(id)) return false;
  setStr(`trophy:${id}`, '1');
  dispatchEvent(id);
  if (id !== 'free-the-moth') checkRare();
  return true;
}

/** Rare trophy check, from restorable state — safe to call at any time. */
export function checkRare(): void {
  if (OTHERS.every(isUnlocked)) unlock('free-the-moth');
}

/** Record a distinct pathname visit (trailing slash stripped) and unlock
    explorer at ≥5. A corrupt am-trophy-visits self-heals to []. */
export function recordVisit(pathname: string): void {
  const p = pathname.replace(/\/+$/, '') || '/';
  const raw = getJSON<unknown>('trophy-visits', []);
  const list = Array.isArray(raw) && raw.every((v) => typeof v === 'string')
    ? (raw as string[])
    : [];
  if (!list.includes(p)) list.push(p);
  setJSON('trophy-visits', list);
  if (list.length >= 5) unlock('explorer');
}

let initialized = false;

/** Wire the page-load unlocks + delegated trigger listeners (ref §9:
    document-level delegated pointerover/click). Idempotent. */
export function initTrophyTriggers(): void {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;

  unlock('first-visit');
  recordVisit(location.pathname);

  document.addEventListener('trophy:secret', () => unlock('secret'));

  // Capture phase: page-level trigger delegation (immune to any bubbling
  // handler that stops propagation, e.g. the story chip's own handlers).
  document.addEventListener(
    'click',
    (e) => {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      // DIRECTOR: direct the story — any click on a story chip (exists only
      // inside project-page story players). The old trigger (project embed
      // click) was unobtainable: FeatureBlock mounts no embeds anywhere.
      if (t.closest('story-block .story-chip')) unlock('director');
      if (t.closest('a[href^="mailto:"]')) unlock('reach-out');
    },
    true,
  );

  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element | null;
    if (t?.closest?.('a[data-boid-anchor]')) unlock('reach-out');
  });

  checkRare();
}