import { test, expect } from '@playwright/test';

// Task 12 Step 3: the Site Settings panel (reduced control panel, decision 6).
// Top-right on desktop, applies instantly, persists to am-theme/am-font-size
// (raw strings consumed before paint by the hardened boot script), destroyed
// at ≤700 px and absent when html[data-embedded].

test.describe('site settings panel', () => {
  test('mounted on desktop with restored values and live FPS readout', async ({ page }) => {
    await page.goto('/about/');
    const panel = page.locator('site-settings');
    await expect(panel).toBeVisible();

    const root = page.locator('.cp-root').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { right: cs.right, top: cs.top, fontSize: cs.fontSize };
    });
    expect((await root).right).toBe('0px');
    expect((await root).top).toBe('0px');

    // Summary readout is aria-hidden and starts ticking.
    await expect(page.locator('.cp-stats')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.cp-stats')).toHaveText(/FPS/);

    // Controllers hidden until the summary is clicked.
    await expect(page.locator('.cp-controllers')).toBeHidden();
    await page.locator('.cp-title').click();
    await expect(page.locator('.cp-controllers')).toBeVisible();
    await expect(page.locator('.cp-title')).toHaveAttribute('aria-expanded', 'true');
  });

  test('theme applies instantly and survives reload via the boot script', async ({ page }) => {
    await page.goto('/about/');
    await page.locator('.cp-title').click();
    await page.locator('#cp-theme').selectOption('Light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('am-theme'))).toBe('Light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // select reflects the restored (validated) value
    await expect(page.locator('#cp-theme')).toHaveValue('Light');

    // Back to dark removes the attribute.
    await page.locator('.cp-title').click();
    await page.locator('#cp-theme').selectOption('Dark');
    await expect(page.locator('html[data-theme]')).toHaveCount(0);
  });

  test('font size applies to html style and persists; junk storage is rejected', async ({
    page,
  }) => {
    await page.goto('/about/');
    await page.locator('.cp-title').click();
    await expect(page.locator('#cp-font-size')).toHaveValue('14');

    await page.locator('#cp-font-size').selectOption('18');
    await expect(page.locator('html')).toHaveAttribute('style', /font-size: 18px/);
    expect(await page.evaluate(() => localStorage.getItem('am-font-size'))).toBe('18');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('style', /font-size: 18px/);
    await expect(page.locator('#cp-font-size')).toHaveValue('18');

    // Corrupt stored size ('abc'): the boot guard never applies junk, so no
    // inline style exists at all (the 14px default comes from reset.css), and
    // the panel's select reads back the default.
    await page.addInitScript(() => localStorage.setItem('am-font-size', 'abc'));
    await page.goto('/about/');
    expect(await page.getAttribute('html', 'style')).toBeNull();
    await page.locator('.cp-title').click();
    await expect(page.locator('#cp-font-size')).toHaveValue('14');
  });

  test('panel is draggable by its title without toggling', async ({ page }) => {
    await page.goto('/about/');
    const title = page.locator('.cp-title');
    const box = (await title.boundingBox())!;
    await page.mouse.move(box.x + box.width - 40, box.y + 6);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 160, box.y + 46, { steps: 5 });
    await page.mouse.up();

    const after = await page.locator('.cp-root').evaluate((el) => ({
      left: parseFloat(el.style.left),
      top: parseFloat(el.style.top),
    }));
    expect(after.left).toBeLessThan(box.x);
    expect(after.top).toBeGreaterThan(box.y);

    // >3 px drag suppresses the title's toggle click.
    await expect(page.locator('.cp-controllers')).toBeHidden();
    await expect(page.locator('.cp-title')).toHaveAttribute('aria-expanded', 'false');
  });

  test('destroyed at ≤700px, never mounted', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/about/');
    await expect(page.locator('#site-controls')).toBeHidden();
    expect(await page.evaluate(() => document.querySelector('#site-controls')?.hidden)).toBe(
      true,
    );
  });
});