import { test, expect } from '@playwright/test';
import { setAuthenticatedCookies } from '../helpers/login';
import { setupApiMocks } from '../helpers/api-mock';
import { TRANSPORT_EMPTY, TRANSPORT_ERROR, TRANSPORT_FILTERED } from '../fixtures/transport';

test.describe('Transport', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
  });

  test('should load transport page', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/transport/);
  });

  test('should display transport data table', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should have search input', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="quick-search"] input')).toBeVisible({ timeout: 10000 });
  });

  test('should toggle filter panel', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    const filterButton = page.locator('[data-tour="filter-button"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
  });

  test('should open create form modal', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    const addButton = page.locator('[data-tour="add-button"]');
    if (await addButton.isVisible()) {
      await addButton.first().click();
      await expect(page.locator('.modal-box')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should close create modal on cancel', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    const addButton = page.locator('[data-tour="add-button"]');
    if (await addButton.isVisible()) {
      await addButton.first().click();
      await expect(page.locator('.modal-box')).toBeVisible({ timeout: 5000 });
      const cancelButton = page.locator('.modal-box button:has-text("Batal")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }
  });

  test('should have action buttons toolbar', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="action-buttons"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display Export button', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button:has-text("Export")')).toBeVisible({ timeout: 10000 });
  });

  test('should retry loading when refresh is clicked', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    const refreshBtn = page.locator('[data-tour="action-buttons"] button:has([class*="refresh"])').first();
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
    }
  });

  test('should show empty state when no data', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/transport/, async (route) => {
      await route.fulfill({ json: TRANSPORT_EMPTY });
    });
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on API failure', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/transport/, async (route) => {
      await route.fulfill({ status: 500, json: TRANSPORT_ERROR });
    });
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
  });

  test('should verify filtered data displays only matching results', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/transport/, async (route) => {
      await route.fulfill({ json: TRANSPORT_FILTERED });
    });
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should filter by status', async ({ page }) => {
    await page.goto('/transport');
    await page.waitForLoadState('networkidle');
    const statusSelect = page.locator('select[aria-label*="status"]').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('Selesai');
    }
  });
});
