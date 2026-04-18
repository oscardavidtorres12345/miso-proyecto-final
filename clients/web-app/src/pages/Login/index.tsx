import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Snackbar from '@/components/Snackbar'
import { useAuth } from '@/context/AuthContext'
import useLoginForm from '@/hooks/useLoginForm'
import { loginUser } from '@/services/identityService'
import { UserRole } from '@/types/user'
import './Login.css'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { email, password, setEmail, setPassword, handleBlur, errors, isSubmitDisabled } = useLoginForm()

  const { setAuthData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ message: string; variant: 'success' | 'error'; show: boolean }>({
    message: '',
    variant: 'success',
    show: false,
  })

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await loginUser({ email, password })
      setAuthData(response)
      setSnackbar({ message: t('login.apiSuccess'), variant: 'success', show: true })
      const destination = response.user.role === UserRole.STAFF ? '/portal/dashboard' : '/'
      setTimeout(() => navigate(destination), 2000)
    } catch {
      setSnackbar({ message: t('login.apiError'), variant: 'error', show: true })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-card__title">{t('login.title')}</h1>
          <p className="login-card__subtitle">
            {t('login.noAccount')}{' '}
            <span className="login-card__link" onClick={() => navigate('/signup')}>{t('login.register')}</span>
          </p>

          <div className="login-card__field">
            <label htmlFor="email" className="login-card__label">{t('login.email')}</label>
            <Input
              id="email"
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              error={!!errors.email}
              errorMessage={errors.email ?? ''}
            />
          </div>

          <div className="login-card__field">
            <label htmlFor="password" className="login-card__label">{t('login.password')}</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              error={!!errors.password}
              errorMessage={errors.password ?? ''}
            />
          </div>

          <Button
            variant="primary"
            className="login-card__submit"
            disabled={isSubmitDisabled || isLoading}
            onClick={handleSubmit}
          >
            {t('login.submit')}
          </Button>
        </div>
      </div>

      <Snackbar
        show={snackbar.show}
        message={snackbar.message}
        variant={snackbar.variant}
        onClose={() => setSnackbar(prev => ({ ...prev, show: false }))}
        duration={5000}
      />
    </>
  )
}

export default Login
