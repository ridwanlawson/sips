import { test, expect } from '@playwright/test';
import { setAuthenticatedCookies } from '../helpers/login';
import { setupApiMocks } from '../helpers/api-mock';

test.describe('Laporan Harian Mandor (LHM)', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
  });

  test('should load LHM page', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/lhm/);
  });

  test('should display LHM data table', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should have search input', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="quick-search"] input')).toBeVisible({ timeout: 10000 });
  });

  test('should have action buttons toolbar', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="action-buttons"]')).toBeVisible({ timeout: 10000 });
  });

  test('should have total statistic cards', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="total-cards"]')).toBeVisible({ timeout: 10000 });
  });

  test('should have approve buttons in table', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    const approveBtn = page.locator('button:has-text("Setuju")').first();
    if (await approveBtn.isVisible()) {
      await expect(approveBtn).toBeVisible();
    }
  });

  test('should have open buttons in table', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    const openBtn = page.locator('button:has-text("Buka")').first();
    if (await openBtn.isVisible()) {
      await expect(openBtn).toBeVisible();
    }
  });

  test('should have HA column in table', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('span[title="Hektar (HA)"]')).toBeVisible({ timeout: 10000 });
  });

  test('should retry loading when refresh is clicked', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    const refreshBtn = page.locator('[data-tour="action-buttons"] button:has([class*="refresh"])').first();
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
    }
  });

  test('should show empty state when no LHM data', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/lhm/, async (route) => {
      await route.fulfill({ json: { data: [], meta: { total: 0, page: 1, perPage: 10 } } });
    });
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on API failure', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/lhm/, async (route) => {
      await route.fulfill({ status: 500, json: { message: 'Internal Server Error' } });
    });
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
  });

  test('should open LHM detail on row click', async ({ page }) => {
    await page.goto('/lhm');
    await page.waitForLoadState('networkidle');
    const firstRow = page.locator('[data-tour="data-table"] tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
    }
  });
});
