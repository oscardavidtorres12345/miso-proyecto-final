import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Snackbar from '@/components/Snackbar'
import { useCart } from '@/context/CartContext'
import { useSessionCountdown } from '@/context/SessionCountdownContext'

const HoldExpiredBridge = () => {
  const { t } = useTranslation()
  const { clearCart } = useCart()
  const { subscribeHoldExpired } = useSessionCountdown()
  const [show, setShow] = useState(false)

  const onExpired = useCallback(() => {
    clearCart()
    setShow(true)
  }, [clearCart])

  useEffect(() => subscribeHoldExpired(onExpired), [subscribeHoldExpired, onExpired])

  return (
    <Snackbar
      show={show}
      message={t('cart.holdExpired')}
      variant="error"
      onClose={() => setShow(false)}
      duration={8000}
    />
  )
}

export default HoldExpiredBridge
