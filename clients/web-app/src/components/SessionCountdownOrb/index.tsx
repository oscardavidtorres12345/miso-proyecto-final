import { useSessionCountdown } from '@/context/SessionCountdownContext'
import {
  SESSION_COUNTDOWN_PULSE_AT_OR_BELOW_MS,
  SESSION_COUNTDOWN_RED_BELOW_MS,
} from '@/utils/sessionCountdown'
import { cn } from '@/lib/utils'
import './SessionCountdownOrb.css'

const formatMmSs = (totalMs: number) => {
  const s = Math.max(0, Math.ceil(totalMs / 1000))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

const SessionCountdownOrb = () => {
  const { isRunning, remainingMs } = useSessionCountdown()

  if (!isRunning || remainingMs <= 0) return null

  const isUrgent = remainingMs < SESSION_COUNTDOWN_RED_BELOW_MS
  const isPulse = remainingMs <= SESSION_COUNTDOWN_PULSE_AT_OR_BELOW_MS

  return (
    <div
      className={cn(
        'session-countdown-orb',
        isUrgent && 'session-countdown-orb--urgent',
        isPulse && 'session-countdown-orb--pulse',
      )}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={formatMmSs(remainingMs)}
    >
      <span className="session-countdown-orb__disk" aria-hidden />
      <span className="session-countdown-orb__label">{formatMmSs(remainingMs)}</span>
    </div>
  )
}

export default SessionCountdownOrb
