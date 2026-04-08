import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from '@/components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders status region', () => {
    render(<LoadingSpinner />)
    const el = document.querySelector('.loading-spinner')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('role', 'status')
    expect(el).toHaveAttribute('aria-live', 'polite')
  })

  it('renders decorative ring', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('.loading-spinner__ring')).toBeInTheDocument()
  })

  it('merges className', () => {
    const { container } = render(<LoadingSpinner className="mx-auto" />)
    expect(container.firstChild).toHaveClass('loading-spinner', 'mx-auto')
  })
})
