import { describe, it, expect } from 'vitest'
import { getHeaderConfig } from '@/App'
import { UserRole } from '@/types/user'

describe('getHeaderConfig', () => {
  describe('public pages', () => {
    it('returns flag and logo on /login', () => {
      expect(getHeaderConfig('/login', false, null)).toEqual({ showFlag: true, showLogo: true })
    })

    it('returns flag and logo on /signup', () => {
      expect(getHeaderConfig('/signup', false, null)).toEqual({ showFlag: true, showLogo: true })
    })
  })

  describe('not authenticated', () => {
    it('returns flag, login button and logo', () => {
      expect(getHeaderConfig('/', false, null)).toEqual({ showFlag: true, showLogin: true, showLogo: true })
    })

    it('returns flag, login button and logo on any route', () => {
      expect(getHeaderConfig('/search', false, null)).toEqual({ showFlag: true, showLogin: true, showLogo: true })
    })
  })

  describe('authenticated as GUEST', () => {
    it('returns menu, flag, cart and logo', () => {
      expect(getHeaderConfig('/', true, UserRole.GUEST)).toEqual({ showMenu: true, showFlag: true, showCart: true, showLogo: true })
    })

    it('does not show login button', () => {
      const config = getHeaderConfig('/', true, UserRole.GUEST)
      expect(config).not.toHaveProperty('showLogin')
    })
  })

  describe('authenticated as STAFF', () => {
    it('returns menu and flag only', () => {
      expect(getHeaderConfig('/', true, UserRole.STAFF)).toEqual({ showMenu: true, showFlag: true })
    })

    it('does not show logo', () => {
      const config = getHeaderConfig('/', true, UserRole.STAFF)
      expect(config).not.toHaveProperty('showLogo')
    })

    it('does not show cart', () => {
      const config = getHeaderConfig('/', true, UserRole.STAFF)
      expect(config).not.toHaveProperty('showCart')
    })

    it('does not show login button', () => {
      const config = getHeaderConfig('/', true, UserRole.STAFF)
      expect(config).not.toHaveProperty('showLogin')
    })
  })
})
