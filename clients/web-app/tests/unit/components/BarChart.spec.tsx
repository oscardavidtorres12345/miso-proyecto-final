import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BarChart from '@/components/BarChart'
import { renderWithProviders } from '../renderWithProviders'

const DATA = [
  { period: '2026-01', value: 12 },
  { period: '2026-02', value: 18 },
  { period: '2026-03', value: 7 },
]

describe('BarChart', () => {
  it('renderiza el SVG', () => {
    const { container } = renderWithProviders(<BarChart data={DATA} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renderiza el label del gráfico', () => {
    renderWithProviders(<BarChart data={DATA} label="Reservas por período" />)
    expect(screen.getByText('Reservas por período')).toBeInTheDocument()
  })

  it('renderiza una barra visible por cada dato', () => {
    const { container } = renderWithProviders(<BarChart data={DATA} />)
    // cada grupo tiene 2 rects: hit area invisible + barra visible
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBe(DATA.length * 2)
  })

  it('muestra noDataLabel cuando data está vacío', () => {
    renderWithProviders(<BarChart data={[]} noDataLabel="Sin datos" />)
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('no renderiza barras cuando data está vacío', () => {
    const { container } = renderWithProviders(<BarChart data={[]} />)
    expect(container.querySelectorAll('rect')).toHaveLength(0)
  })

  it('trunca periodos largos a 7 caracteres en el eje X', () => {
    const { container } = renderWithProviders(
      <BarChart data={[{ period: '2026-01-15', value: 5 }]} />,
    )
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent)
    expect(texts).toContain('2026-01')
  })

  it('muestra el tooltip con período y valor al hacer hover en una barra', () => {
    const { container } = renderWithProviders(<BarChart data={DATA} />)
    const items = container.querySelectorAll('[data-testid="bar-item"]')
    fireEvent.mouseEnter(items[0])
    const tooltip = container.querySelector('[data-testid="chart-tooltip"]')!
    expect(tooltip).toBeInTheDocument()
    expect(tooltip.textContent).toContain('2026-01')
    expect(tooltip.textContent).toContain('12')
  })

  it('aplica formatValue en el tooltip', () => {
    const { container } = renderWithProviders(
      <BarChart data={DATA} formatValue={(v) => `$${v}`} />,
    )
    const items = container.querySelectorAll('[data-testid="bar-item"]')
    fireEvent.mouseEnter(items[0])
    const tooltip = container.querySelector('[data-testid="chart-tooltip"]')!
    expect(tooltip.textContent).toContain('$12')
  })

  it('aplica formatAxisValue en las etiquetas del eje Y', () => {
    const { container } = renderWithProviders(
      <BarChart data={DATA} formatAxisValue={(v) => `${v}K`} />,
    )
    const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent)
    expect(texts.some((t) => t?.endsWith('K'))).toBe(true)
  })

  it('usa formatAxisValue en el eje Y y formatValue en el tooltip de forma independiente', () => {
    const { container } = renderWithProviders(
      <BarChart
        data={DATA}
        formatValue={(v) => `TOOLTIP-${v}`}
        formatAxisValue={(v) => `AXIS-${v}`}
      />,
    )
    const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent)
    expect(texts.some((t) => t?.startsWith('AXIS-'))).toBe(true)

    const items = container.querySelectorAll('[data-testid="bar-item"]')
    fireEvent.mouseEnter(items[0])
    const tooltip = container.querySelector('[data-testid="chart-tooltip"]')!
    expect(tooltip.textContent).toContain('TOOLTIP-12')
    expect(tooltip.textContent).not.toContain('AXIS-')
  })

  it('oculta el tooltip al salir del SVG', () => {
    const { container } = renderWithProviders(<BarChart data={DATA} />)
    const svg = container.querySelector('svg')!
    const items = container.querySelectorAll('[data-testid="bar-item"]')
    fireEvent.mouseEnter(items[0])
    expect(container.querySelector('[data-testid="chart-tooltip"]')).toBeInTheDocument()
    fireEvent.mouseLeave(svg)
    expect(container.querySelector('[data-testid="chart-tooltip"]')).not.toBeInTheDocument()
  })
})
