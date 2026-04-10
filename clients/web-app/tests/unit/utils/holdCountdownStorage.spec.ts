import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearHoldCountdownEnd,
  persistHoldCountdownEnd,
  readHoldCountdownEnd,
} from '@/utils/holdCountdownStorage'

const KEY = 'travelhub_hold_countdown_v1'

describe('holdCountdownStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('persists and reads round-trip', () => {
    persistHoldCountdownEnd(7, 1_700_000_000_000)
    expect(readHoldCountdownEnd()).toEqual({ v: 1, userId: 7, endMs: 1_700_000_000_000 })
  })

  it('clearHoldCountdownEnd removes key', () => {
    persistHoldCountdownEnd(1, 100)
    clearHoldCountdownEnd()
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(readHoldCountdownEnd()).toBeNull()
  })

  it('readHoldCountdownEnd returns null when empty', () => {
    expect(readHoldCountdownEnd()).toBeNull()
  })

  it('readHoldCountdownEnd returns null for invalid JSON', () => {
    localStorage.setItem(KEY, 'not-json')
    expect(readHoldCountdownEnd()).toBeNull()
  })

  it('readHoldCountdownEnd returns null for wrong shape', () => {
    localStorage.setItem(KEY, JSON.stringify({ v: 2, userId: 1, endMs: 1 }))
    expect(readHoldCountdownEnd()).toBeNull()
    localStorage.setItem(KEY, JSON.stringify({ v: 1, userId: 'x', endMs: 1 }))
    expect(readHoldCountdownEnd()).toBeNull()
    localStorage.setItem(KEY, JSON.stringify({ v: 1, userId: 1, endMs: Number.NaN }))
    expect(readHoldCountdownEnd()).toBeNull()
  })

  it('swallows localStorage errors on persist', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => persistHoldCountdownEnd(1, 100)).not.toThrow()
  })

  it('swallows localStorage errors on clear', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => clearHoldCountdownEnd()).not.toThrow()
  })
})
