import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types/user'
import './Unauthorized.css'

const Unauthorized = ({ variant = 'unauthenticated' }: { variant?: 'unauthenticated' | 'forbidden' }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useAuth()

  const isForbidden = variant === 'forbidden'
  const homeRoute = session?.user.role === UserRole.STAFF ? '/portal/dashboard' : '/'

  return (
    <div className="unauthorized-page">
      <div className="unauthorized__code">{t(isForbidden ? 'forbidden.code' : 'unauthorized.code')}</div>
      <h1 className="unauthorized__title">{t(isForbidden ? 'forbidden.title' : 'unauthorized.title')}</h1>
      <p className="unauthorized__description">{t(isForbidden ? 'forbidden.description' : 'unauthorized.description')}</p>
      {isForbidden ? (
        <Button variant="primary" className="unauthorized__btn" onClick={() => navigate(homeRoute)}>
          {t('forbidden.goHome')}
        </Button>
      ) : (
        <Button variant="primary" className="unauthorized__btn" onClick={() => navigate('/login')}>
          {t('unauthorized.goLogin')}
        </Button>
      )}
    </div>
  )
}

export default Unauthorized
