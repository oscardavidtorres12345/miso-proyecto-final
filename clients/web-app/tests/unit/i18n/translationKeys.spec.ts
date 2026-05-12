import { describe, it, expect } from 'vitest'
import enUS from '@/i18n/locales/en-US'
import esCO from '@/i18n/locales/es-CO'
import esAR from '@/i18n/locales/es-AR'

type NestedObject = { [key: string]: string | NestedObject }

function extractKeys(obj: NestedObject, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return extractKeys(value as NestedObject, fullKey)
    }
    return [fullKey]
  })
}

function extractLeafValues(obj: NestedObject, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, extractLeafValues(value as NestedObject, fullKey))
    } else if (typeof value === 'string') {
      result[fullKey] = value
    }
  }
  return result
}

function extractInterpolationVars(str: string): string[] {
  const matches = str.match(/\{\{(\w+)\}\}/g) ?? []
  return matches.map((m) => m.replace(/\{\{|\}\}/g, '')).sort()
}

const locales: Record<string, NestedObject> = {
  'en-US': enUS as unknown as NestedObject,
  'es-CO': esCO as unknown as NestedObject,
  'es-AR': esAR as unknown as NestedObject,
}

describe('Translation key completeness', () => {
  const keysByLocale = Object.fromEntries(
    Object.entries(locales).map(([lang, obj]) => [lang, new Set(extractKeys(obj))])
  )

  describe('top-level keys', () => {
    it('all locales export the same top-level keys', () => {
      const topLevel = Object.fromEntries(
        Object.entries(locales).map(([lang, obj]) => [lang, Object.keys(obj).sort()])
      )
      expect(topLevel['en-US']).toEqual(topLevel['es-CO'])
      expect(topLevel['es-AR']).toEqual(topLevel['es-CO'])
    })
  })

  describe('recursive key parity', () => {
    it.each([
      ['en-US', 'es-CO'],
      ['es-AR', 'es-CO'],
      ['en-US', 'es-AR'],
    ] as const)('%s has the same keys as %s', (localeA, localeB) => {
      const keysA = keysByLocale[localeA]
      const keysB = keysByLocale[localeB]

      const missingInA = [...keysB].filter((k) => !keysA.has(k))
      const missingInB = [...keysA].filter((k) => !keysB.has(k))

      expect(missingInA, `Keys present in ${localeB} but missing in ${localeA}`).toEqual([])
      expect(missingInB, `Keys present in ${localeA} but missing in ${localeB}`).toEqual([])
    })
  })

  describe('value quality', () => {
    it.each(Object.keys(locales))('"%s" has no empty string values', (lang) => {
      const values = extractLeafValues(locales[lang])
      const emptyKeys = Object.entries(values)
        .filter(([, val]) => val.trim() === '')
        .map(([key]) => key)
      expect(emptyKeys, `Empty string values found in ${lang}`).toEqual([])
    })

    it.each(Object.keys(locales))('"%s" has no undefined or null values', (lang) => {
      const keys = extractKeys(locales[lang])
      const values = extractLeafValues(locales[lang])
      const missingValues = keys.filter((k) => values[k] === undefined || values[k] === null)
      expect(missingValues, `Undefined/null values in ${lang}`).toEqual([])
    })
  })

  describe('plural form consistency', () => {
    it.each(Object.keys(locales))('"%s" has matching _one and _other plural keys', (lang) => {
      const keys = extractKeys(locales[lang])
      const oneKeys = keys.filter((k) => k.endsWith('_one'))
      const otherKeys = keys.filter((k) => k.endsWith('_other'))

      for (const oneKey of oneKeys) {
        const otherKey = oneKey.replace(/_one$/, '_other')
        expect(keys, `${lang}: "${otherKey}" expected for "${oneKey}"`).toContain(otherKey)
      }
      for (const otherKey of otherKeys) {
        const oneKey = otherKey.replace(/_other$/, '_one')
        expect(keys, `${lang}: "${oneKey}" expected for "${otherKey}"`).toContain(oneKey)
      }
    })

    it('all locales define the same plural keys', () => {
      const pluralKeysByLocale = Object.fromEntries(
        Object.entries(locales).map(([lang, obj]) => [
          lang,
          extractKeys(obj)
            .filter((k) => k.endsWith('_one') || k.endsWith('_other'))
            .sort(),
        ])
      )
      expect(pluralKeysByLocale['en-US']).toEqual(pluralKeysByLocale['es-CO'])
      expect(pluralKeysByLocale['es-AR']).toEqual(pluralKeysByLocale['es-CO'])
    })
  })

  describe('interpolation variable consistency', () => {
    it('en-US and es-CO use the same interpolation variables per key', () => {
      const refValues = extractLeafValues(locales['es-CO'])
      const compareValues = extractLeafValues(locales['en-US'])

      for (const [key, refVal] of Object.entries(refValues)) {
        const compareVal = compareValues[key]
        if (!compareVal) continue
        const refVars = extractInterpolationVars(refVal)
        const compareVars = extractInterpolationVars(compareVal)
        expect(
          compareVars,
          `en-US key "${key}" interpolation vars differ from es-CO`
        ).toEqual(refVars)
      }
    })

    it('es-AR and es-CO use the same interpolation variables per key', () => {
      const refValues = extractLeafValues(locales['es-CO'])
      const compareValues = extractLeafValues(locales['es-AR'])

      for (const [key, refVal] of Object.entries(refValues)) {
        const compareVal = compareValues[key]
        if (!compareVal) continue
        const refVars = extractInterpolationVars(refVal)
        const compareVars = extractInterpolationVars(compareVal)
        expect(
          compareVars,
          `es-AR key "${key}" interpolation vars differ from es-CO`
        ).toEqual(refVars)
      }
    })
  })
})
