import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import CartSummary from '@/components/CartSummary'
import Container from '@/components/Container'
import Input from '@/components/Input'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useSessionCountdown } from '@/context/SessionCountdownContext'
import { cancelBooking, getBookingBatch } from '@/services/bookingService'
import { fetchCheckoutPage } from '@/services/checkoutService'
import type { CartLineItem } from '@/types/cart'
import type { CheckoutPageDto, CheckoutPaymentCurrency } from '@/types/checkout'
import { buildCartSummaryFromItems } from '@/utils/cartSummary'
import { formatPrice } from '@/utils/accommodation'
import { isValidEmail, validateEmailKey } from '@/utils/emailValidation'
import './Checkout.css'

const MQ_MOBILE_PAY_BAR = '(max-width: 650px)'
const MQ_TABLET_CHECKOUT_HOST = '(min-width: 651px) and (max-width: 1023px)'
const MQ_CHECKOUT_FIXED_CHROME = '(max-width: 1023px)'
const MQ_CURRENCY_BOTTOM_SHEET = '(max-width: 1023px)'

const CHECKOUT_HEADER_PX = 64
const CHECKOUT_MAIN_PADDING_TOP_PX = 24
const CHECKOUT_TITLE_MARGIN_BOTTOM_PX = 24

const subscribeMq =
  (query: string) =>
  (onStoreChange: () => void): (() => void) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', onStoreChange)
    return () => mq.removeEventListener('change', onStoreChange)
  }

const snapshotMq = (query: string) => () => window.matchMedia(query).matches

const useMatchMedia = (query: string) =>
  useSyncExternalStore(subscribeMq(query), snapshotMq(query), () => false)

let activeCheckoutDomInstances = 0
const shouldSkipSelectAbandonCleanup = ({
  isSelect,
  leavingToPayment,
}: {
  isSelect: boolean
  leavingToPayment: boolean
}) => !isSelect || leavingToPayment

const runSelectAbandonCleanup = ({
  bookingIds,
  hasCartItems,
  stopCountdown,
}: {
  bookingIds: string[]
  hasCartItems: boolean
  stopCountdown: () => void
}) => {
  for (const id of bookingIds) {
    void cancelBooking(id).catch(() => {})
  }
  if (!hasCartItems) {
    stopCountdown()
  }
}

