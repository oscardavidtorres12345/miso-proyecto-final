import { render } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import Background from '@/components/Background'

describe('Background', () => {
  const OriginalResizeObserver = globalThis.ResizeObserver

  afterEach(() => {
    globalThis.ResizeObserver = OriginalResizeObserver
    vi.restoreAllMocks()
  })

  it('renders decorative root with aria-hidden', () => {
    globalThis.ResizeObserver = class {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor() {}
    } as unknown as typeof ResizeObserver

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 800,
      writable: true,
    })

    const { container } = render(<Background />)
    const root = container.querySelector('.background')
    expect(root).toBeInTheDocument()
    expect(root).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders ellipses based on document scroll height', () => {
    globalThis.ResizeObserver = class {
      observe = vi.fn()
      disconnect = vi.fn()
      constructor() {}
    } as unknown as typeof ResizeObserver

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2500,
      writable: true,
    })

    const { container } = render(<Background />)
    const ellipses = container.querySelectorAll('.background__ellipse')
    expect(ellipses.length).toBe(Math.ceil(2500 / 1000) + 1)
  })
})
