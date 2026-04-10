import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SessionCountdownOrb from '@/components/SessionCountdownOrb'
import {
  SESSION_COUNTDOWN_PULSE_AT_OR_BELOW_MS,
  SESSION_COUNTDOWN_RED_BELOW_MS,
} from '@/utils/sessionCountdown'

const sessionCtx = vi.hoisted(() => ({
  isRunning: false,
  remainingMs: 0,
  start: vi.fn(),
  stop: vi.fn(),
  subscribeHoldExpired: vi.fn(() => vi.fn()),
}))

vi.mock('@/context/SessionCountdownContext', () => ({
  useSessionCountdown: () => sessionCtx,
}))

describe('SessionCountdownOrb', () => {
  beforeEach(() => {
    sessionCtx.isRunning = false
    sessionCtx.remainingMs = 0
    sessionCtx.start.mockClear()
    sessionCtx.stop.mockClear()
  })

  it('renders nothing when not running', () => {
    const { container } = render(<SessionCountdownOrb />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when remaining time is zero', () => {
    sessionCtx.isRunning = true
    sessionCtx.remainingMs = 0
    const { container } = render(<SessionCountdownOrb />)
    expect(container.firstChild).toBeNull()
  })

  it('renders timer with role and formatted label when running', () => {
    sessionCtx.isRunning = true
    sessionCtx.remainingMs = 125_000
    render(<SessionCountdownOrb />)
    const timer = screen.getByRole('timer')
    expect(timer).toHaveAttribute('aria-label', '02:05')
    expect(timer.querySelector('.session-countdown-orb__label')).toHaveTextContent('02:05')
  })

  it('adds urgent modifier at or below red threshold', () => {
    sessionCtx.isRunning = true
    sessionCtx.remainingMs = SESSION_COUNTDOWN_RED_BELOW_MS
    const { container } = render(<SessionCountdownOrb />)
    expect(container.querySelector('.session-countdown-orb--urgent')).toBeInTheDocument()
  })

  it('adds pulse modifier at or below pulse threshold', () => {
    sessionCtx.isRunning = true
    sessionCtx.remainingMs = SESSION_COUNTDOWN_PULSE_AT_OR_BELOW_MS
    const { container } = render(<SessionCountdownOrb />)
    expect(container.querySelector('.session-countdown-orb--pulse')).toBeInTheDocument()
  })
})
