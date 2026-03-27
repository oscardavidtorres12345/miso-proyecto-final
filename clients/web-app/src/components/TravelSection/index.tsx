import { useTranslation } from 'react-i18next'
import mountainImg from '@/assets/mountain.png'
import seaImg from '@/assets/sea.png'
import Container from '@/components/Container'
import './TravelSection.css'

const TravelSection = () => {
  const { t } = useTranslation()
  return (
    <section className="travel page-section">
      <Container>
        <div className="travel__grid">
          <div className="travel__images">
            <div className="travel__mountain-wrapper">
              <img src={mountainImg} alt={t('travel.mountainAlt')} className="travel__img" />
            </div>
            <div className="travel__sea-wrapper">
              <img src={seaImg} alt={t('travel.seaAlt')} className="travel__img" />
            </div>
          </div>

          <div className="travel__content">
            <p className="section-label">{t('travel.label')}</p>
            <h2 className="section-heading">{t('travel.heading')}</h2>
            <p className="travel__text">{t('travel.description')}</p>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default TravelSection
