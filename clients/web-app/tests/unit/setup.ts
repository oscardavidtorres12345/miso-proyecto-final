import '@testing-library/jest-dom'
import '@/i18n'
import { expect } from 'vitest'

// Normalize vite-imagetools hashes in snapshots so they are stable across environments.
// The hash in /@imagetools/<hash> varies by OS/Node version and would cause CI failures.
expect.addSnapshotSerializer({
  test: (val) => val instanceof HTMLElement,
  print: (val, serialize) =>
    serialize(
      (val as HTMLElement).outerHTML.replace(/\/@imagetools\/[a-f0-9]+/g, '/@imagetools/[hash]')
    ),
})

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  constructor(
    cb: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    void cb
    void options
  }
}

globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
globalThis.IntersectionObserver =
  IntersectionObserverStub as unknown as typeof IntersectionObserver
