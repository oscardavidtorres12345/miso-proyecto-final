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
  // CI: 15s per action (network round-trips over CloudFront/ELB are slower than local)
  // Local: 30s (generous for slow machines / cold Vite starts)
  timeout: process.env.CI ? 15_000 : 30_000,
  // Navigation timeout separate from action timeout
  // Keeps page.goto() from hanging if the server is slow
  navigationTimeout: process.env.CI ? 20_000 : 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry in CI to catch genuine flakes — avoids 2 extra full runs per failing test
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // 'domcontentloaded' is significantly faster than the default 'load' and
    // avoids the notorious networkidle hang on CDN-served pages
    actionTimeout: process.env.CI ? 10_000 : 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // slowMo: pausa entre cada acción (ms) — útil para ver el test en vivo.
        // Solo aplica en modo --ui o --headed; en CI no hace diferencia porque
        // CI=true apunta a un webServer ya corriendo (no usa el dev server local).
        launchOptions: {
          slowMo: process.env.CI ? 0 : 500,
        },
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

