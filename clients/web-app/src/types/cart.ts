export interface CartLineItemPrice {
  amount: number
  currency: string
}

export interface CartLineItemBreakdown {
  stayBase: number
  charges: number
  taxes: number
  insurance: number
  discount: number
}

export interface CartLineItem {
  id: string
  name: string
  image: string
  price: CartLineItemPrice
  breakdown: CartLineItemBreakdown
}

export type CartSummaryLineKind =
  | 'productName'
  | 'productsCount'
  | 'charges'
  | 'taxes'
  | 'insurance'
  | 'discounts'

export interface CartSummaryLine {
  id: string
  kind: CartSummaryLineKind
  labelParams?: Record<string, string | number>
  amount: number
  variant?: 'discount'
}

export interface CartSummaryTotal {
  amount: number
  currency: string
}
