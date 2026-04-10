import { describe, it, expect } from 'vitest'
import {
  resolveCountdownEndMs,
  SESSION_COUNTDOWN_DURATION_MS,
  SESSION_COUNTDOWN_PULSE_AT_OR_BELOW_MS,
  SESSION_COUNTDOWN_RED_BELOW_MS,
} from '@/utils/sessionCountdown'

describe('sessionCountdown derived constants', () => {
  it('exposes duration in milliseconds (15 minutes)', () => {
    expect(SESSION_COUNTDOWN_DURATION_MS).toBe(15 * 60_000)
  })

  it('exposes red threshold in milliseconds (1 minute)', () => {
    expect(SESSION_COUNTDOWN_RED_BELOW_MS).toBe(1 * 60_000)
  })

  it('exposes pulse window in milliseconds (15 seconds)', () => {
    expect(SESSION_COUNTDOWN_PULSE_AT_OR_BELOW_MS).toBe(15 * 1000)
  })
})

describe('resolveCountdownEndMs', () => {
  it('returns null for nullish input', () => {
    expect(resolveCountdownEndMs(undefined, 1_000)).toBeNull()
    expect(resolveCountdownEndMs(null, 1_000)).toBeNull()
  })

  it('interprets small numeric values as Unix seconds', () => {
    const now = 1_700_000_000_000
    const sec = 1_700_000_900
    expect(resolveCountdownEndMs(sec, now)).toBe(sec * 1000)
  })

  it('caps far-future expires to default duration from now', () => {
    const now = 1_700_000_000_000
    const far = now + 400 * 60_000
    expect(resolveCountdownEndMs(far, now)).toBe(now + SESSION_COUNTDOWN_DURATION_MS)
  })

  it('keeps near-term ISO strings', () => {
    const now = Date.parse('2026-04-09T12:00:00.000Z')
    const iso = '2026-04-09T12:10:00.000Z'
    expect(resolveCountdownEndMs(iso, now)).toBe(Date.parse(iso))
  })

  it('accepts a future Date instance', () => {
    const now = 1_700_000_000_000
    const end = new Date(now + 30_000)
    expect(resolveCountdownEndMs(end, now)).toBe(end.getTime())
  })

  it('returns null for past or non-finite end times', () => {
    const now = 1_700_000_000_000
    expect(resolveCountdownEndMs(new Date(now - 1), now)).toBeNull()
    expect(resolveCountdownEndMs(new Date(Number.NaN), now)).toBeNull()
    expect(resolveCountdownEndMs(Number.POSITIVE_INFINITY, now)).toBeNull()
    expect(resolveCountdownEndMs('   ', now)).toBeNull()
    expect(resolveCountdownEndMs('not-a-date', now)).toBeNull()
  })

  it('parses digit-only strings as Unix millisecond timestamps', () => {
    const now = 1_700_000_000_000
    const ms = String(now + 60_000)
    expect(resolveCountdownEndMs(ms, now)).toBe(now + 60_000)
  })
})
