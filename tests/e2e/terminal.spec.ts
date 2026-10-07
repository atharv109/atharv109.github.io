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

  test('banner spells ATHARV MITTAL', async ({ page }) => {
    await page.goto('/shell/');
    const banner = page.locator('.term-banner');
    await expect(banner).toBeVisible();
    const rows = (await banner.textContent()) ?? '';
    // Distinctive glyph of the new art's R (`| |_) |`) — the legacy banner
    // art never contained it. Sub-line stays.
    expect(rows).toContain('| |_) |');
    expect(rows).toContain('SECURITY ENGINEER');
  });

  test('the block cursor sits after the typed text, not at the row end', async ({ page }) => {
    await page.goto('/shell/');
    await page.keyboard.press('x'); // skip boot
    const input = page.locator('.term-input');
    await expect(input).toBeFocused();
    await input.fill('whoami');
    const check = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('.term-input')!;
      const w = el.getBoundingClientRect().width;
      const cell = parseFloat(getComputedStyle(el).width) ;
      // advance 0.5em per cell at 14px → 7px
      const cellW = parseFloat(getComputedStyle(el).fontSize) * 0.5;
      return { len: el.value.length, cells: w / cellW, cellW };
    });
    // Input width ≈ len + 1 cells (sized to the text) — with the old
    // flex: 1 stretch it was dozens of cells wide, pushing the cursor to
    // the row's utmost right.
    expect(Math.round(check.cells)).toBeLessThanOrEqual(check.len + 2);
  });
});
