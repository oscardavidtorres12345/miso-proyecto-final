import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import Snackbar from '@/components/Snackbar'

describe('Snackbar', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls onClose after duration', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Snackbar show message="Hola" variant="success" onClose={onClose} />)

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not reset the timer when onClose identity changes between rerenders', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const { rerender } = render(
      <Snackbar show message="Hola" variant="success" onClose={() => onClose()} />,
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    rerender(<Snackbar show message="Hola" variant="success" onClose={() => onClose()} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the user clicks the close button', () => {
    const onClose = vi.fn()
    render(<Snackbar show message="Err" variant="error" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
