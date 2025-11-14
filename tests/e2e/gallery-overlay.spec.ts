import { test, expect } from '@playwright/test';

test.describe('site gallery overlay', () => {
  test('overlay tiles appear in grid and photo row contains no images', async ({ page }) => {
    await page.goto('/');
    // Ensure camera API is ready, then go to grid
    await page.waitForFunction(() => typeof (window as any).__cameraApi !== 'undefined');
    await page.evaluate(async () => { await (window as any).__cameraApi?.zoomOutToGrid?.(); });

    // Overlay should render media tiles in grid view
    const mediaTiles = page.locator('.media-tile');
    await expect(mediaTiles.first()).toBeVisible();

    // Media tiles remain visible after zooming into hero row
    await page.evaluate(async () => {
      await (window as any).__cameraApi?.focusRow?.('hero');
    });
    await expect(mediaTiles.first()).toBeVisible();

    // Focus a tile via keyboard to confirm accessibility
    const focused = await page.evaluate(() => {
      const tile = document.querySelector('.media-tile .surface');
      if (tile instanceof HTMLElement) {
        tile.focus();
        return document.activeElement === tile;
      }
      return false;
    });
    expect(focused).toBe(true);

    // Photo content tile should not render inline photo gallery images
    // Focus photo row and check it only contains the content tile (no img inside the tile body)
    await page.goto('/photo');
    const tileRegion = page.locator('[aria-label="PHOTO"]');
    await expect(tileRegion).toBeVisible();
    await expect(tileRegion.locator('img')).toHaveCount(0);
  });
});
