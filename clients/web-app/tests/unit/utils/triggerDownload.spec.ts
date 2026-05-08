import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { triggerDownload } from '@/utils/triggerDownload'

describe('triggerDownload', () => {
  let mockAnchor: HTMLAnchorElement
  let createElementSpy: ReturnType<typeof vi.spyOn>
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let removeChildSpy: ReturnType<typeof vi.spyOn>
  let dispatchEventSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()

    dispatchEventSpy = vi.fn()
    mockAnchor = Object.assign(document.createElement('a'), {
      dispatchEvent: dispatchEventSpy,
    })

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as HTMLElement as never)
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor as Node & never)
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockAnchor as Node & never)

    revokeObjectURLSpy = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: revokeObjectURLSpy,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('crea un elemento <a>', () => {
    triggerDownload(new Blob(['test']), 'file.xlsx')
    expect(createElementSpy).toHaveBeenCalledWith('a')
  })

  it('asigna el atributo download con el nombre de archivo', () => {
    triggerDownload(new Blob(['test']), 'reporte-mensual-2026-05.pdf')
    expect(mockAnchor.download).toBe('reporte-mensual-2026-05.pdf')
  })

  it('añade el ancla al DOM antes del click', () => {
    triggerDownload(new Blob(['test']), 'file.xlsx')
    expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor)
  })

  it('dispara el click con bubbles:false para no propagar a React Router', () => {
    triggerDownload(new Blob(['test']), 'file.xlsx')
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1)
    const event = dispatchEventSpy.mock.calls[0][0] as MouseEvent
    expect(event.type).toBe('click')
    expect(event.bubbles).toBe(false)
  })

  it('elimina el ancla del DOM tras el click', () => {
    triggerDownload(new Blob(['test']), 'file.xlsx')
    expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor)
  })

  it('revoca la URL de objeto después de 1 segundo', () => {
    triggerDownload(new Blob(['test']), 'file.xlsx')
    expect(revokeObjectURLSpy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1_000)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('el orden es: appendChild → dispatchEvent → removeChild', () => {
    const callOrder: string[] = []
    appendChildSpy.mockImplementation(() => { callOrder.push('append'); return mockAnchor as Node & never })
    dispatchEventSpy.mockImplementation(() => { callOrder.push('click') })
    removeChildSpy.mockImplementation(() => { callOrder.push('remove'); return mockAnchor as Node & never })

    triggerDownload(new Blob(['test']), 'file.pdf')
    expect(callOrder).toEqual(['append', 'click', 'remove'])
  })
})
