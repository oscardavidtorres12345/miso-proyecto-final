import { useTranslation } from 'react-i18next'
import certificateIcon from '@/assets/certificate.svg'
import cloudIcon from '@/assets/computing_cloud.svg'
import moneyIcon from '@/assets/money_cash.svg'
import padlockIcon from '@/assets/padlock.svg'
import Container from '@/components/Container'
import './FeaturesSection.css'

const FeaturesSection = () => {
  const { t } = useTranslation()

  const features = [
    { icon: padlockIcon, title: t('features.secureBookings.title'), description: t('features.secureBookings.description') },
    { icon: certificateIcon, title: t('features.bestPrices.title'), description: t('features.bestPrices.description') },
    { icon: cloudIcon, title: t('features.flexibleCancellation.title'), description: t('features.flexibleCancellation.description') },
    { icon: moneyIcon, title: t('features.payCurrency.title'), description: t('features.payCurrency.description') },
  ]

  return (
    <section className="features page-section">
      <Container>
        <div className="features__grid">
          {features.map(({ icon, title, description }) => (
            <div key={title} className="features__card">
              <img src={icon} alt="" aria-hidden="true" className="features__icon" />
              <h3 className="features__title">{title}</h3>
              <p className="features__description">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default FeaturesSection
