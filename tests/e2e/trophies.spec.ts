import { test, expect } from '@playwright/test';

// Task 9 Step 6 (+ addenda): explorer unlocks at the 5th distinct route —
// toast appears after the arrival wave clears, count reads 2/7 and survives
// reload; reduced motion never starts the moth (ref §10 / §14).

const FIVE_ROUTES = ['/', '/about/', '/contact/', '/resume/', '/archive/'];

test.describe('trophies', () => {
  test('drawer mounts with data-ready and the count reflects only real unlocks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('trophy-drawer[data-ready]')).toBeVisible();
    await expect(page.locator('.trophy-toggle')).toHaveText(/Trophies \[1\/7\]/);
    await expect(page.locator('.trophy-toggle')).toHaveAttribute('aria-label', 'Trophies, 1 of 7');
  });

  test('explorer unlocks at 5 routes: toast, 2/7, state survives reload', async ({ page }) => {
    for (const route of FIVE_ROUTES.slice(0, 4)) await page.goto(route);
    await page.goto(FIVE_ROUTES[4]);

    // Toast: PATHFINDER, shown once wave-pending has cleared (≤4 s cap).
    const toast = page.locator('.trophy-toast', { hasText: 'PATHFINDER' });
    await expect(toast).toBeVisible({ timeout: 8000 });

    // Count includes first-visit + explorer.
    await expect(page.locator('.trophy-toggle')).toHaveText(/Trophies \[2\/7\]/);
    await expect(toast.locator('.trophy-name')).toHaveText('PATHFINDER');
    // Toast is inert and self-removes after its 5 s ttl.
    await expect(toast).toHaveAttribute('inert', '');
    await expect(toast).toBeHidden({ timeout: 8000 });

    // Reload: unlocked state persists, no new explorer toast.
    await page.reload();
    await expect(page.locator('trophy-drawer[data-ready]')).toBeVisible();
    await expect(page.locator('.trophy-toggle')).toHaveText(/Trophies \[2\/7\]/);
    await page.locator('.trophy-toggle').click();
    const explorerCard = page.locator('.trophy-card[data-id="explorer"]');
    await expect(explorerCard.locator('.trophy-name')).toHaveText('PATHFINDER');
    await expect(page.locator('.trophy-toast')).toHaveCount(0);
  });

  test('drawer open state persists across reload', async ({ page }) => {
    await page.goto('/about/');
    await page.locator('.trophy-toggle').click();
    await expect(page.locator('.trophy-panel')).toBeVisible();
    await page.reload();
    await expect(page.locator('trophy-drawer[data-ready]')).toBeVisible();
    await expect(page.locator('.trophy-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.trophy-panel')).toBeVisible();
  });

  test('free-the-moth releases the moth to the host', async ({ page }) => {
    // Seed the six non-rare trophies; the load-time checkRare() fires the rare one.
    await page.addInitScript(() => {
      for (const id of ['first-visit', 'explorer', 'gander', 'secret', 'complete-the-mark', 'reach-out']) {
        localStorage.setItem('am-trophy:' + id, '1');
      }
    });
    await page.goto('/about/');
    await expect(page.locator('.moth-host .moth')).toHaveCount(1, { timeout: 8000 });
    await expect(page.locator('.moth-host .moth')).toHaveClass(/is-free/);
    await expect(page.locator('.trophy-toggle')).toHaveText(/Trophies \[7\/7\]/);
    const toast = page.locator('.trophy-toast', { hasText: 'NIGHT SHIFT' });
    await expect(toast).toBeVisible({ timeout: 8000 });
  });

  test('reduced motion: no moth-host, no toasts waiting forever, drawer still works', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('trophy-drawer[data-ready]')).toBeVisible();
    await expect(page.locator('.moth-host')).toHaveCount(0);
    await expect(page.locator('.trophy-toggle')).toHaveText(/Trophies \[1\/7\]/);
    // Caged sprite stays static in the drawer.
    await page.locator('.trophy-toggle').click();
    await expect(page.locator('.trophy-cage .moth')).toBeAttached();
    await context.close();
  });
});
