import { describe, expect, it } from 'vitest'
import { formatPriceInputDisplay, priceInputDigitsOnly } from '@/utils/priceInput'

describe('priceInput', () => {
  it('strips non-digits', () => {
    expect(priceInputDigitsOnly('4.000')).toBe('4000')
    expect(priceInputDigitsOnly('abc12x3')).toBe('123')
  })

  it('formats thousands for es-CO display', () => {
    expect(formatPriceInputDisplay('4000')).toBe('4.000')
    expect(formatPriceInputDisplay('400000')).toBe('400.000')
    expect(formatPriceInputDisplay('')).toBe('')
  })
})
