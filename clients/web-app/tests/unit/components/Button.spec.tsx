import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Button from '@/components/Button'

describe('Button', () => {
  it('renders as a button with children', () => {
    render(<Button>Enviar</Button>)
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
  })

  it('applies primary variant class by default', () => {
    render(<Button>OK</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--primary')
  })

  it.each([
    ['secondary', 'btn--secondary'],
    ['ghost', 'btn--ghost'],
    ['outline', 'btn--outline'],
  ] as const)('applies %s variant class', (variant, className) => {
    render(<Button variant={variant}>x</Button>)
    expect(screen.getByRole('button')).toHaveClass(className)
  })

  it('forwards native button attributes', () => {
    render(
      <Button type="submit" disabled>
        Guardar
      </Button>
    )
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('type', 'submit')
    expect(btn).toBeDisabled()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('merges custom className', () => {
    render(<Button className="w-full">x</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn', 'w-full')
  })
})
