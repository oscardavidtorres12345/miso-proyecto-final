export const BREAKPOINTS = {
  mobile: 650,
  tablet: 768,
  tabletLg: 1024,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

export const MEDIA = {
  mobile: `(max-width: ${BREAKPOINTS.mobile}px)`,
  tablet: `(max-width: ${BREAKPOINTS.tablet}px)`,
  tabletLg: `(max-width: ${BREAKPOINTS.tabletLg}px)`,
  desktop: `(min-width: ${BREAKPOINTS.tabletLg + 1}px)`,
} as const
