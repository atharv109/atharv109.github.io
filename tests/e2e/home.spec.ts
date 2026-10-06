import { test, expect } from '@playwright/test';

// Task 8: home ASCII layer (ref §7.2 intro choreography + §8.3 rain-hatch
// monogram). The rain overlay renders behind the hero heading; the intro
// choreography ends with intro-pending removed (~3s); reduced motion keeps
// everything visible immediately with rain only.

test.describe('home intro', () => {
  test('rain overlay runs behind the heading and intro-pending clears', async ({ page }) => {
    await page.goto('/');
    const overlay = page.locator('.ascii-container .ascii-overlay');
    await expect(overlay).toBeVisible();

    // rain falls from frame 1 (density 0.2/col)
    await page.waitForFunction(
      () => (document.querySelector('.ascii-container .ascii-overlay')?.textContent ?? '').includes('|'),
      null,
      { timeout: 3000 },
    );

    // the h1 stays real text in the a11y tree
    await expect(page.locator('.content-lines h1')).toHaveText('ATHARV MITTAL');

    // full choreography (heading reveal → CTA wave → cascade) ends
    await page.waitForFunction(
      () => !document.documentElement.classList.contains('intro-pending'),
      null,
      { timeout: 9000 },
    );
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.content-lines')).toContainText('Explore');
  });

  test('reduced motion: no pending classes, everything visible at once, rain only', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/intro-pending|wave-pending/);
    await expect(page.locator('.content-lines h1')).toHaveText('ATHARV MITTAL');
    // DOM heading NOT hijacked by the ASCII layer
    const color = await page
      .locator('.content-lines h1')
      .evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
    // content visible immediately (no wave hold)
    const op = await page
      .locator('.content-lines')
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(op).toBe('1');
    // rain still runs without introReveal
    await page.waitForFunction(
      () => (document.querySelector('.ascii-container .ascii-overlay')?.textContent ?? '').includes('|'),
      null,
      { timeout: 3000 },
    );
    await context.close();
  });

  test('AM glyph ships: U+100000 maps in the loaded font at the Term advance', async ({ page }) => {
    await page.goto('/');
    const m = await page.evaluate(async () => {
      await document.fonts.ready;
      const c = document.createElement('canvas');
      c.width = c.height = 120;
      const g = c.getContext('2d');
      g.font = '100px "Iosevka Term NF", monospace';
      g.textBaseline = 'alphabetic';
      const inkOf = (s: string) => {
        g.clearRect(0, 0, 120, 120);
        g.fillText(s, 5, 100);
        const d = g.getImageData(0, 0, 120, 120).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 64) n++;
        return n;
      };
      return {
        amAdv: g.measureText(String.fromCodePoint(0x100000)).width,
        amInk: inkOf(String.fromCodePoint(0x100000)),
        tofuInk: inkOf(String.fromCodePoint(0x10ffff)), // headless draws unmapped as nothing
        iconAdv: g.measureText('\u{E5FF}').width, // NF icon present in the same font
      };
    });
    expect(m.iconAdv).toBe(50); // Term advance = 0.5em
    expect(m.amAdv).toBe(m.iconAdv); // the AM glyph maps at the same advance
    expect(m.amInk).toBeGreaterThan(1000); // and is a real outlined mark
    expect(m.tofuInk).toBe(0);
  });
});