import { test, expect } from '@playwright/test';

test.describe('Auth flow (unauthenticated)', () => {
  test('redirects from / to /auth and shows auth UI', async ({ page }) => {
    const resp = await page.goto('/');
    expect(resp?.ok()).toBeTruthy();

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: /welcome back|create an account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });
});

