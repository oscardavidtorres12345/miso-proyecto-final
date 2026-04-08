import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import './Unauthorized.css'

const Unauthorized = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="unauthorized-page">
      <div className="unauthorized__code">{t('unauthorized.code')}</div>
      <h1 className="unauthorized__title">{t('unauthorized.title')}</h1>
      <p className="unauthorized__description">{t('unauthorized.description')}</p>
      <Button variant="primary" className="unauthorized__btn" onClick={() => navigate('/login')}>
        {t('unauthorized.goLogin')}
      </Button>
    </div>
  )
}

export default Unauthorized
