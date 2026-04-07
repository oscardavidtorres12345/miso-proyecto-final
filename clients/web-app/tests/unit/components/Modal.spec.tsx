import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Modal from '@/components/Modal'

describe('Modal', () => {
  describe('when closed', () => {
    it('renders the dialog element in the DOM', () => {
      render(<Modal isOpen={false} onClose={vi.fn()} title="Título" body={<p>Contenido</p>} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not show the panel as visible (no --open class)', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={vi.fn()} title="Título" body={<p>Contenido</p>} />
      )
      expect(container.querySelector('.modal__panel--open')).not.toBeInTheDocument()
    })
  })

  describe('when open', () => {
    it('renders the title', () => {
      render(<Modal isOpen={true} onClose={vi.fn()} title="Aviso de Privacidad" body={<p>Contenido</p>} />)
      expect(screen.getByText('Aviso de Privacidad')).toBeInTheDocument()
    })

    it('renders the body content', () => {
      render(<Modal isOpen={true} onClose={vi.fn()} title="Título" body={<p>Texto del cuerpo</p>} />)
      expect(screen.getByText('Texto del cuerpo')).toBeInTheDocument()
    })

    it('renders ReactNode body with links', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title="Título"
          body={<a href="https://example.com/doc.pdf">Ver PDF</a>}
        />
      )
      expect(screen.getByRole('link', { name: 'Ver PDF' })).toHaveAttribute('href', 'https://example.com/doc.pdf')
    })

    it('calls onClose when clicking the close button', () => {
      const onClose = vi.fn()
      render(<Modal isOpen={true} onClose={onClose} title="Título" body={<p>Contenido</p>} />)
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onClose when clicking the overlay', () => {
      const onClose = vi.fn()
      const { container } = render(
        <Modal isOpen={true} onClose={onClose} title="Título" body={<p>Contenido</p>} />
      )
      fireEvent.click(container.querySelector('.modal__overlay')!)
      expect(onClose).toHaveBeenCalledOnce()
    })
  })
})
