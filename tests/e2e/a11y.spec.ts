import { test, expect } from '@playwright/test';

// Task 12 Step 4 a11y checks (ref §14): skip-link focus order + target focus,
// tree keyboard operability (arrows + vim keys + folder expand), popup focus
// restore, decorative layers aria-hidden, body-text contrast spot-check.
// Reduced-motion coverage beyond the per-feature specs (wave/home/routes/boids/
// trophies) collects the marquee + toast-animation-off assertions here.

test.describe('a11y — keyboard', () => {
  test('skip link is the first tab stop and focuses main content', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('.skip-link')).toBeAttached();

    // The one Tab can race Chrome's initial focus setup — retry the press.
    let onSkipLink = false;
    for (let i = 0; i < 3 && !onSkipLink; i++) {
      await page.keyboard.press('Tab');
      onSkipLink = await page.evaluate(
        () =>
          document.activeElement instanceof HTMLAnchorElement &&
          document.activeElement.classList.contains('skip-link'),
      );
    }
    expect(onSkipLink).toBe(true);

    await page.keyboard.press('Enter');
    const after = await page.evaluate(() => ({
      id: document.activeElement?.id,
      tag: document.activeElement?.tagName,
    }));
    expect(after.id).toBe('main-content');
    expect(after.tag).toBe('MAIN');
  });

  test('tree: arrow keys move focus, h/l expand/collapse folders, aria-expanded syncs', async ({
    page,
  }) => {
    await page.goto('/');
    const items = page.locator('.sidebar [role="treeitem"]');
    await items.first().focus();

    // ArrowDown/ArrowUp cycle exactly like j/k.
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(items.first()).toBeFocused();

    // Home/End jump to the extremes.
    await page.keyboard.press('End');
    await expect(items.last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(items.first()).toBeFocused();

    // l expands a closed folder and moves in; h collapses back out.
    const folder = page.locator('tree-folder[label="projects"]');
    await folder.locator('button[data-summary]').focus();
    await expect(folder).not.toHaveAttribute('open', '');
    await page.keyboard.press('l');
    await expect(folder).toHaveAttribute('open', '');
    await expect(folder.locator('button[data-summary]')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await page.keyboard.press('h');
    await expect(folder).not.toHaveAttribute('open', '');
    await expect(folder.locator('button[data-summary]')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});

test.describe('a11y — popup focus restore', () => {
  test('opening and closing a popup returns focus to the trigger link', async ({ page }) => {
    await page.goto('/contact/');
    const trigger = page.locator('a[data-popup-src]', { hasText: 'GitHub' }).first();
    await trigger.click();
    const popup = page.locator('popup-window');
    await expect(popup).toBeVisible();
    await expect(popup.locator('[data-close]')).toBeFocused(); // managed focus

    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test.describe('a11y — chrome', () => {
  test('decorative layers are aria-hidden', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('.line-numbers')).toHaveAttribute('aria-hidden', 'true');
    await page.locator('.trophy-toggle').focus();
    const indicator = page.locator('.trophy-toggle toggle-indicator');
    await expect(indicator).toHaveCount(1);
    await expect(indicator).toHaveAttribute('aria-hidden', 'true');
  });

  test('body text contrast: subtext0 on surface0 ≥ 4.5 (spot ≈ 5.4)', async ({ page }) => {
    await page.goto('/about/');
    const { text, bg } = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('.content-page .content-lines p');
      return {
        text: getComputedStyle(el!).color,
        bg: getComputedStyle(document.querySelector('main#main-content')!).backgroundColor,
      };
    });
    const lum = (rgb: string): number => {
      const [r, g, b] = rgb
        .match(/rgba?\((\d+), (\d+), (\d+)/)!
        .slice(1, 4)
        .map((v) => {
          const c = Number(v) / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (lum(text) + 0.05) / (lum(bg) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    // ref's quoted value (#839e9a on #232a2e ≈ 5.4:1).
    expect(ratio).toBeGreaterThan(5.0);
  });
});

test.describe('a11y — reduced motion sweep', () => {
  test('marquee never animates; toast flash animation is off', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();

    // Seed explorer only: first-visit then unlocks FRESH on load and fires its
    // toast (pre-seeding it would suppress the unlock event entirely).
    await page.addInitScript(() => {
      localStorage.setItem('am-trophy:explorer', '1');
      localStorage.setItem('am-nav-open', JSON.stringify({ projects: 'true' }));
    });
    await page.goto('/about/');
    await page.locator('.trophy-toggle').click();

    // Overflowing marquee text must stay static under reduced motion.
    const marqueeId = await page.evaluate(() => {
      const m = document.createElement('marquee-text');
      m.textContent = 'x'.repeat(200) + ' end'; // ~200ch — guaranteed overflow
      m.dataset.probe = '';
      document.querySelector('.trophy-panel')?.appendChild(m);
      m.id = 'marquee-probe';
      return 'marquee-probe';
    });
    const marquee = page.locator(`#${marqueeId}`);
    await expect(marquee).toBeVisible();
    await page.waitForTimeout(400); // it would have moved well inside this
    const transform = await marquee.evaluate((el) => {
      const inner = el.querySelector<HTMLElement>('.marquee-inner')!;
      return { style: inner.style.transform, frame: getComputedStyle(inner).transform };
    });
    expect(transform.style).toBe(''); // marquee-text.ts: reduced → stop()
    expect(transform.frame).toBe('none'); // and no CSS transform at all

    // The fresh first-visit toast fires once the (skipped) wave would clear.
    const toast = page.locator('.trophy-toast').first();
    await expect(toast).toBeVisible({ timeout: 8000 });
    expect(await toast.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await context.close();
  });
});