import { test, expect } from '@playwright/test';

test.describe('editor shell', () => {
  test('renders sidebar and main on /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('nav-tree')).toBeVisible();
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('gutter numbers exist and are right-aligned', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('.line-numbers > div').first();
    await expect(first).toHaveText('1');
    const align = await first.evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe('right');
  });

  test('two-tone background: sidebar base vs buffer surface0', async ({ page }) => {
    await page.goto('/');
    const sidebarBg = await page
      .locator('.sidebar')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const mainBg = await page
      .locator('main#main-content')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(sidebarBg).toBe('rgb(28, 34, 37)'); // #1c2225
    expect(mainBg).toBe('rgb(35, 42, 46)'); // #232a2e
  });

  test('sidebar stays sticky while the buffer scrolls', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 300));
    const top = await page
      .locator('.sidebar')
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThanOrEqual(2);
  });

  test('mobile: Menu button toggles the off-canvas sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menu = page.locator('.menu-button');
    await expect(menu).toBeVisible();
    await expect(page.locator('site-sidebar')).not.toHaveAttribute('open', '');

    await menu.click();
    await expect(page.locator('site-sidebar')).toHaveAttribute('open', '');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');

    // overlay tap closes the drawer
    await page.locator('[data-sidebar-overlay]').click();
    await expect(page.locator('site-sidebar')).not.toHaveAttribute('open', '');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  test('keyboard j/k move tree focus (vim keys)', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('.sidebar [role="treeitem"]');
    await items.first().focus();
    await page.keyboard.press('j');
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press('k');
    await expect(items.first()).toBeFocused();
  });

  test('current nav item has aria-current and the green block', async ({ page }) => {
    await page.goto('/');
    const current = page.locator('.nav-item.is-current');
    await expect(current).toHaveAttribute('aria-current', 'page');
    const bg = await current.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(203, 227, 179)'); // --color-green #cbe3b3
  });

  test('saved folder open state is applied synchronously at first paint', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'am-nav-open',
        JSON.stringify({ projects: 'true', archive: 'false' }),
      );
    });
    await page.goto('/');
    // Restored by the inline boot script during parsing (custom-element
    // upgrade), so the attributes are already correct in the received DOM.
    const projects = page.locator('tree-folder[label="projects"]');
    await expect(projects).toHaveAttribute('open', '');
    await expect(projects.locator('button[data-summary]')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const archive = page.locator('tree-folder[label="archive"]');
    await expect(archive).not.toHaveAttribute('open', '');
    await expect(archive.locator('button[data-summary]')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
