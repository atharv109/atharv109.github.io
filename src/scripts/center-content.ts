// center-content.ts — hero pages only: insert whole blank-line paragraphs so
// content is vertically centred ON the line grid (ref §3). Recomputed on resize
// and after fonts load.
export function centerContent(contentEl: HTMLElement, markerId = 'center-spacers'): void {
  const marker = contentEl.querySelector<HTMLElement>(`#${markerId}`);
  if (!marker) return;
  contentEl.querySelectorAll('.center-spacer').forEach((n) => n.remove());
  const lineH = parseFloat(getComputedStyle(contentEl).lineHeight) || 19;
  const top = marker.getBoundingClientRect().top + window.scrollY;
  const contentHeight = contentEl.scrollHeight;
  const lines = Math.floor(Math.max(0, window.innerHeight - top + window.scrollY - contentHeight) / 2 / lineH);
  for (let i = 0; i < lines; i++) {
    const p = document.createElement('p');
    p.className = 'center-spacer';
    p.setAttribute('aria-hidden', 'true');
    p.innerHTML = '&nbsp;';
    marker.after(p);
  }
}

export function attachCentering(contentEl: HTMLElement): void {
  const run = () => centerContent(contentEl);
  run();
  document.fonts?.ready?.then(run);
  window.addEventListener('resize', run);
}
