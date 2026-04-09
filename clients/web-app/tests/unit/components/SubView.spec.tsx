import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import SubView from '@/components/SubView'
import { renderWithProviders } from '../renderWithProviders'

describe('SubView', () => {
  it('renders title, children and footer actions when open', () => {
    renderWithProviders(
      <SubView isOpen title="Fechas" onCancel={() => {}} onApply={() => {}}>
        <p>Contenido</p>
      </SubView>
    )
    expect(screen.getByText('Fechas')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
  })

  it('calls onCancel and onApply', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onApply = vi.fn()
    renderWithProviders(
      <SubView isOpen title="Huéspedes" onCancel={onCancel} onApply={onApply}>
        <span>x</span>
      </SubView>
    )
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledTimes(1)
  })

  it('applies open modifier class when isOpen', () => {
    const { container } = renderWithProviders(
      <SubView isOpen title="T" onCancel={() => {}} onApply={() => {}}>
        <span>c</span>
      </SubView>
    )
    expect(container.querySelector('.sub-view--open')).toBeInTheDocument()
  })
})