const Checkout = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { session } = useAuth()
  const { items } = useCart()
  const cartItemCountRef = useRef(0)
  cartItemCountRef.current = items.length
  const { stop: stopCountdown } = useSessionCountdown()
  const stopCountdownRef = useRef(stopCountdown)
  stopCountdownRef.current = stopCountdown
  const leavingToPaymentRef = useRef(false)
  const selectAbandonRef = useRef({ isSelect: false, bookingIds: [] as string[] })
  const checkoutBookingId = searchParams.get('bookingId')?.trim() ?? ''
  const checkoutEntry = searchParams.get('entry')?.trim() ?? ''
  const [bookingIds, setBookingIds] = useState<string[]>([])
  const [activeBookingId, setActiveBookingId] = useState('')
  const [bookingIdsResolved, setBookingIdsResolved] = useState(false)
  const [page, setPage] = useState<CheckoutPageDto | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false)
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false)
  const currencyDropdownRef = useRef<HTMLDivElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [paymentCurrency, setPaymentCurrency] = useState<CheckoutPaymentCurrency>('COP')
  const [emailTouched, setEmailTouched] = useState(false)

  const locationFallbackLineItems = useMemo(() => {
    const state = location.state as { checkoutFallbackLineItems?: CartLineItem[] } | null
    if (!state?.checkoutFallbackLineItems) return []
    return state.checkoutFallbackLineItems
  }, [location.state])

  const mainRef = useRef<HTMLElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const mobileStripRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const mainColumnRef = useRef<HTMLDivElement>(null)

  const isMobilePayBar = useMatchMedia(MQ_MOBILE_PAY_BAR)
  const isTabletCheckoutHost = useMatchMedia(MQ_TABLET_CHECKOUT_HOST)
  const isCurrencyBottomSheet = useMatchMedia(MQ_CURRENCY_BOTTOM_SHEET)
  const fallbackLineItems = useMemo(() => {
    const fromCart = items.filter((item) => bookingIds.includes(item.id))
    const fromLocation = locationFallbackLineItems.filter((item) => bookingIds.includes(item.id))
    const byId = new Map<string, CartLineItem>()
    for (const item of [...fromCart, ...fromLocation]) {
      byId.set(item.id, item)
    }
    return bookingIds.map((id) => byId.get(id)).filter((x): x is CartLineItem => x != null)
  }, [items, bookingIds, locationFallbackLineItems])

  useEffect(() => {
    let cancelled = false

    const resolveBookingIds = async () => {
      if (!checkoutBookingId) throw new Error('Missing checkout bookingId')

      try {
        const batch = await getBookingBatch(checkoutBookingId)
        if (!cancelled) {
          setBookingIds(batch.booking_ids ?? [])
          setActiveBookingId(checkoutBookingId)
          setBookingIdsResolved(true)
        }
      } catch {
        if (!cancelled) {
          setBookingIds([])
          setActiveBookingId('')
          setBookingIdsResolved(true)
          setLoadState('error')
        }
      }
    }

    setBookingIdsResolved(false)
    setLoadState('loading')
    void resolveBookingIds()

    return () => {
      cancelled = true
    }
  }, [checkoutBookingId])

  useEffect(() => {
    selectAbandonRef.current = {
      isSelect: checkoutEntry === 'select' && bookingIds.length > 0,
      bookingIds,
    }
  }, [bookingIds, checkoutEntry])

  useEffect(() => {
    activeCheckoutDomInstances += 1
    return () => {
      activeCheckoutDomInstances -= 1
      const { isSelect, bookingIds: idsToCancel } = selectAbandonRef.current
      if (
        shouldSkipSelectAbandonCleanup({
          isSelect,
          leavingToPayment: leavingToPaymentRef.current,
        })
      ) {
        return
      }
      const snapshot = [...idsToCancel]
      queueMicrotask(() => {
        if (activeCheckoutDomInstances > 0) return
        if (shouldSkipSelectAbandonCleanup({ isSelect, leavingToPayment: leavingToPaymentRef.current }))
          return
        runSelectAbandonCleanup({
          bookingIds: snapshot,
          hasCartItems: cartItemCountRef.current > 0,
          stopCountdown: stopCountdownRef.current,
        })
      })
    }
  }, [])

  useEffect(() => {
    if (!bookingIdsResolved) return
    if (bookingIds.length === 0) {
      setLoadState('error')
      return
    }

    let cancelled = false
    void fetchCheckoutPage({
      bookingIds,
      displayCurrency: paymentCurrency,
      chargeCurrency: paymentCurrency,
      user: session?.user
        ? {
            username: session.user.username,
            email: session.user.email,
          }
        : null,
      fallbackLineItems,
    })
      .then((data) => {
        if (!cancelled) {
          setPage(data)
          setLoadState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [bookingIds, bookingIdsResolved, session?.user, fallbackLineItems, paymentCurrency])

  useEffect(() => {
    if (!page) return
    setFirstName(page.holder.firstName)
    setLastName(page.holder.lastName)
    setEmail(page.email)
    setPaymentCurrency(page.paymentCurrency)
    setEmailTouched(false)
    setCurrencyDropdownOpen(false)
  }, [page])

  useEffect(() => {
    if (isCurrencyBottomSheet) setCurrencyDropdownOpen(false)
  }, [isCurrencyBottomSheet])

  useEffect(() => {
    if (!currencyDropdownOpen) return
    const close = (e: MouseEvent) => {
      const el = currencyDropdownRef.current
      if (el && !el.contains(e.target as Node)) setCurrencyDropdownOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [currencyDropdownOpen])

  useEffect(() => {
    if (!currencyDropdownOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCurrencyDropdownOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currencyDropdownOpen])

  const hasItems = (page?.cartLineItems.length ?? 0) > 0

  const summary = useMemo(() => {
    if (!page || page.cartLineItems.length === 0) {
      return { lines: [], total: { amount: 0, currency: 'COP' } }
    }
    return buildCartSummaryFromItems(page.cartLineItems, { guestCount: page.guestCount })
  }, [page])

  const displayTotal = useMemo(
    () => ({ ...summary.total, currency: paymentCurrency }),
    [summary.total, paymentCurrency],
  )

  const payDisabled = useMemo(
    () =>
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !isValidEmail(email),
    [firstName, lastName, email],
  )

  const handleGoToPay = () => {
    const bookingId = activeBookingId || bookingIds[0]
    if (!bookingId) return
    leavingToPaymentRef.current = true
    const params = new URLSearchParams({
      bookingId,
      amount: String(displayTotal.amount),
      currency: displayTotal.currency,
    })
    navigate(`/checkout/payment?${params.toString()}`)
  }

  const emailErrorKey = emailTouched ? validateEmailKey(email) : null
  const emailErrorText = emailErrorKey ? t(emailErrorKey) : ''

  useLayoutEffect(() => {
    const main = mainRef.current
    const titleEl = titleRef.current
    const colEl = mainColumnRef.current
    const mq = window.matchMedia(MQ_CHECKOUT_FIXED_CHROME)
    if (!main || !titleEl || !colEl) return

    const getChrome = () =>
      window.matchMedia(MQ_MOBILE_PAY_BAR).matches ? mobileStripRef.current : sidebarRef.current

    const syncBottomInset = () => {
      if (!mq.matches || !hasItems) {
        main.style.removeProperty('--cart-bottom-inset')
        document.documentElement.style.removeProperty('--cart-sheet-height')
        return
      }

      const chrome = getChrome()
      if (!chrome) return

      const sheetH = chrome.offsetHeight
      document.documentElement.style.setProperty('--cart-sheet-height', `${sheetH}px`)

      const vh = window.visualViewport?.height ?? window.innerHeight
      const spaceAboveSheet = vh - CHECKOUT_HEADER_PX - sheetH

      const blockHeight =
        CHECKOUT_MAIN_PADDING_TOP_PX +
        titleEl.offsetHeight +
        CHECKOUT_TITLE_MARGIN_BOTTOM_PX +
        colEl.offsetHeight

      if (blockHeight <= spaceAboveSheet) {
        main.style.setProperty('--cart-bottom-inset', '0px')
      } else {
        main.style.setProperty('--cart-bottom-inset', `${sheetH}px`)
      }
    }

    const schedule = () => requestAnimationFrame(syncBottomInset)

    const ro = new ResizeObserver(schedule)
    ro.observe(colEl)
    ro.observe(titleEl)
    const chrome = getChrome()
    if (chrome) ro.observe(chrome)

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
      document.documentElement.style.removeProperty('--cart-sheet-height')
    }
  }, [page, hasItems, isMobilePayBar])

  const currencyOptions = useMemo(
    () => [
      { value: 'COP' as const, label: t('checkout.currency.optionCOP') },
      { value: 'USD' as const, label: t('checkout.currency.optionUSD') },
      { value: 'ARS' as const, label: t('checkout.currency.optionARS') },
    ],
    [t],
  )

  const selectedCurrencyLabel = useMemo(
    () => currencyOptions.find((o) => o.value === paymentCurrency)?.label ?? paymentCurrency,
    [currencyOptions, paymentCurrency],
  )

  return (
    <main ref={mainRef} className="checkout-page">
      <Container>
        <h1 ref={titleRef} className="checkout-page__title">
          {t('checkout.pageTitle')}
        </h1>

        {loadState === 'loading' && (
          <div className="checkout-page__loading">
            <LoadingSpinner />
            <p className="checkout-page__loading-text">{t('checkout.loading')}</p>
          </div>
        )}

        {loadState === 'error' && (
          <p className="checkout-page__error" role="alert">
            {t('checkout.loadError')}
          </p>
        )}

        {loadState === 'ready' && page && (
          <div className="checkout-page__layout">
            <div ref={mainColumnRef} className="checkout-page__main-col">
              {!hasItems ? (
                <p className="checkout-page__empty">{t('checkout.empty')}</p>
              ) : (
                <>
                  <section className="checkout-page__card">
                    <h2 className="checkout-page__card-title">{t('checkout.holder.title')}</h2>
                    <p className="checkout-page__card-hint">{t('checkout.holder.hint')}</p>
                    <div className="checkout-page__row">
                      <div className="checkout-page__field">
                        <label htmlFor="checkout-firstName" className="checkout-page__label">
                          {t('checkout.fields.firstName')}
                        </label>
                        <div className="input-box">
                          <Input
                            id="checkout-firstName"
                            type="text"
                            autoComplete="given-name"
                            placeholder={t('signup.firstNamePlaceholder')}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="checkout-page__input"
                          />
                        </div>
                      </div>
                      <div className="checkout-page__field">
                        <label htmlFor="checkout-lastName" className="checkout-page__label">
                          {t('checkout.fields.lastName')}
                        </label>
                        <div className="input-box">
                          <Input
                            id="checkout-lastName"
                            type="text"
                            autoComplete="family-name"
                            placeholder={t('signup.lastNamePlaceholder')}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="checkout-page__input"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="checkout-page__card">
                    <h2 className="checkout-page__card-title">{t('checkout.communication.title')}</h2>
                    <p className="checkout-page__card-hint">{t('checkout.communication.hint')}</p>
                    <div className="checkout-page__field">
                      <label htmlFor="checkout-email" className="checkout-page__label">
                        {t('checkout.fields.email')}
                      </label>
                      <Input
                        id="checkout-email"
                        type="email"
                        autoComplete="email"
                        placeholder={t('login.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        className="checkout-page__input"
                        error={!!emailErrorText}
                        errorMessage={emailErrorText}
                      />
                    </div>
                  </section>

                  <section className="checkout-page__card">
                    <h2 className="checkout-page__card-title">{t('checkout.currency.title')}</h2>
                    <p className="checkout-page__card-hint">{t('checkout.currency.hint')}</p>
                    <div className="checkout-page__field">
                      <label htmlFor="checkout-currency" className="checkout-page__label">
                        {t('checkout.currency.label')}
                      </label>
                      {isCurrencyBottomSheet ? (
                        <>
                          <button
                            type="button"
                            id="checkout-currency"
                            className="input-box checkout-page__currency-trigger"
                            aria-label={t('checkout.currency.label')}
                            aria-haspopup="dialog"
                            aria-expanded={currencySheetOpen}
                            onClick={() => setCurrencySheetOpen(true)}
                          >
                            <span className="checkout-page__currency-trigger-text">
                              {selectedCurrencyLabel}
                            </span>
                          </button>
                          <BottomSheet
                            isOpen={currencySheetOpen}
                            onClose={() => setCurrencySheetOpen(false)}
                            className="checkout-page__sheet-panel"
                          >
                            <div className="checkout-page__sheet-panel-inner">
                              <div
                                className="checkout-page__currency-sheet-list"
                                role="listbox"
                                aria-label={t('checkout.currency.label')}
                              >
                                {currencyOptions.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    role="option"
                                    aria-selected={paymentCurrency === opt.value}
                                    className={cn(
                                      'checkout-page__currency-option',
                                      paymentCurrency === opt.value &&
                                        'checkout-page__currency-option--selected',
                                    )}
                                    onClick={() => {
                                      setPaymentCurrency(opt.value)
                                      setCurrencySheetOpen(false)
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </BottomSheet>
                        </>
                      ) : (
                        <div
                          ref={currencyDropdownRef}
                          className="checkout-page__currency-dropdown"
                        >
                          <button
                            type="button"
                            id="checkout-currency"
                            className={cn(
                              'input-box checkout-page__currency-trigger',
                              currencyDropdownOpen && 'checkout-page__currency-trigger--open',
                            )}
                            aria-label={t('checkout.currency.label')}
                            aria-haspopup="listbox"
                            aria-expanded={currencyDropdownOpen}
                            aria-controls="checkout-currency-listbox"
                            onClick={() => setCurrencyDropdownOpen((o) => !o)}
                          >
                            <span className="checkout-page__currency-trigger-text">
                              {selectedCurrencyLabel}
                            </span>
                          </button>
                          {currencyDropdownOpen && (
                            <ul
                              id="checkout-currency-listbox"
                              className="checkout-page__currency-dropdown-panel"
                              role="listbox"
                              aria-label={t('checkout.currency.label')}
                            >
                              {currencyOptions.map((opt) => (
                                <li key={opt.value} role="presentation">
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={paymentCurrency === opt.value}
                                    className={cn(
                                      'checkout-page__currency-dropdown-option',
                                      paymentCurrency === opt.value &&
                                        'checkout-page__currency-dropdown-option--selected',
                                    )}
                                    onClick={() => {
                                      setPaymentCurrency(opt.value)
                                      setCurrencyDropdownOpen(false)
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>

            {!isMobilePayBar && hasItems && (
              <aside
                ref={sidebarRef}
                className={cn(
                  'checkout-page__sidebar',
                  isTabletCheckoutHost && 'checkout-page__sidebar--bottom-sheet-host',
                )}
                aria-label={t('cart.summaryTitle')}
              >
                <div className="checkout-page__summary-card">
                  <CartSummary
                    lines={summary.lines}
                    total={displayTotal}
                    payDisabled={payDisabled}
                    onGoToPay={handleGoToPay}
                  />
                </div>
              </aside>
            )}
          </div>
        )}
      </Container>

      {isMobilePayBar && loadState === 'ready' && hasItems && (
        <>
          <div ref={mobileStripRef} className="checkout-page__mobile-pay-bar">
            <button
              type="button"
              className="checkout-page__mobile-pay-bar__details"
              aria-label={t('cart.mobileBar.openSummary')}
              onClick={() => setMobileSheetOpen(true)}
            >
              <p className="checkout-page__mobile-pay-bar__price">
                <span className="checkout-page__mobile-pay-bar__currency">$</span>
                <span className="checkout-page__mobile-pay-bar__amount">
                  {formatPrice(displayTotal.amount)}
                </span>
                <span className="checkout-page__mobile-pay-bar__code">{displayTotal.currency}</span>
              </p>
              <span className="checkout-page__mobile-pay-bar__info" aria-hidden>
                <Info strokeWidth={2} size={20} />
              </span>
            </button>
            <Button
              type="button"
              variant="primary"
              className="checkout-page__mobile-pay-bar__pay"
              disabled={payDisabled}
            >
              {t('cart.summary.pay')}
            </Button>
          </div>
          <BottomSheet
            isOpen={mobileSheetOpen}
            onClose={() => setMobileSheetOpen(false)}
            className="checkout-page__sheet-panel"
          >
            <div className="checkout-page__sheet-panel-inner">
              <CartSummary
                lines={summary.lines}
                total={displayTotal}
                payDisabled={payDisabled}
                onGoToPay={handleGoToPay}
              />
            </div>
          </BottomSheet>
        </>
      )}
    </main>
  )
}

export default Checkout
