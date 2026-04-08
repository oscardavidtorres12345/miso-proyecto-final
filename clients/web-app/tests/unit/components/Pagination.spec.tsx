import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Pagination from '@/components/Pagination'

describe('Pagination', () => {
  it('returns null when totalPages is 1 or 0', () => {
    const { container, rerender } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
    )
    expect(container.firstChild).toBeNull()
    rerender(<Pagination currentPage={1} totalPages={0} onPageChange={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nav with page buttons when totalPages > 1', () => {
    const onPageChange = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir a página 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('calls onPageChange when a page number is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: 'Ir a página 3' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('disables previous on first page and next on last page', () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />
    )
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página siguiente' })).not.toBeDisabled()

    rerender(<Pagination currentPage={3} totalPages={3} onPageChange={onPageChange} />)
    expect(screen.getByRole('button', { name: 'Página anterior' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
  })

  it('uses ellipsis for large page counts', () => {
    render(<Pagination currentPage={5} totalPages={20} onPageChange={() => {}} />)
    expect(screen.getAllByText('…').length).toBeGreaterThanOrEqual(1)
  })

  it('renders compact page list when totalPages is 7', () => {
    render(<Pagination currentPage={4} totalPages={7} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Ir a página 7' })).toBeInTheDocument()
    expect(screen.queryByText('…')).not.toBeInTheDocument()
  })

  it('omits leading ellipsis when current page is near the start', () => {
    render(<Pagination currentPage={2} totalPages={15} onPageChange={() => {}} />)
    const ellipsis = screen.getAllByText('…')
    expect(ellipsis).toHaveLength(1)
  })

  it('calls onPageChange for previous and next', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(onPageChange).toHaveBeenNthCalledWith(1, 1)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3)
  })

  it('omits trailing ellipsis when current page is near the end', () => {
    render(<Pagination currentPage={18} totalPages={20} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Ir a página 20' })).toBeInTheDocument()
    expect(screen.getAllByText('…')).toHaveLength(1)
  })
})
