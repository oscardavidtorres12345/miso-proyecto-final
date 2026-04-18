import { test, expect } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'

// Core Web Vitals thresholds
// CI runners (2 vCPU) are slower than local machines, which skews Lighthouse simulate
// mode values upward — CI thresholds are relaxed to account for this.
const isCI = !!process.env.CI
const THRESHOLDS = {
  lcp: isCI ? 4000 : 2500,   // ms — Largest Contentful Paint
  tbt: isCI ? 600  : 300,    // ms — Total Blocking Time (lab proxy for FID < 100ms)
  cls: 0.1,                  // Cumulative Layout Shift (layout-only, not CPU-bound)
  ttfb: isCI ? 1000 : 600,   // ms — Time to First Byte
  tti: isCI ? 6000 : 3800,   // ms — Time to Interactive
}

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'signup', path: '/signup' },
]

for (const { name, path } of PAGES) {
  test(`[${name}] Core Web Vitals dentro de umbrales`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' })

    const result = await playAudit({
      page,
      port: 9222,
      // performance: 0 ensures the "performance" category runs (required by Lighthouse)
      // without blocking on overall score — we assert numeric values ourselves below
      thresholds: { performance: 0 },
      config: {
        extends: 'lighthouse:default',
        settings: {
          throttlingMethod: 'simulate',
          formFactor: 'desktop',
          screenEmulation: {
            mobile: false,
            width: 1280,
            height: 720,
            deviceScaleFactor: 1,
            disabled: false,
          },
        },
      },
      reports: {
        formats: { html: true, json: true },
        name: `lighthouse-${name}`,
        directory: 'performance-report/lighthouse',
      },
    })

    const audits = result.lhr.audits

    expect(
      audits['largest-contentful-paint'].numericValue,
      `[${name}] LCP debe ser < ${THRESHOLDS.lcp}ms`
    ).toBeLessThan(THRESHOLDS.lcp)

    expect(
      audits['total-blocking-time'].numericValue,
      `[${name}] TBT debe ser < ${THRESHOLDS.tbt}ms (proxy FID < 100ms)`
    ).toBeLessThan(THRESHOLDS.tbt)

    expect(
      audits['cumulative-layout-shift'].numericValue,
      `[${name}] CLS debe ser < ${THRESHOLDS.cls}`
    ).toBeLessThan(THRESHOLDS.cls)

    expect(
      audits['server-response-time'].numericValue,
      `[${name}] TTFB debe ser < ${THRESHOLDS.ttfb}ms`
    ).toBeLessThan(THRESHOLDS.ttfb)

    expect(
      audits['interactive'].numericValue,
      `[${name}] TTI debe ser < ${THRESHOLDS.tti}ms`
    ).toBeLessThan(THRESHOLDS.tti)
  })
}
