import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import DonutChart from '@/components/DonutChart'
import { renderWithProviders } from '../renderWithProviders'
import type { MonthlyReportDistributionItemDto } from '@/services/bookingService'

const DATA: MonthlyReportDistributionItemDto[] = [
  { category: 'Suite', room_type: null, value: 40, percentage: 40 },
  { category: 'Estándar', room_type: 'simple', value: 35, percentage: 35 },
  { category: 'Doble', room_type: null, value: 25, percentage: 25 },
]

describe('DonutChart', () => {
  it('renderiza un SVG cuando hay datos', () => {
    const { container } = renderWithProviders(<DonutChart data={DATA} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renderiza el label del gráfico si se pasa', () => {
    renderWithProviders(<DonutChart data={DATA} label="Distribución por categoría" />)
    expect(screen.getByText('Distribución por categoría')).toBeInTheDocument()
  })

  it('no renderiza el label si no se pasa', () => {
    const { container } = renderWithProviders(<DonutChart data={DATA} />)
    expect(container.querySelector('p')).not.toBeInTheDocument()
  })

  it('renderiza un arco por cada ítem de datos', () => {
    const { container } = renderWithProviders(<DonutChart data={DATA} />)
    const arcs = container.querySelectorAll('[data-testid="donut-arc"]')
    expect(arcs.length).toBe(DATA.length)
  })

  it('muestra noDataLabel cuando data está vacío', () => {
    renderWithProviders(<DonutChart data={[]} noDataLabel="Sin datos" />)
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('no renderiza SVG cuando data está vacío', () => {
    const { container } = renderWithProviders(<DonutChart data={[]} />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('muestra el porcentaje de cada ítem en la leyenda', () => {
    renderWithProviders(<DonutChart data={DATA} />)
    expect(screen.getByText('40.0%')).toBeInTheDocument()
    expect(screen.getByText('35.0%')).toBeInTheDocument()
    expect(screen.getByText('25.0%')).toBeInTheDocument()
  })

  it('muestra el nombre de categoría en la leyenda', () => {
    renderWithProviders(<DonutChart data={DATA} />)
    expect(screen.getByText(/Suite/)).toBeInTheDocument()
    expect(screen.getByText(/Estándar/)).toBeInTheDocument()
    expect(screen.getByText(/Doble/)).toBeInTheDocument()
  })

  it('muestra room_type entre paréntesis cuando está presente', () => {
    renderWithProviders(<DonutChart data={DATA} />)
    expect(screen.getByText(/simple/)).toBeInTheDocument()
  })

  it('renderiza un punto de color por cada ítem en la leyenda', () => {
    const { container } = renderWithProviders(<DonutChart data={DATA} />)
    const dots = container.querySelectorAll('[data-testid="donut-legend-dot"]')
    expect(dots.length).toBe(DATA.length)
  })

  describe('tooltip', () => {
    it('muestra el tooltip al hacer hover sobre un arco', () => {
      const { container } = renderWithProviders(<DonutChart data={DATA} />)
      const arcs = container.querySelectorAll('[data-testid="donut-arc"]')
      fireEvent.mouseEnter(arcs[0])
      expect(container.querySelector('[data-testid="chart-tooltip"]')).toBeInTheDocument()
    })

    it('muestra el porcentaje del arco activo en el tooltip', () => {
      const { container } = renderWithProviders(<DonutChart data={DATA} />)
      const arcs = container.querySelectorAll('[data-testid="donut-arc"]')
      fireEvent.mouseEnter(arcs[0])
      const tooltip = container.querySelector('[data-testid="chart-tooltip"]')!
      expect(tooltip.textContent).toContain('40.0%')
    })

    it('muestra la categoría del arco activo en el tooltip', () => {
      const { container } = renderWithProviders(<DonutChart data={DATA} />)
      const arcs = container.querySelectorAll('[data-testid="donut-arc"]')
      fireEvent.mouseEnter(arcs[0])
      const tooltip = container.querySelector('[data-testid="chart-tooltip"]')!
      expect(tooltip.textContent).toContain('Suite')
    })

    it('oculta el tooltip al salir del SVG', () => {
      const { container } = renderWithProviders(<DonutChart data={DATA} />)
      const arcs = container.querySelectorAll('[data-testid="donut-arc"]')
      fireEvent.mouseEnter(arcs[0])
      expect(container.querySelector('[data-testid="chart-tooltip"]')).toBeInTheDocument()
      fireEvent.mouseLeave(container.querySelector('svg')!)
      expect(container.querySelector('[data-testid="chart-tooltip"]')).not.toBeInTheDocument()
    })

    it('muestra el tooltip del ítem correcto al hacer hover en la leyenda', () => {
      const { container } = renderWithProviders(<DonutChart data={DATA} />)
      const legendItems = container.querySelectorAll('li')
      fireEvent.mouseEnter(legendItems[1])
      const tooltip = container.querySelector('[data-testid="chart-tooltip"]')!
      expect(tooltip.textContent).toContain('35.0%')
    })

    it('oculta el tooltip al salir de un ítem de la leyenda', () => {
      const { container } = renderWithProviders(<DonutChart data={DATA} />)
      const legendItems = container.querySelectorAll('li')
      fireEvent.mouseEnter(legendItems[0])
      fireEvent.mouseLeave(legendItems[0])
      expect(container.querySelector('[data-testid="chart-tooltip"]')).not.toBeInTheDocument()
    })
  })
})
