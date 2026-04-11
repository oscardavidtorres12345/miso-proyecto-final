import { useTranslation } from 'react-i18next'
import { ShoppingBag } from 'lucide-react'
import './Checkout.css'

const Checkout = () => {
  const { t } = useTranslation()

  return (
    <div className="checkout-page">
      <div className="checkout-page__icon">
        <ShoppingBag size={64} strokeWidth={1.5} />
      </div>
      <h1 className="checkout-page__title">{t('checkout.title')}</h1>
      <p className="checkout-page__placeholder">{t('checkout.placeholder')}</p>
    </div>
  )
}

export default Checkout
