import type { Result } from 'axe-core'

type ImpactLevel = 'minor' | 'moderate' | 'serious' | 'critical'

export function filterViolations(violations: Result[], ...levels: ImpactLevel[]): Result[] {
  return violations.filter(v => levels.includes(v.impact as ImpactLevel))
}
