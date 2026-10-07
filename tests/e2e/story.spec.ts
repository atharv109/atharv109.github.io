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
    await expect(block.locator('.story-chip')).toContainText('story · pause', { timeout: 5000 });
    await expect(block.locator('.story-chip')).toContainText('1/6');
    await expect(block.locator('.story-caption')).toContainText('4,102 advisories');
    // The '<>' slide arrows only EXIST once the story completes (user: no
    // mid-play clicking); checked at the end of this test.

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
    await expect(block.locator('.story-chip')).toContainText('2/6');
    await expect(block.locator('.story-progress')).toContainText('2/6');

    // At the very end: arrows materialise, the chip reads replay.
    await expect(block.locator('.story-prev')).toBeHidden();
    await page.evaluate(() =>
      (
        document.querySelector('story-block') as HTMLElement & { story: { seek(t: number): void } }
      ).story.seek(999),
    );
    await expect(block.locator('.story-chip')).toContainText('story · replay');
    await expect(block.locator('.story-next')).toBeVisible();
  });

  test('eleventh-round page auto-discovers its story and plays beat 1', async ({ page }) => {
    // Template-side glob (server) + client-side glob pick the story up with no
    // per-page wiring (Task 15 fanout contract).
    await page.goto('/projects/eleventh-round/');
    await page.waitForFunction(
      () => !document.documentElement.classList.contains('wave-pending') && !document.querySelector('.wv-char'),
      null,
      { timeout: 5000 },
    );

    const block = page.locator('story-block');
    await expect(block.locator('.story-chip')).toContainText('story · pause', { timeout: 5000 });
    await expect(block.locator('.story-chip')).toContainText('1/5');
    await expect(block.locator('.story-caption')).toContainText('no single platform');
    await expect(block.locator('.story-grid .ascii-overlay')).toBeVisible({ timeout: 5000 });
    // Layman one-liner under the video (what it IS, no jargon).
    await expect(block.locator('.story-plain')).toContainText('fighters');

    await block.focus();
    await page.keyboard.press('ArrowRight');
    await expect(block.locator('.story-chip')).toContainText('2/5');
    // Arrows only exist at the end; drive the slides by mouse there.
    await page.evaluate(() =>
      (
        document.querySelector('story-block') as HTMLElement & { story: { seek(t: number): void } }
      ).story.seek(999),
    );
    await expect(block.locator('.story-next')).toBeVisible();
    await block.locator('.story-prev').click();
    await expect(block.locator('.story-chip')).toContainText('4/5');
    // Browsing mode: after the end was reached, paused slides keep the
    // arrows live (they only hide again when the story RUNS).
    await expect(block.locator('.story-next')).toBeVisible();
    await block.locator('.story-next').click();
    await expect(block.locator('.story-chip')).toContainText('5/5');
    // Resume (replay): mid-run the arrows hide again (no glitchy clicks).
    await page.keyboard.press('r');
    await expect(block.locator('.story-chip')).toContainText('story · pause');
    await expect(block.locator('.story-next')).toBeHidden();
  });

  for (const slug of ['adversary-lab', 'prompt-optimiser', 'crypton', 'acctomatic']) {
    test(`${slug} auto-discovers its story: chip, caption, layman line, rendered rows`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      await page.waitForFunction(
        () => !document.documentElement.classList.contains('wave-pending') && !document.querySelector('.wv-char'),
        null,
        { timeout: 5000 },
      );

      const block = page.locator('story-block');
      await expect(block.locator('.story-chip')).toContainText('story', { timeout: 5000 });
      await expect(block.locator('.story-caption')).not.toBeEmpty({ timeout: 5000 });
      await expect(block.locator('.story-plain')).not.toBeEmpty({ timeout: 5000 });
      // The renderer paints inside the reserved rows (poll: some beats start
      // with a brief blank head, e.g. acctomatic's typed rows).
      const painted = page
        .locator('story-block .story-grid .ascii-row')
        .filter({ hasText: /\S/ });
      await expect(painted.first()).toBeVisible({ timeout: 5000 });
    });
  }
});