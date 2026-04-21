import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/utils/currency'

describe('formatCurrency', () => {
  it('formats USD amount', () => {
    expect(formatCurrency(150, 'USD')).toBe('$150.00')
  })

  it('formats zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })

  it('formats COP amount', () => {
    const result = formatCurrency(200000, 'COP')
    expect(result).toContain('200,000')
  })

  it('formats decimal amounts', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('$99.99')
  })
})
