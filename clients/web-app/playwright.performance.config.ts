import { defineConfig } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4173'
const isRemote = !!process.env.BASE_URL

export default defineConfig({
  testDir: './tests/performance',
  testMatch: '**/*.spec.ts',
  // Lighthouse needs exclusive CDP access — no parallelism
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['html', { outputFolder: 'performance-report' }], ['list']],
  use: {
    baseURL: BASE_URL,
    // Required by @playwright-community/playwright-lighthouse
    launchOptions: {
      args: ['--remote-debugging-port=9222'],
    },
  },
  webServer: isRemote
    ? undefined
    : {
        command: 'npm run preview',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 30_000,
      },
})
