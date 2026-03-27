import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import Checkbox from '@/components/Checkbox'
import Input from '@/components/Input'
import './Signup.css'

const Signup = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

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
          <div className="input-box">
            <Input
              id="firstName"
              type="text"
              placeholder={t('signup.firstNamePlaceholder')}
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </div>
        </div>

        <div className="signup-card__field">
          <label htmlFor="lastName" className="signup-card__label">{t('signup.lastName')}</label>
          <div className="input-box">
            <Input
              id="lastName"
              type="text"
              placeholder={t('signup.lastNamePlaceholder')}
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="signup-card__field">
          <label htmlFor="email" className="signup-card__label">{t('signup.email')}</label>
          <div className="input-box">
            <Input
              id="email"
              type="email"
              placeholder={t('signup.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="signup-card__field">
          <label htmlFor="password" className="signup-card__label">{t('signup.password')}</label>
          <div className="input-box">
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="signup-card__field">
          <label htmlFor="confirmPassword" className="signup-card__label">{t('signup.confirmPassword')}</label>
          <div className="input-box">
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onChange={setAcceptedTerms}
          className="signup-card__terms"
          label={
            <>
              {t('signup.terms')}{' '}
              <a href="#" className="signup-card__link">{t('signup.termsLink')}</a>
            </>
          }
        />

        <Button variant="primary" className="signup-card__submit">
          {t('signup.submit')}
        </Button>
      </div>
    </div>
  )
}

export default Signup
