import { type Page } from '@playwright/test'

const STORAGE_KEY = 'travel-hub-auth'

const buildSession = (role: 'GUEST' | 'STAFF') => ({
  user: {
    user_id: role === 'STAFF' ? 1 : 2,
    username: role === 'STAFF' ? 'staff.user' : 'guest.user',
    email: role === 'STAFF' ? 'staff@travelhub.com' : 'guest@travelhub.com',
    role,
    is_active: true,
  },
  permissions: [],
  sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
})

export async function injectGuestSession(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(buildSession('GUEST')) },
  )
}

export async function injectStaffSession(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(buildSession('STAFF')) },
  )
}
