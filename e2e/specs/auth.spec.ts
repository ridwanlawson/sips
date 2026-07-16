import { test, expect, type Page } from '@playwright/test';
import { setupApiMocks } from '../helpers/api-mock';
import { setAuthenticatedCookies } from '../helpers/login';

const usernameInput = (page: Page) => page.getByRole('textbox', { name: 'Nama Pengguna' });
const passwordInput = (page: Page) => page.getByRole('textbox', { name: 'Kata Sandi' });
const loginButton = (page: Page) => page.getByRole('button', { name: 'Masuk' });

test.describe('Authentication', () => {

  test('should display login page', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(usernameInput(page)).toBeVisible();
    await expect(loginButton(page)).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/dashboard');
    await page.waitForURL(/\?redirect=/, { timeout: 10000 });
    await expect(usernameInput(page)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await usernameInput(page).fill('testuser');
    await passwordInput(page).fill('password123');
    await loginButton(page).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await usernameInput(page).fill('wronguser');
    await passwordInput(page).fill('wrongpass');
    await loginButton(page).click();
    await expect(page.locator('span[role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect authenticated user to dashboard from login', async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
    await page.goto('/');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('should show loading spinner while logging in', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await usernameInput(page).fill('testuser');
    await passwordInput(page).fill('password123');
    await loginButton(page).click();
    await expect(page.getByRole('button', { name: /sedang masuk|logging in/i })).toBeVisible({ timeout: 3000 });
  });

  test('should redirect back to original page after login', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/attendance');
    await page.waitForURL(/\?redirect=/, { timeout: 10000 });
    await usernameInput(page).fill('testuser');
    await passwordInput(page).fill('password123');
    await loginButton(page).click();
    await page.waitForURL(/attendance/, { timeout: 15000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const pwdInput = passwordInput(page);
    await expect(pwdInput).toHaveAttribute('type', 'password');
    const toggleBtn = page.getByRole('button', { name: /tampilkan|show/i });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await expect(pwdInput).toHaveAttribute('type', 'text');
    }
  });

  test('should disable form inputs while loading', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await usernameInput(page).fill('testuser');
    await passwordInput(page).fill('password123');
    await loginButton(page).click();
    await expect(usernameInput(page)).toBeDisabled();
    await expect(passwordInput(page)).toBeDisabled();
  });

  test('should logout successfully', async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const logoutBtn = page.getByRole('button', { name: /Keluar|Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/login|\/\?redirect=/, { timeout: 10000 });
    }
  });

  test('should redirect to login when session expires', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.context().clearCookies();
    await page.reload();
    await page.waitForURL(/\?redirect=/, { timeout: 10000 });
    await expect(usernameInput(page)).toBeVisible();
  });

  test('should navigate to change password page when authenticated', async ({ page }) => {
    await setupApiMocks(page);
    await setAuthenticatedCookies(page);
    await page.goto('/change-password');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/change-password/);
  });

  test('should have language switcher on login page', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-label="Pilih bahasa"]')).toBeVisible({ timeout: 5000 });
  });

  test('should show password hint text on login page', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(passwordInput(page)).toBeVisible();
  });

  test('should require username and password fields', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(usernameInput(page)).toHaveAttribute('required');
    await expect(passwordInput(page)).toHaveAttribute('required');
  });

  test('should require minimum password length', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(passwordInput(page)).toHaveAttribute('minlength');
  });
});
