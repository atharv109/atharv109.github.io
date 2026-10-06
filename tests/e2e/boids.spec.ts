import { test, expect } from '@playwright/test';

// Task 10: contact moth flock + lamp glow (ref §11). The renderer mounts into
// .ascii-container 950 ms after the arrival wave finishes; reduced motion
// never starts it.

test.describe('contact moth flock', () => {
  test('renderer mounts and the `/` glow field paints after the wave settles', async ({
    page,
  }) => {
    await page.goto('/contact/');
    await page.waitForSelector('.ascii-overlay', { timeout: 10_000 });
    // Lamp glow field: the overlay is hatched with `/` glyphs.
    await expect(page.locator('.ascii-overlay').first()).toContainText('/');
    // Label chars pre-wrapped server-side for the trail scramble.
    await expect(page.locator('.boid-char')).toHaveCount(21);
  });

  test('reduced motion: the renderer never starts', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/contact/');
    await expect(page.locator('.ascii-overlay')).toHaveCount(0);
    await context.close();
  });
});