import { describe, it, expect } from 'vitest'
import { buildCartSummaryFromItems } from '@/utils/cartSummary'
import type { CartLineItem } from '@/types/cart'

const line = (overrides: Partial<CartLineItem> & Pick<CartLineItem, 'id' | 'name'>): CartLineItem => ({
  image: 'https://example.com/i.jpg',
  price: { amount: 100_000, currency: 'USD' },
  breakdown: {
    stayBase: 70_000,
    charges: 10_000,
    taxes: 15_000,
    insurance: 5_000,
    discount: 3_000,
  },
  ...overrides,
})

describe('buildCartSummaryFromItems', () => {
  it('returns empty lines and zero total when there are no items', () => {
    const { lines, total } = buildCartSummaryFromItems([])
    expect(lines).toEqual([])
    expect(total).toEqual({ amount: 0, currency: 'COP' })
  })

  it('uses productName line for a single item', () => {
    const items = [line({ id: 'a', name: 'Hotel X', price: { amount: 50_000, currency: 'COP' } })]
    const { lines, total } = buildCartSummaryFromItems(items)
    expect(lines[0]).toMatchObject({
      kind: 'productName',
      labelParams: { name: 'Hotel X' },
      amount: 70_000,
    })
    expect(total).toEqual({ amount: 50_000, currency: 'COP' })
  })

  it('uses productsCount line for multiple items', () => {
    const items = [
      line({ id: '1', name: 'A', price: { amount: 10_000, currency: 'EUR' } }),
      line({ id: '2', name: 'B', price: { amount: 20_000, currency: 'EUR' } }),
    ]
    const { lines, total } = buildCartSummaryFromItems(items)
    expect(lines[0]).toMatchObject({
      kind: 'productsCount',
      labelParams: { count: 2 },
      amount: 140_000,
    })
    expect(lines[lines.length - 1]).toMatchObject({
      kind: 'discounts',
      amount: -6_000,
      variant: 'discount',
    })
    expect(total).toEqual({ amount: 30_000, currency: 'EUR' })
  })

  it('aggregates breakdown totals across items', () => {
    const items = [
      line({
        id: '1',
        name: 'A',
        breakdown: { stayBase: 10, charges: 1, taxes: 2, insurance: 3, discount: 4 },
      }),
      line({
        id: '2',
        name: 'B',
        breakdown: { stayBase: 20, charges: 2, taxes: 3, insurance: 4, discount: 5 },
      }),
    ]
    const { lines } = buildCartSummaryFromItems(items)
    expect(lines.find((l) => l.kind === 'charges')).toMatchObject({ amount: 3 })
    expect(lines.find((l) => l.kind === 'taxes')).toMatchObject({ amount: 5 })
    expect(lines.find((l) => l.kind === 'insurance')).toMatchObject({ amount: 7 })
    expect(lines.find((l) => l.kind === 'discounts')).toMatchObject({ amount: -9 })
  })

  it('uses accommodationForGuests line when guestCount option is set', () => {
    const items = [line({ id: 'a', name: 'Hotel X', price: { amount: 50_000, currency: 'COP' } })]
    const { lines, total } = buildCartSummaryFromItems(items, { guestCount: 2 })
    expect(lines[0]).toMatchObject({
      kind: 'accommodationForGuests',
      labelParams: { count: 2 },
      amount: 70_000,
    })
    expect(total).toEqual({ amount: 50_000, currency: 'COP' })
  })

  it('omits charges, taxes, insurance and discounts when all are zero', () => {
    const items = [
      line({
        id: 'a',
        name: 'Hotel Z',
        price: { amount: 99_000, currency: 'COP' },
        breakdown: { stayBase: 99_000, charges: 0, taxes: 0, insurance: 0, discount: 0 },
      }),
    ]
    const { lines } = buildCartSummaryFromItems(items)
    expect(lines).toHaveLength(1)
    expect(lines[0].kind).toBe('productName')
  })
})
