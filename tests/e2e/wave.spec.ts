import { test, expect } from '@playwright/test';

// Task 6: arrival glitch text wave (ref §7.3). In-viewport blocks split into
// per-char spans, type in along the diagonal with `= ~ - ~ =` slots, then
// normalize() restores the original DOM. wave-pending MUST clear in every case
// (T3 contract) — reduced-motion clears immediately and never splits.

test.describe('text wave', () => {
  test('arrival wave splits, plays staggered, then restores the original text', async ({ page }) => {
    await page.goto('/');
    await page.locator('.content-lines h1 .wv-char').first().waitFor({ state: 'attached', timeout: 2000 });
    // chars are revealed one diagonal at a time — some are still pending
    const pendingBefore = await page.evaluate(() =>
      [...document.querySelectorAll('.content-lines .wv-char')].some(
        (c) => getComputedStyle(c).opacity === '0',
      ),
    );
    expect(pendingBefore).toBe(true);
    // wave ends: wave-pending cleared AND every split span gone
    await page.waitForFunction(
      () => !document.documentElement.classList.contains('wave-pending') && !document.querySelector('.wv-char'),
      null,
      { timeout: 5000 },
    );
    expect(await page.locator('.content-lines h1').textContent()).toBe('ATHARV MITTAL');
  });

  test('wave-pending is removed even when the wave script throws', async ({ page }) => {
    // Fault injection: the splitter's replaceChild(frag, textNode) blows up.
    // The boot script's finally must still clear wave-pending so the buffer
    // renders (pages would otherwise stay blank forever).
    await page.addInitScript(() => {
      const original = Element.prototype.replaceChild;
      const interceptor = function (this: Element, node: Node, old: Node): Node {
        if (node.nodeType === 11 && old.nodeType === 3) throw new Error('injected: replaceChild');
        return original.call(this, node, old);
      } as unknown as typeof Element.prototype.replaceChild;
      Element.prototype.replaceChild = interceptor;
    });
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/wave-pending/);
    await expect(page.locator('.content-lines h1')).toHaveText('ATHARV MITTAL');
  });

  test('reduced motion: no split at all, no wave-pending', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/about/');
    await expect(page.locator('html')).not.toHaveClass(/wave-pending/);
    await expect(page.locator('.content-lines .wv-char')).toHaveCount(0);
    await expect(page.locator('.content-lines h1')).toHaveText('About');
    await context.close();
  });

  test('hover wave glitches the chip label and restores it', async ({ page }) => {
    await page.goto('/contact/');
    const button = page.locator('.content-lines a.button', { hasText: 'GitHub' }).first();
    await button.hover();
    await page.locator('.wv-char').first().waitFor({ state: 'attached', timeout: 2000 });
    await page.waitForFunction(() => !document.querySelector('.content-lines .wv-char'), null, {
      timeout: 5000,
    });
    expect(await page.locator('.content-lines a.button', { hasText: 'GitHub' }).first().textContent()).toContain(
      'GitHub',
    );
  });
});