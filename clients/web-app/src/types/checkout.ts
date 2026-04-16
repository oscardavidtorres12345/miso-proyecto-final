import type { CartLineItem } from '@/types/cart'

export type CheckoutPaymentCurrency = 'COP' | 'USD' | 'ARS'

export interface CheckoutPageDto {
  holder: {
    firstName: string
    lastName: string
  }
  email: string
  paymentCurrency: CheckoutPaymentCurrency
  guestCount: number
  cartLineItems: CartLineItem[]
}
