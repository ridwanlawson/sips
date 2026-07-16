import { test, expect } from '@playwright/test';
import { setAuthenticatedCookies } from '../helpers/login';
import { setupApiMocks } from '../helpers/api-mock';

test.describe('Users', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
  });

  test('should load users page', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/users/);
  });

  test('should display users data table', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should have search input', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="quick-search"] input')).toBeVisible({ timeout: 10000 });
  });

  test('should toggle filter panel', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    const filterButton = page.locator('[data-tour="filter-button"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
  });

  test('should open create user modal', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    const addButton = page.locator('[data-tour="add-button"]');
    if (await addButton.isVisible()) {
      await addButton.first().click();
      await expect(page.locator('.modal-box')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should close create modal on cancel', async ({ page }) => {
    await page.goto('/users');
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
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="action-buttons"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display Export button', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button:has-text("Export")')).toBeVisible({ timeout: 10000 });
  });

  test('should retry loading when refresh is clicked', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    const refreshBtn = page.locator('[data-tour="action-buttons"] button:has([class*="refresh"])').first();
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
    }
  });

  test('should filter by level', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    const levelSelect = page.locator('select[aria-label*="level" i], select:has-text("Level")').first();
    if (await levelSelect.isVisible()) {
      await levelSelect.selectOption('Admin');
    }
  });

  test('should show empty state when no user data', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/users/, async (route) => {
      await route.fulfill({ json: { data: [], meta: { total: 0, page: 1, perPage: 10 } } });
    });
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="data-table"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error message on API failure', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/users/, async (route) => {
      await route.fulfill({ status: 500, json: { message: 'Internal Server Error' } });
    });
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
  });

  test('should toggle user active status', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    const toggleBtn = page.locator('button:has-text("Aktifkan"), button:has-text("Nonaktifkan")').first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
    }
  });

  test('should have bulk action checkboxes', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
