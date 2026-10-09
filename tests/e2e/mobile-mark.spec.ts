import { test, expect, type Page } from '@playwright/test';

// Bug report (mobile): "it glitches when I fill in the monogram" — while the
// rain hatches the AM monogram and it completes (bloom + 'complete-the-mark'
// trophy), mid-animation browser chrome show/hide resizes the viewport HEIGHT
// only (390x844 ↔ 390x~740). The renderer's ResizeObserver rebuilt the whole
// grid on any size change: the mark's mask re-rasterised and the hatch
// progress wiped (completed mark re-anchored / re-hatched mid-celebration).
// Desktop windows never change height under the user's fingers — mobile only.
// Fix contract: a height-only (width-unchanged) RO fire must NOT rebuild the
// grid; a real width change (orientation) still must.

const MARK_TROPHY = 'complete-the-mark';

interface Mobile {
  viewport: { width: number; height: number };
  isMobile: boolean;
  hasTouch: boolean;
  deviceScaleFactor: number;
}

const touchContext = async (
  browser: import('@playwright/test').Browser,
  size: { width: number; height: number },
): Promise<{ page: Page; errors: string[]; close: () => Promise<void> }> => {
  const context = await browser.newContext({
    viewport: size,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  } as Mobile);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  // Fresh trophy state so the mark completion actually fires the unlock.
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    (window as unknown as Record<string, unknown>).__markDoneAt = null;
    document.addEventListener('trophy:unlocked', (e) => {
      if ((e as CustomEvent<{ id: string }>).detail?.id === 'complete-the-mark')
        (window as unknown as Record<string, unknown>).__markDoneAt = performance.now();
    });
  });
  return { page, errors, close: () => context.close() };
};

/** Rebuild count until it stops changing (the start-up font re-measures). */
async function settledRebuilds(page: Page): Promise<number> {
  const read = () =>
    page.evaluate(
      () => Number(document.querySelector('.ascii-overlay')?.getAttribute('data-rebuilds') ?? '0'),
    );
  let prev = await read();
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(200);
    const next = await read();
    if (next === prev) return next;
    prev = next;
  }
  return prev;
}

/** One desktop-equivalent chrome show/hide cycle: height-only viewport change. */
async function chromeToggle(page: Page, shorter: boolean): Promise<void> {
  await page.setViewportSize({ width: 390, height: shorter ? 736 : 844 });
  await page.waitForTimeout(120);
}

test.describe('mobile mark completion (touch, DPR 3)', () => {
  test('portrait: height-only browser-chrome resize does not rebuild/erase the mark mid-hatch', async ({
    browser,
  }) => {
    const { page, errors, close } = await touchContext(browser, { width: 390, height: 844 });
    await page.goto('/');
    const overlay = page.locator('.ascii-container .ascii-overlay');
    await expect(overlay).toBeVisible();

    // Start-up font re-measures settle; this is the pre-interaction baseline.
    const baseline = await settledRebuilds(page);
    expect(baseline).toBeGreaterThan(0);

    // The user is filling in the monogram while the browser chrome toggles
    // (mobile scroll jitter): several height-only resize cycles right away.
    for (let i = 0; i < 3; i++) await chromeToggle(page, i % 2 === 0);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() =>
      Number(document.querySelector('.ascii-overlay')?.getAttribute('data-rebuilds') ?? '0'),
    )).toBe(baseline); // height-only changes must not rebuild the grid

    // Keep the chrome toggling until the mark completes (trophy unlock fires).
    let shorter = true;
    await expect(async () => {
      const done = await page.evaluate(
        () => (window as unknown as Record<string, unknown>).__markDoneAt != null,
      );
      if (done) return;
      await page.setViewportSize({ width: 390, height: shorter ? 736 : 844 });
      shorter = !shorter;
      await page.waitForTimeout(150);
      throw new Error('mark not complete yet');
    }).toPass({ timeout: 45_000 });
    expect(
      await page.evaluate(() => (window as unknown as Record<string, unknown>).__markDoneAt),
    ).not.toBe(null);

    // Completion state holds: the trophy unlocked, the mark stays complete and
    // the grid was never rebuilt through the celebration.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    expect(
      await page.evaluate(() =>
        Number(document.querySelector('.ascii-overlay')?.getAttribute('data-rebuilds') ?? '0'),
      ),
    ).toBe(baseline);
    await expect(page.locator('.trophy-card[data-id="complete-the-mark"][data-unlocked]'))
      .toBeAttached();

    // Visual stability ±0 across 2 frames after completion: row count and
    // overlay geometry unchanged, and no unhandled JS errors anywhere.
    const snap = () =>
      page.evaluate(() => {
        const o = document.querySelector('.ascii-overlay') as HTMLElement;
        const r = o.getBoundingClientRect();
        return { rows: o.querySelectorAll('.ascii-row').length, x: r.x, y: r.y, w: r.width, h: r.height };
      });
    const a = await snap();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const b = await snap();
    expect(b).toEqual(a);
    expect(errors).toEqual([]);
    await close();
  });

  test('landscape: mark completes cleanly at DPR 3 and survives a width re-anchor', async ({
    browser,
  }) => {
    const { page, errors, close } = await touchContext(browser, { width: 844, height: 390 });
    await page.goto('/');
    const overlay = page.locator('.ascii-container .ascii-overlay');
    await expect(overlay).toBeVisible();
    const baseline = await settledRebuilds(page);

    // No chrome jitter: the monogram simply completes, no errors, no rebuilds.
    await page.waitForFunction(
      () => (window as unknown as Record<string, unknown>).__markDoneAt != null,
      null,
      { timeout: 45_000 },
    );
    await page.waitForTimeout(400);
    expect(
      await page.evaluate(() =>
        Number(document.querySelector('.ascii-overlay')?.getAttribute('data-rebuilds') ?? '0'),
      ),
    ).toBe(baseline);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500); // width changed: a rebuild is allowed...

    // ...and the completed mark survives it (post-completion pre-fill keeps
    // the bloom steady) rather than blanking to rain-only.
    const faces = await page.evaluate(() => {
      const o = document.querySelector('.ascii-overlay') as HTMLElement | null;
      const text = o?.textContent ?? '';
      return text.split('').filter((c) => c === '|' || c === '/' || c === '\\').length;
    });
    expect(faces).toBeGreaterThan(0);
    expect(errors).toEqual([]);
    await close();
  });
});