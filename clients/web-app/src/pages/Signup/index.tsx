import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import Checkbox from '@/components/Checkbox'
import Input from '@/components/Input'
import useSignupForm from '@/hooks/useSignupForm'
import { cn } from '@/lib/utils'
import './Signup.css'

const Signup = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    firstName, lastName, email, password, confirmPassword, acceptedTerms,
    setFirstName, setLastName, setEmail, setPassword, setConfirmPassword,
    handleBlur, handleTermsChange,
    errors, isSubmitDisabled,
  } = useSignupForm()

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h1 className="signup-card__title">{t('signup.title')}</h1>
        <p className="signup-card__subtitle">
          {t('signup.alreadyAccount')}{' '}
          <span className="signup-card__link" onClick={() => navigate('/login')}>
            {t('signup.login')}
          </span>
        </p>

        <div className="signup-card__field">
          <label htmlFor="firstName" className="signup-card__label">{t('signup.firstName')}</label>
          <div className={cn('input-box', errors.firstName && 'input-box--error')}>
            <Input
              id="firstName"
              type="text"
              placeholder={t('signup.firstNamePlaceholder')}
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onBlur={() => handleBlur('firstName')}
              error={!!errors.firstName}
              errorMessage={errors.firstName ?? undefined}
            />
          </div>
        </div>

        <div className="signup-card__field">
          <label htmlFor="lastName" className="signup-card__label">{t('signup.lastName')}</label>
          <div className={cn('input-box', errors.lastName && 'input-box--error')}>
            <Input
              id="lastName"
              type="text"
              placeholder={t('signup.lastNamePlaceholder')}
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onBlur={() => handleBlur('lastName')}
              error={!!errors.lastName}
              errorMessage={errors.lastName ?? undefined}
            />
          </div>
        </div>

        <div className="signup-card__field">
          <label htmlFor="email" className="signup-card__label">{t('signup.email')}</label>
          <div className={cn('input-box', errors.email && 'input-box--error')}>
            <Input
              id="email"
              type="email"
              placeholder={t('signup.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              error={!!errors.email}
              errorMessage={errors.email ?? undefined}
            />
          </div>
        </div>

        <div className="signup-card__field">
          <label htmlFor="password" className="signup-card__label">{t('signup.password')}</label>
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

        <div className="signup-card__field">
          <label htmlFor="confirmPassword" className="signup-card__label">{t('signup.confirmPassword')}</label>
          <div className={cn('input-box', errors.confirmPassword && 'input-box--error')}>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              error={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword ?? undefined}
            />
          </div>
        </div>

        <div className="signup-card__terms-wrapper">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onChange={handleTermsChange}
            className="signup-card__terms"
            label={
              <>
                {t('signup.terms')}{' '}
                <a href="#" className="signup-card__link">{t('signup.termsLink')}</a>
              </>
            }
          />
          {errors.terms && <p className="input-field__error">{errors.terms}</p>}
        </div>

        <Button variant="primary" className="signup-card__submit" disabled={isSubmitDisabled}>
          {t('signup.submit')}
        </Button>
      </div>
    </div>
  )
}

export default Signup
