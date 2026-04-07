import { describe, it, expect } from 'vitest'
import { BREAKPOINTS, MEDIA } from '@/constants/breakpoints'

describe('breakpoints', () => {
  it('defines pixel widths for layout keys', () => {
    expect(BREAKPOINTS).toEqual({
      mobile: 650,
      tablet: 768,
      tabletLg: 1024,
    })
  })

  it('builds media queries from breakpoint values', () => {
    expect(MEDIA.mobile).toBe('(max-width: 650px)')
    expect(MEDIA.tablet).toBe('(max-width: 768px)')
    expect(MEDIA.tabletLg).toBe('(max-width: 1024px)')
    expect(MEDIA.desktop).toBe('(min-width: 1025px)')
  })
})
