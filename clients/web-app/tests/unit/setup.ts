import '@testing-library/jest-dom'
import '@/i18n'

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
