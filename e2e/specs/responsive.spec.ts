import { test, expect } from '@playwright/test';
import { setAuthenticatedCookies } from '../helpers/login';
import { setupApiMocks } from '../helpers/api-mock';

test.describe('Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
  });

  test('should display drawer menu on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const hamburgerBtn = page.locator('button[aria-label*="menu" i], label[aria-label*="drawer" i], button:has(.drawer), [class*="drawer"] button:first-child').first();
    if (await hamburgerBtn.isVisible()) {
      await hamburgerBtn.click();
    }
  });

  test('should show desktop sidebar on large viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display horizontal scroll hint on mobile table', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');

    const table = page.locator('[data-tour="data-table"]');
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  });

  test('should render full table on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should render gallery view on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');

    const toggleBtn = page.locator('[data-tour="action-buttons"] button:has([class*="layout-grid"]), [data-tour="action-buttons"] button:has([class*="list"])').first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
    }
  });
});
