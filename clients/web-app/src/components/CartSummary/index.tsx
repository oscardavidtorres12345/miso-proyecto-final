import { useTranslation } from "react-i18next";
import Button from "@/components/Button";
import { cn } from "@/lib/utils";
import type {
  CartSummaryLine,
  CartSummaryLineKind,
  CartSummaryTotal,
} from "@/types/cart";
import { formatPrice } from "@/utils/accommodation";
import "./CartSummary.css";

interface CartSummaryProps {
  lines: CartSummaryLine[];
  total: CartSummaryTotal;
  onGoToPay?: () => void;
  payDisabled?: boolean;
}

const summaryLineI18nKey: Record<CartSummaryLineKind, string> = {
  productName: "cart.summary.lines.productName",
  productsCount: "cart.summary.lines.productsCount",
  accommodationForGuests: "cart.summary.lines.accommodationForGuests",
  charges: "cart.summary.lines.charges",
  taxes: "cart.summary.lines.taxes",
  insurance: "cart.summary.lines.insurance",
  discounts: "cart.summary.lines.discounts",
};

const formatLineValue = (
  amount: number,
): { prefix: string; absFormatted: string } => {
  if (amount < 0) {
    return { prefix: "- $ ", absFormatted: formatPrice(Math.abs(amount)) };
  }
  return { prefix: "$ ", absFormatted: formatPrice(amount) };
};

const lineLabel = (
  t: (key: string, opts?: Record<string, string | number>) => string,
  line: CartSummaryLine,
): string => {
  if (line.kind === "accommodationForGuests") {
    const count = Number(line.labelParams?.count ?? 0);
    return t("cart.summary.lines.accommodationForGuests", { count });
  }
  return t(summaryLineI18nKey[line.kind], line.labelParams ?? {});
};

const CartSummary = ({
  lines,
  total,
  onGoToPay,
  payDisabled = false,
}: CartSummaryProps) => {
  const { t } = useTranslation();

  return (
    <div className="cart-summary">
      <dl className="cart-summary__lines">
        {lines.map((line) => {
          const { prefix, absFormatted } = formatLineValue(line.amount);
          return (
            <div key={line.id} className="cart-summary__line">
              <dt className="cart-summary__label">
                {lineLabel(t, line)}
              </dt>
              <dd
                className={cn(
                  "cart-summary__value",
                  line.variant === "discount" &&
                    "cart-summary__value--discount",
                )}
              >
                {prefix}
                {absFormatted}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="cart-summary__divider" role="presentation" />
      <div className="cart-summary__footer">
        <span className="cart-summary__total-label">
          {t("cart.summary.total")}
        </span>
        <p className="cart-summary__total-price">
          <span className="cart-summary__total-currency">$</span>
          <span className="cart-summary__total-amount">
            {formatPrice(total.amount)}
          </span>
          <span className="cart-summary__total-code">{total.currency}</span>
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        className="cart-summary__cta"
        onClick={onGoToPay}
        disabled={payDisabled}
      >
        {t("cart.summary.pay")}
      </Button>
    </div>
  );
};

export default CartSummary;
