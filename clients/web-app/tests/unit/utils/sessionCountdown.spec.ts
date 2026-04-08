import { describe, it, expect } from 'vitest'
import {
  SESSION_COUNTDOWN_DURATION_MS,
  SESSION_COUNTDOWN_PULSE_AT_OR_BELOW_MS,
  SESSION_COUNTDOWN_RED_BELOW_MS,
} from '@/utils/sessionCountdown'

describe('sessionCountdown derived constants', () => {
  it('exposes duration in milliseconds (5 minutes)', () => {
    expect(SESSION_COUNTDOWN_DURATION_MS).toBe(5 * 60_000)
  })

  it('exposes red threshold in milliseconds (4 minutes)', () => {
    expect(SESSION_COUNTDOWN_RED_BELOW_MS).toBe(4 * 60_000)
  })

  it('exposes pulse window in milliseconds (5 seconds)', () => {
    expect(SESSION_COUNTDOWN_PULSE_AT_OR_BELOW_MS).toBe(5 * 1000)
  })
})
