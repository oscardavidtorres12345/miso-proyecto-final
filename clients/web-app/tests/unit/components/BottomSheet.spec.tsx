import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import BottomSheet from '@/components/BottomSheet'

describe('BottomSheet', () => {
  it('renders children inside the panel', () => {
    render(
      <BottomSheet isOpen onClose={() => {}}>
        <p>Contenido del panel</p>
      </BottomSheet>
    )
    expect(screen.getByText('Contenido del panel')).toBeInTheDocument()
  })

  it('applies open class to overlay and panel when isOpen', () => {
    const { container } = render(
      <BottomSheet isOpen onClose={() => {}}>
        <span>child</span>
      </BottomSheet>
    )
    expect(container.querySelector('.bottom-sheet__overlay--open')).toBeInTheDocument()
    expect(container.querySelector('.bottom-sheet__panel--open')).toBeInTheDocument()
  })

  it('does not apply open class when closed', () => {
    const { container } = render(
      <BottomSheet isOpen={false} onClose={() => {}}>
        <span>child</span>
      </BottomSheet>
    )
    expect(container.querySelector('.bottom-sheet__overlay--open')).not.toBeInTheDocument()
    expect(container.querySelector('.bottom-sheet__panel--open')).not.toBeInTheDocument()
  })

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(
      <BottomSheet isOpen onClose={onClose}>
        <span>child</span>
      </BottomSheet>
    )
    const overlay = container.querySelector('.bottom-sheet__overlay')
    expect(overlay).toBeTruthy()
    await user.click(overlay!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('merges custom className on the panel', () => {
    const { container } = render(
      <BottomSheet isOpen onClose={() => {}} className="extra-panel">
        <span>x</span>
      </BottomSheet>
    )
    expect(container.querySelector('.bottom-sheet__panel')).toHaveClass('extra-panel')
  })
})
