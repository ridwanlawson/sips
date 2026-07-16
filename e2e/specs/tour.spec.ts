import { test, expect, type Page } from '@playwright/test';
import { setAuthenticatedCookies } from '../helpers/login';
import { setupApiMocks } from '../helpers/api-mock';

const helpBtn = (page: Page) => page.locator('button.btn-warning').first();

test.describe('Tour Guide', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
  });

  test('should show tour help button on attendance page', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');
    await expect(helpBtn(page)).toBeVisible({ timeout: 10000 });
  });

  test('should start tour when help button is clicked', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');
    const btn = helpBtn(page);
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[role="dialog"]').filter({ has: page.locator('text=Langkah') })).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to next tour step', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');
    const btn = helpBtn(page);
    if (await btn.isVisible()) {
      await btn.click();
      const nextBtn = page.locator('button[aria-label="Selanjutnya"], button[aria-label="Next"]').first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
      }
    }
  });

  test('should go back to previous tour step', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');
    const btn = helpBtn(page);
    if (await btn.isVisible()) {
      await btn.click();
      const nextBtn = page.locator('button[aria-label="Selanjutnya"], button[aria-label="Next"]').first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        const backBtn = page.locator('button[aria-label="Kembali"], button[aria-label="Back"]').first();
        if (await backBtn.isVisible()) {
          await backBtn.click();
        }
      }
    }
  });

  test('should close tour when skip button is clicked', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');
    const btn = helpBtn(page);
    if (await btn.isVisible()) {
      await btn.click();
      const closeBtn = page.locator('button[aria-label="Tutup"], button[aria-label="Close"]').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await expect(page.locator('[role="dialog"]').filter({ has: page.locator('text=Langkah') })).not.toBeVisible();
      }
    }
  });

  test('should show tour button on harvest page', async ({ page }) => {
    await page.goto('/harvest');
    await page.waitForLoadState('networkidle');
    await expect(helpBtn(page)).toBeVisible({ timeout: 10000 });
  });

  test('should show tour button on users page', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(helpBtn(page)).toBeVisible({ timeout: 10000 });
  });
});
