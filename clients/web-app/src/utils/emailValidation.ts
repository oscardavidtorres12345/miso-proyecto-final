export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  const v = value.trim()
  return v.length > 0 && EMAIL_RE.test(v)
}

export function validateEmailKey(
  value: string,
): 'validation.required' | 'validation.emailInvalid' | null {
  if (!value.trim()) return 'validation.required'
  if (!EMAIL_RE.test(value.trim())) return 'validation.emailInvalid'
  return null
}
