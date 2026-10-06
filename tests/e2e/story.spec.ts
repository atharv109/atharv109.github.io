import { test, expect } from '@playwright/test';

// Task 14/15: <story-block> on featured project pages. The player must mount
// the renderer AFTER the arrival wave clears (T6 contract) and its chip /
// caption / dots must sync from the engine's synchronous registration
// callbacks — empty UI with a live engine was the regression this spec pins.

test.describe('story player', () => {
  test('vulnswarm player syncs UI and draws beats once the wave clears', async ({ page }) => {
    await page.goto('/projects/vulnswarm-vex/');
    await page.waitForFunction(
      () => !document.documentElement.classList.contains('wave-pending') && !document.querySelector('.wv-char'),
      null,
      { timeout: 5000 },
    );

    const block = page.locator('story-block');
    // Chip + caption + dots populated by the immediate registration callbacks.
    await expect(block.locator('.story-chip')).toContainText('story · THE FLOOD', { timeout: 5000 });
    await expect(block.locator('.story-chip')).toContainText('beat 1/6');
    await expect(block.locator('.story-caption')).toContainText('4,102 advisories');

    // The renderer mounts and paints inside the reserved grid rows.
    await expect(block.locator('.story-grid .ascii-overlay')).toBeVisible({ timeout: 5000 });
    const drawn = await page.evaluate(() => {
      const overlay = document.querySelector('.story-grid .ascii-overlay');
      return overlay ? overlay.textContent?.replace(/\s/g, '').length ?? 0 : 0;
    });
    expect(drawn).toBeGreaterThan(0);

    // Progress dots show beat 1 of 6.
    await expect(block.locator('.story-progress')).toContainText('1/6');

    // Keyboard scrub: → advances a beat; the chip and dots follow.
    await block.focus();
    await page.keyboard.press('ArrowRight');
    await expect(block.locator('.story-chip')).toContainText('beat 2/6');
    await expect(block.locator('.story-progress')).toContainText('2/6');
  });
});