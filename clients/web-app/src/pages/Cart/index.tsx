import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import CartItemCard from "@/components/CartItemCard";
import CartSummary from "@/components/CartSummary";
import Button from "@/components/Button";
import Container from "@/components/Container";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useEnrichedCartItems } from "@/hooks/useEnrichedCartItems";
import { formatPrice } from "@/utils/accommodation";
import { buildCartSummaryFromItems } from "@/utils/cartSummary";
import { createBookingBatch } from "@/services/bookingService";
import "./Cart.css";

const MQ_MOBILE_PAY_BAR = "(max-width: 650px)";
const MQ_TABLET_CART_HOST = "(min-width: 651px) and (max-width: 1023px)";
const MQ_CART_FIXED_CHROME = "(max-width: 1023px)";

const CART_HEADER_PX = 64;
const CART_MAIN_PADDING_TOP_PX = 24;
const CART_TITLE_MARGIN_BOTTOM_PX = 24;

const subscribeMq =
  (query: string) =>
  (onStoreChange: () => void): (() => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onStoreChange);
    return () => mq.removeEventListener("change", onStoreChange);
  };

const snapshotMq = (query: string) => () => window.matchMedia(query).matches;

const useMatchMedia = (query: string) =>
  useSyncExternalStore(subscribeMq(query), snapshotMq(query), () => false);

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { items, removeLine, refreshFromServer } = useCart();
  const displayItems = useEnrichedCartItems(items);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mobileStripRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsColumnRef = useRef<HTMLDivElement>(null);

  const isMobilePayBar = useMatchMedia(MQ_MOBILE_PAY_BAR);
  const isTabletCartHost = useMatchMedia(MQ_TABLET_CART_HOST);

  const summary = useMemo(
    () => buildCartSummaryFromItems(displayItems),
    [displayItems],
  );

  useEffect(() => {
    void refreshFromServer();
  }, [refreshFromServer]);

  const handleRemove = useCallback(
    (id: string) => {
      void removeLine(id);
    },
    [removeLine],
  );

  const handleGoToCheckout = useCallback(async () => {
    if (items.length === 0) return;
    if (!session?.user.user_id) return;
    setIsCreatingBatch(true);
    try {
      const batch = await createBookingBatch({
        user_id: String(session.user.user_id),
        booking_ids: items.map((item) => item.id),
      });
      navigate(`/checkout?bookingId=${encodeURIComponent(batch.booking_id)}`);
    } finally {
      setIsCreatingBatch(false);
    }
  }, [items, navigate, session?.user.user_id]);

  useLayoutEffect(() => {
    const main = mainRef.current;
    const titleEl = titleRef.current;
    const itemsEl = itemsColumnRef.current;
    const mq = window.matchMedia(MQ_CART_FIXED_CHROME);
    if (!main || !titleEl || !itemsEl) return;

    const getChrome = () =>
      window.matchMedia(MQ_MOBILE_PAY_BAR).matches
        ? mobileStripRef.current
        : sidebarRef.current;

    const syncBottomInset = () => {
      if (!mq.matches) {
        main.style.removeProperty("--cart-bottom-inset");
        document.documentElement.style.removeProperty("--cart-sheet-height");
        return;
      }

      const chrome = getChrome();
      if (!chrome) return;

      const sheetH = chrome.offsetHeight;
      document.documentElement.style.setProperty(
        "--cart-sheet-height",
        `${sheetH}px`,
      );

      const vh = window.visualViewport?.height ?? window.innerHeight;
      const spaceAboveSheet = vh - CART_HEADER_PX - sheetH;

      const blockHeight =
        CART_MAIN_PADDING_TOP_PX +
        titleEl.offsetHeight +
        CART_TITLE_MARGIN_BOTTOM_PX +
        itemsEl.offsetHeight;

      if (blockHeight <= spaceAboveSheet) {
        main.style.setProperty("--cart-bottom-inset", "0px");
      } else {
        main.style.setProperty("--cart-bottom-inset", `${sheetH}px`);
      }
    };

    const schedule = () => requestAnimationFrame(syncBottomInset);

    const ro = new ResizeObserver(schedule);
    ro.observe(itemsEl);
    ro.observe(titleEl);
    const chrome = getChrome();
    if (chrome) ro.observe(chrome);

    mq.addEventListener("change", schedule);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    schedule();

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      main.style.removeProperty("--cart-bottom-inset");
      document.documentElement.style.removeProperty("--cart-sheet-height");
    };
  }, [displayItems, isMobilePayBar]);

  return (
    <main ref={mainRef} className="cart-page">
      <Container>
        <h1 ref={titleRef} className="cart-page__title">
          {t("cart.title")}
        </h1>
        <div
          className={cn(
            "cart-page__layout",
            items.length === 0 && "cart-page__layout--empty",
          )}
        >
          <div ref={itemsColumnRef} className="cart-page__items">
            {items.length === 0 ? (
              <p className="cart-page__empty-message">
                {t("cart.emptyMessage")}
              </p>
            ) : (
              <ul className="cart-page__list">
                {displayItems.map((item) => (
                  <li key={item.id} className="cart-page__list-item">
                    <CartItemCard item={item} onRemove={handleRemove} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          {!isMobilePayBar && displayItems.length > 0 && (
            <aside
              ref={sidebarRef}
              className={cn(
                "cart-page__sidebar",
                isTabletCartHost && "cart-page__sidebar--bottom-sheet-host",
              )}
              aria-label={t("cart.summaryTitle")}
            >
              <div className="cart-page__summary-card">
                <CartSummary
                  lines={summary.lines}
                  total={summary.total}
                  onGoToPay={handleGoToCheckout}
                  payDisabled={isCreatingBatch}
                />
              </div>
            </aside>
          )}
        </div>
      </Container>

      {isMobilePayBar && displayItems.length > 0 && (
        <>
          <div ref={mobileStripRef} className="cart-page__mobile-pay-bar">
            <button
              type="button"
              className="cart-page__mobile-pay-bar__details"
              aria-label={t("cart.mobileBar.openSummary")}
              onClick={() => setMobileSheetOpen(true)}
            >
              <p className="cart-page__mobile-pay-bar__price">
                <span className="cart-page__mobile-pay-bar__currency">$</span>
                <span className="cart-page__mobile-pay-bar__amount">
                  {formatPrice(summary.total.amount)}
                </span>
                <span className="cart-page__mobile-pay-bar__code">
                  {summary.total.currency}
                </span>
              </p>
              <span className="cart-page__mobile-pay-bar__info" aria-hidden>
                <Info strokeWidth={2} size={20} />
              </span>
            </button>
            <Button
              type="button"
              variant="primary"
              className="cart-page__mobile-pay-bar__pay"
              disabled={isCreatingBatch}
              onClick={handleGoToCheckout}
            >
              {t("cart.summary.pay")}
            </Button>
          </div>
          <BottomSheet
            isOpen={mobileSheetOpen}
            onClose={() => setMobileSheetOpen(false)}
            className="cart-page__sheet-panel"
          >
            <div className="cart-page__sheet-panel-inner">
              <CartSummary lines={summary.lines} total={summary.total} />
            </div>
          </BottomSheet>
        </>
      )}
    </main>
  );
};

export default Cart;
