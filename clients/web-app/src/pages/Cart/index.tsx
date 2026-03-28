import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CartItemCard from '@/components/CartItemCard'
import CartSummary from '@/components/CartSummary'
import Container from '@/components/Container'
import { MOCK_CART_ITEMS } from '@/mocks/cart'
import type { CartLineItem } from '@/types/cart'
import { buildCartSummaryFromItems } from '@/utils/cartSummary'
import './Cart.css'

const MOBILE_SHEET_MQ = '(max-width: 650px)'
const CART_HEADER_PX = 64
const CART_MAIN_PADDING_TOP_PX = 24
const CART_TITLE_MARGIN_BOTTOM_PX = 24

const Cart = () => {
  const { t } = useTranslation()
  const [items, setItems] = useState<CartLineItem[]>(() => [...MOCK_CART_ITEMS])
  const mainRef = useRef<HTMLElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const itemsColumnRef = useRef<HTMLDivElement>(null)

  const summary = useMemo(() => buildCartSummaryFromItems(items), [items])

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((line) => line.id !== id))
  }, [])

  useLayoutEffect(() => {
    const main = mainRef.current
    const sidebar = sidebarRef.current
    const titleEl = titleRef.current
    const itemsEl = itemsColumnRef.current
    if (!main || !sidebar || !titleEl || !itemsEl) return

    const mq = window.matchMedia(MOBILE_SHEET_MQ)

    const syncBottomInset = () => {
      if (!mq.matches) {
        main.style.removeProperty('--cart-bottom-inset')
        return
      }

      const sheetH = sidebar.offsetHeight
      const vh = window.visualViewport?.height ?? window.innerHeight
      const spaceAboveSheet = vh - CART_HEADER_PX - sheetH

      const blockHeight =
        CART_MAIN_PADDING_TOP_PX +
        titleEl.offsetHeight +
        CART_TITLE_MARGIN_BOTTOM_PX +
        itemsEl.offsetHeight

      if (blockHeight <= spaceAboveSheet) {
        main.style.setProperty('--cart-bottom-inset', '0px')
      } else {
        main.style.setProperty('--cart-bottom-inset', `${sheetH}px`)
      }
    }

    const schedule = () => requestAnimationFrame(syncBottomInset)

    const ro = new ResizeObserver(schedule)
    ro.observe(sidebar)
    ro.observe(itemsEl)
    ro.observe(titleEl)
    mq.addEventListener('change', schedule)
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    schedule()

    return () => {
      ro.disconnect()
      mq.removeEventListener('change', schedule)
      window.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
      main.style.removeProperty('--cart-bottom-inset')
    }
  }, [items])

  return (
    <main ref={mainRef} className="cart-page">
      <Container>
        <h1 ref={titleRef} className="cart-page__title">
          {t('cart.title')}
        </h1>
        <div className="cart-page__layout">
          <div ref={itemsColumnRef} className="cart-page__items">
            <ul className="cart-page__list">
              {items.map((item) => (
                <li key={item.id} className="cart-page__list-item">
                  <CartItemCard item={item} onRemove={handleRemove} />
                </li>
              ))}
            </ul>
          </div>
          <aside
            ref={sidebarRef}
            className="cart-page__sidebar cart-page__sidebar--bottom-sheet-host"
            aria-label={t('cart.summaryTitle')}
          >
            <div className="cart-page__summary-card">
              <CartSummary lines={summary.lines} total={summary.total} />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  )
}

export default Cart
