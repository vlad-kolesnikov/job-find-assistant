import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: isCI ? 2 : 0,
  reporter: (['list', 'html', ...(isCI ? [['junit', { outputFile: 'playwright-junit.xml' }]] : [])]) as any,
  use: {
    baseURL: isCI ? 'http://localhost:5174' : 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    // Auth setup project: signs in and saves storage state
    {
      name: 'setup',
      testMatch: 'tests/auth.setup.ts',
    },
    // Authenticated Chromium: runs all app tests except unauth auth.spec
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      testIgnore: 'tests/auth.spec.ts',
      dependencies: ['setup'],
    },
    // Unauthenticated Chromium: runs only the unauth redirect test
    {
      name: 'chromium-guest',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: 'tests/auth.spec.ts',
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
