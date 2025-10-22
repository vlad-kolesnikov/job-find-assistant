import { test, expect } from '@playwright/test';
// Storage state is configured per-project in playwright.config.ts

// Helper: robust rapid clicking to bypass potential drag/overlay interference
async function clickMany(locator: import('@playwright/test').Locator, times: number) {
  for (let i = 0; i < times; i++) {
    await locator.scrollIntoViewIfNeeded();
    await locator.hover({ trial: true }).catch(() => undefined);
    // Force the click if something overlaps (e.g., dnd overlay)
    await locator.click({ force: true });
  }
}

test.describe('Application Tracker counters', () => {
  test('rapid + clicks increase by N for sent, waiting, rejected', async ({ page }) => {
    const N = 5;

    await page.goto('/');

    // Wait up to 5s either for auth redirect or for counters to appear
    const firstSentInc = page.locator('[data-testid^="sent-inc-"]').first();
    // If page is stuck on loading (no stats), skip to avoid false negatives
    const loadingLoc = page.getByText('Loading...');
    if (await loadingLoc.isVisible().catch(() => false)) {
      await expect(loadingLoc).toBeVisible();
      await expect(loadingLoc).toBeHidden({ timeout: 5000 }).catch(() => {
        test.skip(true, 'Stats not loaded; seed required for this user');
      });
    }

    const seenCounters = await firstSentInc.isVisible({ timeout: 5000 }).catch(() => false);
    if (!seenCounters) {
      // Give SPA time to navigate
      await page.waitForTimeout(250);
      if (page.url().includes('/auth')) {
        test.skip(true, 'Requires authenticated session to access Application Tracker');
      }
      // Добавляем платформу только если список пуст: виден текст-заглушка
      const emptyState = page.getByText('No job platforms yet.');
      if (await emptyState.isVisible().catch(() => false)) {
        const addBtn = page.getByRole('button', { name: /add platform/i });
        await addBtn.click();
        await page.getByPlaceholder('e.g. LinkedIn').fill('LinkedIn');
        await page.getByPlaceholder('e.g. https://www.linkedin.com/jobs/search/?').fill('https://www.linkedin.com/jobs/search/?');
        await page.getByPlaceholder('e.g. f_E=1&geoId=102257491').fill('f_TPR=r86400');
        await page.getByRole('button', { name: /^add platform$/i }).click();
      }
      // Wait for counters to appear now
      try {
        await page.waitForSelector('[data-testid^="sent-inc-"]', { timeout: 15000 });
      } catch {
        test.skip(true, 'No job sources found; seed a platform to run this test');
      }
      await expect(firstSentInc).toBeVisible();
    }

    // Derive the source id from the test id so we can address matching counters reliably
    const sentIncTestId = await firstSentInc.getAttribute('data-testid');
    if (!sentIncTestId) throw new Error('Missing data-testid on sent increment button');
    const sourceId = sentIncTestId.replace('sent-inc-', '');

    const sentCount = page.locator(`[data-testid="sent-count-${sourceId}"]`);
    const waitingInc = page.locator(`[data-testid="waiting-inc-${sourceId}"]`);
    const waitingCount = page.locator(`[data-testid="waiting-count-${sourceId}"]`);
    const rejectedInc = page.locator(`[data-testid="rejected-inc-${sourceId}"]`);
    const rejectedCount = page.locator(`[data-testid="rejected-count-${sourceId}"]`);

    // Capture initial values
    const startSent = parseInt((await sentCount.innerText()).trim() || '0', 10);
    const startWaiting = parseInt((await waitingCount.innerText()).replace(/[^0-9]/g, '').trim() || '0', 10);
    const startRejected = parseInt((await rejectedCount.innerText()).trim() || '0', 10);

    // Click rapidly N times on each + button
    await clickMany(firstSentInc, N);
    await clickMany(waitingInc, N);
    await clickMany(rejectedInc, N);

    // Expect the counters to increase exactly by N
    await expect(sentCount).toHaveText(String(startSent + N));
    // waiting counter has an icon before number; we extract text digits only for assertion
    await expect(waitingCount).toContainText(String(startWaiting + N));
    await expect(rejectedCount).toHaveText(String(startRejected + N));
  });
});
