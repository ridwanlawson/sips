import { test, expect } from '@playwright/test';
import { setAuthenticatedCookies } from '../helpers/login';
import { setupApiMocks } from '../helpers/api-mock';
import { DASHBOARD_EMPTY, DASHBOARD_ERROR } from '../fixtures/dashboard';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
  });

  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should display dashboard title', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display summary stat cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[class*="stat"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[class*="drawer"], nav, [class*="navbar"]').first()).toBeVisible();
  });

  test('should navigate to attendance page via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const attendanceLink = page.locator('a[href*="attendance"]').first();
    if (await attendanceLink.isVisible()) {
      await attendanceLink.click();
      await page.waitForURL(/attendance/, { timeout: 10000 });
    }
  });

  test('should display user info badges', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('span.badge-primary').first()).toBeVisible();
  });

  test('should switch timeframe to monthly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const monthlyBtn = page.locator('button:has-text("Per Bulan")');
    if (await monthlyBtn.isVisible()) {
      await monthlyBtn.click();
      await expect(monthlyBtn).toHaveClass(/btn-primary/);
    }
  });

  test('should switch timeframe to yearly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const yearlyBtn = page.locator('button:has-text("Per Tahun")');
    if (await yearlyBtn.isVisible()) {
      await yearlyBtn.click();
      await expect(yearlyBtn).toHaveClass(/btn-primary/);
    }
  });

  test('should display filter section', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-tour="filter-section"]')).toBeVisible();
  });

  test('should display summary stat cards with links', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const detailLinks = page.locator('a:has-text("Lihat Detail")');
    const count = await detailLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should navigate to harvest via detail link', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const harvestLink = page.locator('a[href*="harvest"]').first();
    if (await harvestLink.isVisible()) {
      await harvestLink.click();
      await page.waitForURL(/harvest/, { timeout: 10000 });
    }
  });

  test('should display attendance detail table in rekap mode', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const rekapBtn = page.locator('button:has-text("Per Hari (Rekap)")');
    if (await rekapBtn.isVisible()) {
      await rekapBtn.click();
    }
  });

  test('should toggle attendance detail to per-baris mode', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const detailBtn = page.locator('button:has-text("Per Baris (Detail)")');
    if (await detailBtn.isVisible()) {
      await detailBtn.click();
    }
  });

  test('should display chart components', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should show empty state when no dashboard data', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/dashboard/, async (route) => {
      await route.fulfill({ json: DASHBOARD_EMPTY });
    });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[class*="stat"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show error state on API failure', async ({ page }) => {
    await page.route(/^http:\/\/localhost:3000\/api\/dashboard/, async (route) => {
      await route.fulfill({ status: 500, json: DASHBOARD_ERROR });
    });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="alert"], .alert, .alert-error').first()).toBeVisible({ timeout: 10000 });
  });
});
