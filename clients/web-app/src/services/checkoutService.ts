import {
  fetchBookingPaymentSummary,
  type PaymentSummaryResponseDto,
  type PaymentSummaryUserDto,
} from '@/services/bookingService'
import type { CartLineItem } from '@/types/cart'
import type { CheckoutPageDto } from '@/types/checkout'

type FetchCheckoutPageInput = {
  bookingIds: string[]
  user: {
    username: string
    email: string
  } | null
  fallbackLineItems?: CartLineItem[]
}

function pickPaymentSummaryUser(
  summaries: PaymentSummaryResponseDto[],
): PaymentSummaryUserDto | null {
  for (const s of summaries) {
    const u = s.user
    if (!u) continue
    if (u.first_name?.trim() || u.last_name?.trim() || u.email?.trim()) {
      return u
    }
  }
  return null
}

function resolveHolderAndEmail(
  fromApi: PaymentSummaryUserDto | null,
  sessionUser: FetchCheckoutPageInput['user'],
): { firstName: string; lastName: string; email: string } {
  const username = sessionUser?.username?.trim() ?? ''
  const [fromSessionFirst = '', ...rest] = username.split(/\s+/)
  const fromSessionLast = rest.join(' ')

  const firstName = (fromApi?.first_name?.trim() || fromSessionFirst) || ''
  const lastName = (fromApi?.last_name?.trim() || fromSessionLast) || ''
  const email = fromApi?.email?.trim() || sessionUser?.email?.trim() || ''

  return { firstName, lastName, email }
}

function buildCheckoutLineItem(
  bookingId: string,
  summary: PaymentSummaryResponseDto,
  fallback?: CartLineItem,
): CartLineItem {
  if (fallback) {
    return {
      ...fallback,
      price: {
        amount: summary.payment_summary.total,
        currency: summary.payment_summary.currency,
      },
      breakdown: {
        stayBase: summary.payment_summary.accommodation,
        charges: summary.payment_summary.fees,
        taxes: summary.payment_summary.taxes,
        insurance: summary.payment_summary.insurance,
        discount: Math.abs(summary.payment_summary.discount),
      },
    }
  }

  return {
    id: bookingId,
    name: `Reserva ${bookingId}`,
    image: '',
    price: {
      amount: summary.payment_summary.total,
      currency: summary.payment_summary.currency,
    },
    breakdown: {
      stayBase: summary.payment_summary.accommodation,
      charges: summary.payment_summary.fees,
      taxes: summary.payment_summary.taxes,
      insurance: summary.payment_summary.insurance,
      discount: Math.abs(summary.payment_summary.discount),
    },
  }
}

export async function fetchCheckoutPage({
  bookingIds,
  user,
  fallbackLineItems = [],
}: FetchCheckoutPageInput): Promise<CheckoutPageDto> {
  const summaries = await Promise.all(
    bookingIds.map(async (bookingId) => ({
      bookingId,
      summary: await fetchBookingPaymentSummary(bookingId),
    })),
  )

  const lineItems: CartLineItem[] = summaries
    .filter(
      (
        row,
      ): row is {
        bookingId: string
        summary: PaymentSummaryResponseDto
      } => row.summary !== null,
    )
    .map(({ bookingId, summary }) => {
      const fallbackLineItem = fallbackLineItems.find((item) => item.id === bookingId)
      return buildCheckoutLineItem(bookingId, summary, fallbackLineItem)
    })

  if (lineItems.length === 0) {
    throw new Error('Payment summary unavailable')
  }

  const validSummaries = summaries
    .map((r) => r.summary)
    .filter((s): s is PaymentSummaryResponseDto => s !== null)
  const apiUser = pickPaymentSummaryUser(validSummaries)
  const { firstName, lastName, email } = resolveHolderAndEmail(apiUser, user)

  const currency = lineItems[0].price.currency as CheckoutPageDto['paymentCurrency']

  return {
    holder: {
      firstName,
      lastName,
    },
    email,
    paymentCurrency: ['COP', 'USD', 'ARS'].includes(currency) ? currency : 'COP',
    cartLineItems: lineItems,
  }
}
