import { test, expect } from '@playwright/test';

// Real phone context (touch + mobile UA, not a resized desktop window):
// the reported bug is "Menu does not open on tap". A real tap dispatches
// a click, so if a plain tap fails to open the drawer the bug is real.
// Also covers the drawer's own links: the overlay must sit UNDER the
// drawer's nav (z 140 sibling < z 150 fixed sidebar), or taps on links
// land on the overlay and the drawer only closes (never navigates).
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
});

test.describe('mobile nav (touch context)', () => {
  test('tap on Menu opens the off-canvas drawer', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('.menu-button');
    await expect(menu).toBeVisible();
    await expect(page.locator('site-sidebar')).not.toHaveAttribute('open', '');

    await menu.tap();
    await expect(page.locator('site-sidebar')).toHaveAttribute('open', '');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
  });

  test('tap a link inside the drawer navigates and the overlay goes away', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('.menu-button').tap();
    await expect(page.locator('site-sidebar')).toHaveAttribute('open', '');

    // about.me -> /about/ (README is current and stays on '/')
    await page.locator('.sidebar a[href="/about/"]').tap();
    await expect(page.locator('site-sidebar')).not.toHaveAttribute('open', '');
    await expect(page).toHaveURL(/\/about\/$/);
  });
});