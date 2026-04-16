import type { CartLineItem, CartSummaryLine, CartSummaryTotal } from '@/types/cart'

export interface BuildCartSummaryOptions {
  guestCount?: number
}

export const buildCartSummaryFromItems = (
  items: CartLineItem[],
  options?: BuildCartSummaryOptions,
): { lines: CartSummaryLine[]; total: CartSummaryTotal } => {
  const currency = items[0]?.price.currency ?? 'COP'

  if (items.length === 0) {
    return {
      lines: [],
      total: { amount: 0, currency },
    }
  }

  const stayTotal = items.reduce((sum, item) => sum + item.breakdown.stayBase, 0)
  const chargesTotal = items.reduce((sum, item) => sum + item.breakdown.charges, 0)
  const taxesTotal = items.reduce((sum, item) => sum + item.breakdown.taxes, 0)
  const insuranceTotal = items.reduce((sum, item) => sum + item.breakdown.insurance, 0)
  const discountTotal = items.reduce((sum, item) => sum + item.breakdown.discount, 0)

  const guestCount = options?.guestCount
  const firstLine: CartSummaryLine =
    guestCount != null
      ? {
          id: 'summary-guests',
          kind: 'accommodationForGuests',
          labelParams: { count: guestCount },
          amount: stayTotal,
        }
      : items.length === 1
        ? {
            id: 'summary-product',
            kind: 'productName',
            labelParams: { name: items[0].name },
            amount: stayTotal,
          }
        : {
            id: 'summary-products',
            kind: 'productsCount',
            labelParams: { count: items.length },
            amount: stayTotal,
          }

  const extraLines: CartSummaryLine[] = [
    { id: 'summary-charges', kind: 'charges', amount: chargesTotal },
    { id: 'summary-taxes', kind: 'taxes', amount: taxesTotal },
    { id: 'summary-insurance', kind: 'insurance', amount: insuranceTotal },
    {
      id: 'summary-discounts',
      kind: 'discounts',
      amount: -discountTotal,
      variant: 'discount',
    },
  ]

  const lines: CartSummaryLine[] = [
    firstLine,
    ...extraLines.filter((l) => l.amount !== 0),
  ]

  const totalAmount = items.reduce((sum, item) => sum + item.price.amount, 0)

  return {
    lines,
    total: { amount: totalAmount, currency },
  }
}
