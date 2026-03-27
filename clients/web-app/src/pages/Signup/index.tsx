import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import Checkbox from '@/components/Checkbox'
import Input from '@/components/Input'
import useSignupForm from '@/hooks/useSignupForm'
import { registerUser } from '@/services/identityService'
import './Signup.css'

const JURISDICTION_MAP: Record<string, number> = { co: 1, ar: 2, us: 3 }

const Signup = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    firstName, lastName, documentId, country, email, password, confirmPassword, acceptedTerms,
    setFirstName, setLastName, setDocumentId, setCountry, setEmail, setPassword, setConfirmPassword,
    handleBlur, handleTermsChange,
    errors, isSubmitDisabled,
  } = useSignupForm()

  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setApiError(null)
    setIsLoading(true)
    try {
      await registerUser({
        first_name: firstName,
        last_name: lastName,
        email,
        document_id: documentId,
        jurisdiction_id: JURISDICTION_MAP[country] ?? 1,
        password,
        password_confirmation: confirmPassword,
      })
      navigate('/')
    } catch (err) {
      const error = err as Error & { status?: number }
      if (error.status === 409) {
        setApiError(t('signup.apiConflict'))
      } else {
        setApiError(t('signup.apiError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

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
          <Input
            id="firstName"
            type="text"
            placeholder={t('signup.firstNamePlaceholder')}
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            onBlur={() => handleBlur('firstName')}
            error={!!errors.firstName}
            errorMessage={errors.firstName ?? ''}
          />
        </div>

        <div className="signup-card__field">
          <label htmlFor="lastName" className="signup-card__label">{t('signup.lastName')}</label>
          <Input
            id="lastName"
            type="text"
            placeholder={t('signup.lastNamePlaceholder')}
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            onBlur={() => handleBlur('lastName')}
            error={!!errors.lastName}
            errorMessage={errors.lastName ?? ''}
          />
        </div>

        <div className="signup-card__field">
          <label htmlFor="documentId" className="signup-card__label">{t('signup.documentId')}</label>
          <Input
            id="documentId"
            type="text"
            placeholder={t('signup.documentIdPlaceholder')}
            value={documentId}
            onChange={e => setDocumentId(e.target.value)}
            onBlur={() => handleBlur('documentId')}
            error={!!errors.documentId}
            errorMessage={errors.documentId ?? ''}
          />
        </div>

        <div className="signup-card__field">
          <label htmlFor="country" className="signup-card__label">{t('signup.country')}</label>
          <select
            id="country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            onBlur={() => handleBlur('country')}
            className="input-box"
          >
            <option value="" disabled>{t('signup.countryPlaceholder')}</option>
            <option value="co">Colombia</option>
            <option value="ar">Argentina</option>
            <option value="us">United States</option>
          </select>
          {errors.country && <p className="input-field__error">{errors.country}</p>}
        </div>

        <div className="signup-card__field">
          <label htmlFor="email" className="signup-card__label">{t('signup.email')}</label>
          <Input
            id="email"
            type="email"
            placeholder={t('signup.emailPlaceholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            error={!!errors.email}
            errorMessage={errors.email ?? ''}
          />
        </div>

        <div className="signup-card__field">
          <label htmlFor="password" className="signup-card__label">{t('signup.password')}</label>
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

        <div className="signup-card__field">
          <label htmlFor="confirmPassword" className="signup-card__label">{t('signup.confirmPassword')}</label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            error={!!errors.confirmPassword}
            errorMessage={errors.confirmPassword ?? ''}
          />
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

        {apiError && <p className="input-field__error" style={{ marginBottom: 12 }}>{apiError}</p>}

        <Button
          variant="primary"
          className="signup-card__submit"
          disabled={isSubmitDisabled || isLoading}
          onClick={handleSubmit}
        >
          {t('signup.submit')}
        </Button>
      </div>
    </div>
  )
}

export default Signup
