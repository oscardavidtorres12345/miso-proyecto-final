import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import Input from '@/components/Input'
import useLoginForm from '@/hooks/useLoginForm'
import { cn } from '@/lib/utils'
import './Login.css'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { email, password, setEmail, setPassword, handleBlur, errors, isSubmitDisabled } = useLoginForm()

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-card__title">{t('login.title')}</h1>
        <p className="login-card__subtitle">
          {t('login.noAccount')}{' '}
          <span className="login-card__link" onClick={() => navigate('/signup')}>{t('login.register')}</span>
        </p>

        <div className="login-card__field">
          <label htmlFor="email" className="login-card__label">{t('login.email')}</label>
          <div className={cn('input-box', errors.email && 'input-box--error')}>
            <Input
              id="email"
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              error={!!errors.email}
              errorMessage={errors.email ?? undefined}
            />
          </div>
        </div>

        <div className="login-card__field">
          <label htmlFor="password" className="login-card__label">{t('login.password')}</label>
          <div className={cn('input-box', errors.password && 'input-box--error')}>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              error={!!errors.password}
              errorMessage={errors.password ?? undefined}
            />
          </div>
        </div>

        <Button variant="primary" className="login-card__submit" disabled={isSubmitDisabled}>
          {t('login.submit')}
        </Button>
      </div>
    </div>
  )
}

export default Login
