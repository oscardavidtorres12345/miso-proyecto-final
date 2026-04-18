import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchBookingPaymentSummary, mapPaymentSummaryToLinePatch } from '@/services/bookingService'
import type { CartLineItem } from '@/types/cart'

export const useEnrichedCartItems = (items: CartLineItem[]): CartLineItem[] => {
  const [patchById, setPatchById] = useState<
    Record<string, Pick<CartLineItem, 'price' | 'breakdown'>>
  >({})

  const idsKey = useMemo(() => items.map((i) => i.id).sort().join('\0'), [items])
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    const currentItems = itemsRef.current
    if (currentItems.length === 0) {
      setPatchById({})
      return
    }

    let cancelled = false

    void Promise.all(
      currentItems.map(async (item) => {
        const data = await fetchBookingPaymentSummary(item.id)
        if (!data) return null
        return [item.id, mapPaymentSummaryToLinePatch(data)] as const
      }),
    ).then((results) => {
      if (cancelled) return
      const next: Record<string, Pick<CartLineItem, 'price' | 'breakdown'>> = {}
      for (const r of results) {
        if (r) next[r[0]] = r[1]
      }
      setPatchById(next)
    })

    return () => {
      cancelled = true
    }
  }, [idsKey])

  return useMemo(
    () =>
      items.map((item) => {
        const p = patchById[item.id]
        if (!p) return item
        return { ...item, ...p }
      }),
    [items, patchById],
  )
}
