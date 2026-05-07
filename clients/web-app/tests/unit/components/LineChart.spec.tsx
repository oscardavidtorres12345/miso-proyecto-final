import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LineChart from '@/components/LineChart'
import { renderWithProviders } from '../renderWithProviders'

const DATA = [
  { period: '2026-01', value: 800_000 },
  { period: '2026-02', value: 700_000 },
  { period: '2026-03', value: 950_000 },
]

describe('LineChart', () => {
  it('renderiza el SVG', () => {
    const { container } = renderWithProviders(<LineChart data={DATA} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renderiza el label del gráfico', () => {
    renderWithProviders(<LineChart data={DATA} label="Tendencia de ingresos" />)
    expect(screen.getByText('Tendencia de ingresos')).toBeInTheDocument()
  })

  it('renderiza una polyline cuando hay más de un punto', () => {
    const { container } = renderWithProviders(<LineChart data={DATA} />)
    expect(container.querySelector('polyline')).toBeInTheDocument()
  })

  it('renderiza dos círculos por punto (visible + hit area)', () => {
    const { container } = renderWithProviders(<LineChart data={DATA} />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(DATA.length * 2)
  })

  it('renderiza el área de relleno (polygon)', () => {
    const { container } = renderWithProviders(<LineChart data={DATA} />)
    expect(container.querySelector('polygon')).toBeInTheDocument()
  })

  it('muestra noDataLabel cuando data está vacío', () => {
    renderWithProviders(<LineChart data={[]} noDataLabel="Sin datos" />)
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('no renderiza polyline cuando data está vacío', () => {
    const { container } = renderWithProviders(<LineChart data={[]} />)
    expect(container.querySelector('polyline')).not.toBeInTheDocument()
  })

  it('renderiza círculos y sin polyline con un solo punto', () => {
    const { container } = renderWithProviders(
      <LineChart data={[{ period: '2026-01', value: 500 }]} />,
    )
    // 2 círculos: hit area + visible dot
    expect(container.querySelectorAll('circle')).toHaveLength(2)
    expect(container.querySelector('polyline')).not.toBeInTheDocument()
  })

  it('aplica formatValue al label del eje Y', () => {
    const { container } = renderWithProviders(
      <LineChart data={DATA} formatValue={(v) => `$${v}`} />,
    )
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent)
    expect(texts.some(t => t?.startsWith('$'))).toBe(true)
  })

  it('muestra el tooltip con período y valor al hacer hover en un punto', () => {
    const { container } = renderWithProviders(<LineChart data={DATA} />)
    const items = container.querySelectorAll('[data-testid="point-item"]')
    fireEvent.mouseEnter(items[0])
    const tooltip = container.querySelector('[data-testid="chart-tooltip"]')!
    expect(tooltip).toBeInTheDocument()
    expect(tooltip.textContent).toContain('2026-01')
    expect(tooltip.textContent).toContain('800000')
  })

  it('aplica formatValue en el tooltip', () => {
    const { container } = renderWithProviders(
      <LineChart data={DATA} formatValue={(v) => `$${v}`} />,
    )
    const items = container.querySelectorAll('[data-testid="point-item"]')
    fireEvent.mouseEnter(items[0])
    const tooltip = container.querySelector('[data-testid="chart-tooltip"]')!
    expect(tooltip.textContent).toContain('$800000')
  })

  it('oculta el tooltip al salir del SVG', () => {
    const { container } = renderWithProviders(<LineChart data={DATA} />)
    const svg = container.querySelector('svg')!
    const items = container.querySelectorAll('[data-testid="point-item"]')
    fireEvent.mouseEnter(items[0])
    expect(container.querySelector('[data-testid="chart-tooltip"]')).toBeInTheDocument()
    fireEvent.mouseLeave(svg)
    expect(container.querySelector('[data-testid="chart-tooltip"]')).not.toBeInTheDocument()
  })
})
