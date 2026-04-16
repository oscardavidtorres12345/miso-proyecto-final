import type { CheckoutPageDto } from '@/types/checkout'

export const MOCK_CHECKOUT_PAGE: CheckoutPageDto = {
  holder: {
    firstName: 'Jhon',
    lastName: 'Doe',
  },
  email: 'email@mail.com',
  paymentCurrency: 'COP',
  guestCount: 2,
  cartLineItems: [
    {
      id: 'checkout-1',
      name: 'Aonang Villa Resort',
      image: 'https://picsum.photos/seed/checkout1/600/400',
      price: { amount: 5000000, currency: 'COP' },
      breakdown: {
        stayBase: 3500000,
        charges: 500000,
        taxes: 1500000,
        insurance: 200000,
        discount: 700000,
      },
    },
  ],
}
