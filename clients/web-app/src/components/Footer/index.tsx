import { useTranslation } from 'react-i18next'
import './Footer.css'

const Footer = () => {
  const { t } = useTranslation()
  return (
    <footer className="footer">
      <p className="footer__text">{t('footer.madeWithLove')}</p>
    </footer>
  )
}

export default Footer
