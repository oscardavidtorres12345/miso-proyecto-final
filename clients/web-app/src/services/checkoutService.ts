import { MOCK_CHECKOUT_PAGE } from '@/mocks/checkout'
import type { CheckoutPageDto } from '@/types/checkout'

const MOCK_DELAY_MS = 350

export async function fetchCheckoutPage(): Promise<CheckoutPageDto> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS))
  return {
    ...MOCK_CHECKOUT_PAGE,
    holder: { ...MOCK_CHECKOUT_PAGE.holder },
    cartLineItems: MOCK_CHECKOUT_PAGE.cartLineItems.map((item) => ({
      ...item,
      price: { ...item.price },
      breakdown: { ...item.breakdown },
    })),
  }
}
