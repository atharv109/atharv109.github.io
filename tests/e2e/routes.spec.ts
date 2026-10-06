import { test, expect } from '@playwright/test';

// Task 5: every route serves 200 with a content buffer; case-study next-button
// cycles; the popup interceptor opens contact's external chips; reduced-motion
// pages load with content immediately visible.
const PROJECTS = ['vulnswarm-vex', 'adversary-lab', 'prompt-optimiser', 'eleventh-round', 'crypton', 'acctomatic'];
const ARCHIVE = [
  'tinyvulnscanner',
  'eduai',
  'protopaper',
  'billshield',
  'ai-outfit',
  'blinks',
  'buildora-agent-pipeline',
  'android-app',
];
const ROUTES = [
  '/',
  '/about/',
  '/contact/',
  '/resume/',
  '/shell/',
  '/projects/',
  '/archive/',
  ...PROJECTS.map((s) => `/projects/${s}/`),
  ...ARCHIVE.map((s) => `/archive/${s}/`),
];

test.describe('routes', () => {
  for (const route of ROUTES) {
    test(`${route} → 200 with a content buffer`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator('.content-lines')).toBeVisible();
      if (route !== '/shell/') await expect(page.locator('h1')).toHaveCount(1); // terminal page owns its own chrome
    });
  }

  test('404 document serves the lost-in-the-buffer hero', async ({ page }) => {
    const res = await page.goto('/404.html');
    expect(res?.status()).toBe(200);
    await expect(page.locator('.content-lines h1')).toContainText('lost in the buffer');
    await expect(page.locator('a.button[href="/"]')).toContainText('Return to the meadow');
  });

  test('case-study next-project button cycles by order', async ({ page }) => {
    await page.goto('/projects/vulnswarm-vex/');
    await page.locator('a.button', { hasText: 'Next project →' }).click();
    await page.waitForURL('/projects/adversary-lab/');
    await page.locator('a.button', { hasText: 'Next project →' }).click();
    await page.waitForURL('/projects/prompt-optimiser/');
    await expect(page.locator('.content-lines h1')).toHaveText('Prompt Optimiser');
  });

  test('projects index lines are chips followed by their tagline', async ({ page }) => {
    await page.goto('/projects/');
    const line = page.locator('.content-lines p', { hasText: ' : ' }).first();
    await expect(line.locator('a.button', { hasText: 'VulnSwarm-VEX' })).toBeVisible();
    await expect(line).toContainText('Most vulnerability alerts are noise');
  });

  test('archive index renders title-only lines', async ({ page }) => {
    await page.goto('/archive/');
    await expect(page.locator('a.button', { hasText: 'BillShield' })).toBeVisible();
    await expect(page.locator('.content-lines').first()).toContainText('archive-index');
  });

  test('popup interceptor opens contact external chips in a popup window', async ({ page }) => {
    await page.goto('/contact/');
    const popupButton = page.locator('.content-lines a.button[data-popup-src]').first();
    await expect(popupButton).toBeVisible();
    await popupButton.click();
    await expect(page.locator('popup-window')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('popup-window')).toHaveCount(0);
  });

  test('contact CTA is horizontally centred over the buffer', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 }); // desktop, gutter visible
    await page.goto('/contact/');
    const centered = await page.evaluate(() => {
      const btn = document.querySelector('a.button[data-boid-anchor]');
      const pane = document.querySelector('.content-lines');
      const b = btn.getBoundingClientRect();
      const p = pane.getBoundingClientRect();
      return Math.abs(b.x + b.width / 2 - (p.x + p.width / 2));
    });
    expect(centered).toBeLessThanOrEqual(3); // inline-format centring tolerance
  });

  test('reduced motion: content visible immediately, no wave-pending hang', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText(/ATHARV/); // visible, not hidden behind wave-pending
    await expect(page.locator('html')).not.toHaveClass(/wave-pending/);
    await context.close();
  });
});