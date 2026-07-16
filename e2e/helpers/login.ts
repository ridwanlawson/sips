import type { Page } from '@playwright/test';
import { setupApiMocks } from './api-mock';
import { COOKIES_MAP } from '../fixtures/auth';

export async function loginAsAdmin(page: Page): Promise<void> {
  await setupApiMocks(page);
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Set auth cookies directly to simulate login
  for (const [name, value] of Object.entries(COOKIES_MAP)) {
    await page.context().addCookies([
      {
        name,
        value,
        domain: 'localhost',
        path: '/',
      },
    ]);
  }
}

export async function loginViaForm(page: Page): Promise<void> {
  await setupApiMocks(page);
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

export async function setAuthenticatedCookies(page: Page): Promise<void> {
  for (const [name, value] of Object.entries(COOKIES_MAP)) {
    await page.context().addCookies([
      {
        name,
        value,
        domain: 'localhost',
        path: '/',
      },
    ]);
  }
}
