import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateRequired = (value: string): string | null =>
  value.trim() ? null : 'validation.required'

const validateEmail = (value: string): string | null => {
  if (!value.trim()) return 'validation.required'
  if (!EMAIL_RE.test(value)) return 'validation.emailInvalid'
  return null
}

const validatePassword = (value: string): string | null => {
  if (!value) return 'validation.required'
  if (value.length < 8) return 'validation.passwordMinLength'
  return null
}

const validateConfirmPassword = (value: string, password: string): string | null => {
  if (!value) return 'validation.required'
  if (value !== password) return 'validation.passwordMismatch'
  return null
}

const validateTerms = (checked: boolean): string | null =>
  checked ? null : 'validation.termsRequired'

type SignupField = 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'terms'

const useSignupForm = () => {
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [touched, setTouched] = useState<Record<SignupField, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  })

  const handleBlur = (field: SignupField) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleTermsChange = (checked: boolean) => {
    setAcceptedTerms(checked)
    setTouched(prev => ({ ...prev, terms: true }))
  }

  const rawErrors: Record<SignupField, string | null> = {
    firstName: validateRequired(firstName),
    lastName: validateRequired(lastName),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(confirmPassword, password),
    terms: validateTerms(acceptedTerms),
  }

  const errors: Record<SignupField, string | null> = {
    firstName: touched.firstName && rawErrors.firstName ? t(rawErrors.firstName) : null,
    lastName: touched.lastName && rawErrors.lastName ? t(rawErrors.lastName) : null,
    email: touched.email && rawErrors.email ? t(rawErrors.email) : null,
    password: touched.password && rawErrors.password ? t(rawErrors.password) : null,
    confirmPassword: touched.confirmPassword && rawErrors.confirmPassword ? t(rawErrors.confirmPassword) : null,
    terms: touched.terms && rawErrors.terms ? t(rawErrors.terms) : null,
  }

  const isSubmitDisabled = Object.values(rawErrors).some(e => e !== null)

  return {
    firstName, lastName, email, password, confirmPassword, acceptedTerms,
    setFirstName, setLastName, setEmail, setPassword, setConfirmPassword,
    handleBlur, handleTermsChange,
    errors, isSubmitDisabled,
  }
}

export default useSignupForm
