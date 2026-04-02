import { defineConfig, devices } from '@playwright/test'

/**
 * BASE_URL controls where the E2E tests point:
 *
 *   Local dev (default):
 *     npm run test:e2e
 *     → starts Vite dev server automatically, tests run against http://localhost:5173
 *
 *   Remote / staging / production:
 *     BASE_URL=https://d3683sivhp74is.cloudfront.net npm run test:e2e
 *     → no dev server is started, tests run directly against the provided URL
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const isRemote = !!process.env.BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  // Only spin up the Vite dev server when running locally (no BASE_URL set)
  webServer: isRemote
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
})

