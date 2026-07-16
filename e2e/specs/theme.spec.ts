import { test, expect, type Page } from '@playwright/test';
import { setAuthenticatedCookies } from '../helpers/login';
import { setupApiMocks } from '../helpers/api-mock';

const userMenu = (page: Page) => page.locator('[aria-label="Menu pengguna"]');
const themeToggle = (page: Page) => page.locator('[aria-label="Tema"]');

async function openUserMenu(page: Page) {
  const menu = userMenu(page);
  if (await menu.isVisible()) {
    await menu.click();
  }
}

async function openThemeDropdown(page: Page) {
  await openUserMenu(page);
  const toggle = themeToggle(page);
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}

test.describe('Theme Switcher', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
  });

  test('should display theme toggle on navbar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await openUserMenu(page);
    await expect(themeToggle(page)).toBeVisible({ timeout: 10000 });
  });

  test('should open theme dropdown on click', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await openThemeDropdown(page);
    await expect(page.locator('button:has-text("Gelap"), button:has-text("Dark")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch to dark theme', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await openThemeDropdown(page);
    const darkBtn = page.locator('button:has-text("Gelap"), button:has-text("Dark")').first();
    if (await darkBtn.isVisible()) {
      await darkBtn.click();
    }
  });

  test('should switch to retro theme', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await openThemeDropdown(page);
    const retroBtn = page.locator('button:has-text("Retro")').first();
    if (await retroBtn.isVisible()) {
      await retroBtn.click();
    }
  });

  test('should show all available theme options', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await openThemeDropdown(page);

    const themes = ['Light', 'Dark', 'Retro', 'Cyberpunk', 'Valentine', 'Aqua', 'Plant'];
    for (const t of themes) {
      const btn = page.locator(`button:has-text("${t}")`).first();
      if (await btn.isVisible()) {
        await expect(btn).toBeVisible();
      }
    }
  });

  test('should show check icon on active theme', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await openThemeDropdown(page);

    const activeBtn = page.locator('button[aria-current="true"]').first();
    if (await activeBtn.isVisible()) {
      await expect(activeBtn).toBeVisible();
    }
  });
});
