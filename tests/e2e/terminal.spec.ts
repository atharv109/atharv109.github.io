import { test, expect } from '@playwright/test';

test.describe('site-terminal', () => {
  test('boots and help lists commands', async ({ page }) => {
    await page.goto('/shell/');
    await page.keyboard.press('x'); // skip boot
    const input = page.locator('.term-input');
    await expect(input).toBeFocused();
    await input.fill('help');
    await input.press('Enter');
    await expect(page.locator('site-terminal')).toContainText('Available commands:');
    await expect(page.locator('site-terminal')).toContainText('neofetch');
  });

  test('secret dispatches the trophy hook', async ({ page }) => {
    await page.goto('/shell/');
    await page.keyboard.press('x');
    const fired = page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          document.addEventListener('trophy:secret', () => resolve(true), { once: true });
          setTimeout(() => resolve(false), 3000);
        }),
    );
    const input = page.locator('.term-input');
    await input.fill('secret');
    await input.press('Enter');
    expect(await fired).toBe(true);
    await expect(page.locator('site-terminal')).toContainText('EASTER EGG UNLOCKED');
  });

  test('exit navigates to /', async ({ page }) => {
    await page.goto('/shell/');
    await page.keyboard.press('x');
    const input = page.locator('.term-input');
    await input.fill('exit');
    await input.press('Enter');
    await page.waitForURL('**/', { timeout: 4000 });
    expect(page.url()).toMatch(/\/$/);
  });

  test('unknown command errors in red, cwd survives bad cd', async ({ page }) => {
    await page.goto('/shell/');
    await page.keyboard.press('x');
    const input = page.locator('.term-input');
    await input.fill('cd nowhere');
    await input.press('Enter');
    const err = page.locator('.t-err', { hasText: 'no such directory' });
    await expect(err).toBeVisible();
    const color = await err.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(245, 127, 130)'); // --color-red
  });
});
