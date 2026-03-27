import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateEmail = (value: string): string | null => {
  if (!value.trim()) return 'validation.required'
  if (!EMAIL_RE.test(value)) return 'validation.emailInvalid'
  return null
}

const validatePassword = (value: string): string | null => {
  if (!value) return 'validation.required'
  return null
}

type LoginField = 'email' | 'password'

const useLoginForm = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<Record<LoginField, boolean>>({
    email: false,
    password: false,
  })

  const handleBlur = (field: LoginField) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const rawErrors = {
    email: validateEmail(email),
    password: validatePassword(password),
  }

  const errors = {
    email: touched.email && rawErrors.email ? t(rawErrors.email) : null,
    password: touched.password && rawErrors.password ? t(rawErrors.password) : null,
  }

  const isSubmitDisabled = rawErrors.email !== null || rawErrors.password !== null

  return { email, password, setEmail, setPassword, handleBlur, errors, isSubmitDisabled }
}

export default useLoginForm
