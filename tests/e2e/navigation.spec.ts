import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    __cameraApi?: { zoomOutToGrid?: () => unknown };
  }
}

const PATHS = ['/', '/contact', '/photo/desert-dawn', '/film/brand-film-x'];

test.describe('navigation flows', () => {
  for (const path of PATHS) {
    test(`renders ${path}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('#svelte')).toBeVisible();
    });
  }

  test('contact CTA animates then navigates', async ({ page }) => {
    await page.goto('/photo/desert-dawn');

    const cta = page.locator('.contact-cta');
    await expect(cta).toBeHidden();

    await page.click('body', { position: { x: 5, y: 5 } });
    await page.evaluate(async () => {
      await window.__cameraApi?.zoomOutToGrid?.();
    });
    await expect(cta).toBeVisible();

    await cta.click();
    await page.waitForURL('**/contact');
    await expect(cta).toBeHidden();

    await page.evaluate(async () => {
      await window.__cameraApi?.zoomOutToGrid?.();
    });
    await expect(cta).toBeVisible();
  });

  test('browser history cycles between routes', async ({ page }) => {
    await page.goto('/photo/desert-dawn');
    await page.goto('/film/brand-film-x');
    await page.goBack();
    await page.waitForURL('**/photo/desert-dawn');
    await page.goForward();
    await page.waitForURL('**/film/brand-film-x');
  });
});
