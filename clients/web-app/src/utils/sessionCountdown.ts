import {
  SESSION_COUNTDOWN_DURATION_MINUTES,
  SESSION_COUNTDOWN_PULSE_LAST_SECONDS,
  SESSION_COUNTDOWN_RED_BELOW_MINUTES,
} from '@/constants/app'

const MS_PER_MINUTE = 60_000
const MS_PER_SECOND = 1_000

export const SESSION_COUNTDOWN_DURATION_MS = SESSION_COUNTDOWN_DURATION_MINUTES * MS_PER_MINUTE
export const SESSION_COUNTDOWN_RED_BELOW_MS = SESSION_COUNTDOWN_RED_BELOW_MINUTES * MS_PER_MINUTE
export const SESSION_COUNTDOWN_PULSE_AT_OR_BELOW_MS =
  SESSION_COUNTDOWN_PULSE_LAST_SECONDS * MS_PER_SECOND

const COUNTDOWN_TRUST_MAX_MS = SESSION_COUNTDOWN_DURATION_MS + 10 * MS_PER_MINUTE
const UNIX_MS_MIN = 10_000_000_000

function toEpochMs(value: string | number | Date): number | null {
  if (value instanceof Date) {
    const t = value.getTime()
    return Number.isFinite(t) ? t : null
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    const ms = value < UNIX_MS_MIN ? value * MS_PER_SECOND : value
    return Number.isFinite(ms) ? ms : null
  }
  const s = String(value).trim()
  if (!s) return null
  if (/^\d+$/.test(s)) {
    const n = Number(s)
    return toEpochMs(n)
  }
  const parsed = Date.parse(s)
  return Number.isFinite(parsed) ? parsed : null
}

export function resolveCountdownEndMs(
  endsAt: string | number | Date | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  if (endsAt == null) return null
  const candidate = toEpochMs(endsAt)
  if (candidate == null || candidate <= nowMs) return null
  if (candidate - nowMs > COUNTDOWN_TRUST_MAX_MS) {
    return nowMs + SESSION_COUNTDOWN_DURATION_MS
  }
  return candidate
}
