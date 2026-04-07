import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import './Footer.css'

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const { t } = useTranslation()
  return (
    <footer ref={ref} className="footer">
      <p className="footer__text">{t('footer.madeWithLove')}</p>
    </footer>
  )
})

Footer.displayName = 'Footer'

export default Footer
