import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import type { CartLineItem } from '@/types/cart'
import { formatPrice } from '@/utils/accommodation'
import './CartItemCard.css'

interface CartItemCardProps {
  item: CartLineItem
  onRemove?: (id: string) => void
}

const CartItemCard = ({ item, onRemove }: CartItemCardProps) => {
  const { t } = useTranslation()
  const { name, image, price } = item

  return (
    <article className="cart-item-card">
      <div className="cart-item-card__image-wrap">
        <img className="cart-item-card__image" src={image} alt="" />
      </div>
      <div className="cart-item-card__content">
        <div className="cart-item-card__top">
          <h2 className="cart-item-card__title">{name}</h2>
          <button
            type="button"
            className="cart-item-card__remove"
            aria-label={t('cart.removeItem')}
            onClick={() => onRemove?.(item.id)}
          >
            <Trash2 strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="cart-item-card__divider" role="presentation" />
        <div className="cart-item-card__price-block">
          <p className="cart-item-card__price">
            <span className="cart-item-card__currency-symbol">$</span>
            <span className="cart-item-card__amount">{formatPrice(price.amount)}</span>
            <span className="cart-item-card__currency-code">{price.currency}</span>
          </p>
        </div>
      </div>
    </article>
  )
}

export default CartItemCard
