import type { TFunction } from 'i18next'

export const getRatingLabel = (score: number, t: TFunction): string => {
  if (score >= 4.5) return t('accommodationCard.rating.excellent')
  if (score >= 4.0) return t('accommodationCard.rating.veryGood')
  if (score >= 3.5) return t('accommodationCard.rating.good')
  if (score >= 3.0) return t('accommodationCard.rating.fair')
  return t('accommodationCard.rating.acceptable')
}

export const formatPrice = (amount: number): string =>
  new Intl.NumberFormat('es-CO').format(amount)
