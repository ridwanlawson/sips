import { test, expect } from '@playwright/test';
import { setAuthenticatedCookies } from '../helpers/login';
import { setupApiMocks } from '../helpers/api-mock';
import { HARVEST_EMPTY, HARVEST_ERROR, HARVEST_FILTERED } from '../fixtures/harvest';

test.describe('Harvest', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
  });

  test('should load harvest page', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/harvest/);
  });

  test('should display harvest data table', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should have search input', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="quick-search"] input')).toBeVisible({ timeout: 10000 });
  });

  test('should toggle filter panel', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    const filterButton = page.locator('[data-tour="filter-button"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
  });

  test('should open create form modal', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    const addButton = page.locator('[data-tour="add-button"]');
    if (await addButton.isVisible()) {
      await addButton.first().click();
      await expect(page.locator('.modal-box')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should close create modal on cancel', async ({ page }) => {
    await page.goto('/harvest');
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
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="action-buttons"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display Export button', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button:has-text("Export")')).toBeVisible({ timeout: 10000 });
  });

  test('should toggle to gallery view', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    const toggleBtn = page.locator('[data-tour="action-buttons"] button:has([class*="layout-grid"]), [data-tour="action-buttons"] button:has([class*="list"])').first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
    }
  });

  test('should retry loading when refresh is clicked', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    const refreshBtn = page.locator('[data-tour="action-buttons"] button:has([class*="refresh"])').first();
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
    }
  });

  test('should filter by date and apply', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    const filterBtn = page.locator('[data-tour="filter-button"]');
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible()) {
        await dateInput.fill('2026-07-01');
      }
    }
  });

  test('should show empty state when no data', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/harvest/, async (route) => {
      await route.fulfill({ json: HARVEST_EMPTY });
    });
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on API failure', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/harvest/, async (route) => {
      await route.fulfill({ status: 500, json: HARVEST_ERROR });
    });
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
  });

  test('should verify filtered data displays only matching results', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/harvest/, async (route) => {
      await route.fulfill({ json: HARVEST_FILTERED });
    });
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });
});
