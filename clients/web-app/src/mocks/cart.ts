import type { CartLineItem } from '@/types/cart'

export const MOCK_CART_ITEMS: CartLineItem[] = [
  {
    id: 'cart-1',
    name: 'Aonang Villa Resort',
    image: 'https://picsum.photos/seed/hotel1/600/400',
    price: { amount: 5000000, currency: 'COP' },
    breakdown: {
      stayBase: 3500000,
      charges: 500000,
      taxes: 1500000,
      insurance: 200000,
      discount: 700000,
    },
  },
  {
    id: 'cart-2',
    name: 'Hotel Cartagena Plaza',
    image: 'https://picsum.photos/seed/hotel2/600/400',
    price: { amount: 8200000, currency: 'COP' },
    breakdown: {
      stayBase: 5740000,
      charges: 820000,
      taxes: 2460000,
      insurance: 330000,
      discount: 1150000,
    },
  },
]
