const DIGIT_SPLIT = /\D/g

export function priceInputDigitsOnly(raw: string): string {
  return raw.replace(DIGIT_SPLIT, "")
}

export function formatPriceInputDisplay(digits: string): string {
  if (digits === "") return ""
  const n = Number(digits)
  if (!Number.isFinite(n) || n < 0) return ""
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n)
}
