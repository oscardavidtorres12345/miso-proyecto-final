import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import './NotFound.css'

const NotFound = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="not-found-page">
      <div className="not-found__code">{t('notFound.code')}</div>
      <h1 className="not-found__title">{t('notFound.title')}</h1>
      <p className="not-found__description">{t('notFound.description')}</p>
      <Button variant="primary" className="not-found__btn" onClick={() => navigate('/')}>
        {t('notFound.goHome')}
      </Button>
    </div>
  )
}

export default NotFound
