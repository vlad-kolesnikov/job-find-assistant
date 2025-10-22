import { test, expect } from '@playwright/test';

test('authenticate and save storage', async ({ page, context, baseURL }) => {
  // Go to auth page explicitly in case of redirects
  await page.goto(baseURL ? new URL('/auth', baseURL).toString() : '/auth');

  // Fill credentials
  await page.getByLabel('Email').fill('cyberadi_k@yahoo.com');
  await page.getByLabel('Password').fill('12345678');

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click();

  // Expect to land on the main page
  await page.waitForURL(/\/$/);
  await expect(page).toHaveURL(/\/$/);

  // Persist storage for subsequent projects
  await context.storageState({ path: 'playwright/.auth/user.json' });
});

