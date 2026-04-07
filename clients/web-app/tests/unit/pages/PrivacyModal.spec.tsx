import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import i18n from '@/i18n'
import PrivacyModal from '@/pages/Signup/PrivacyModal'
import { renderWithProviders } from '../renderWithProviders'

const baseNotice = {
  iso_code: 'CO',
  jurisdiction_name: 'Colombia',
  applicable_regulation: 'Ley 1581',
  privacy_title: 'Aviso de Privacidad',
  privacy_content: 'Este es el contenido de privacidad.',
  privacy_pdf_url: [] as string[],
  privacy_version: '1.0',
  privacy_effective_at: '2024-01-01',
  privacy_contact_email: 'privacy@example.com',
}

describe('PrivacyModal', () => {
  it('renders nothing when privacyNotice is null', () => {
    const { container } = renderWithProviders(
      <PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={null} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  describe('when privacyNotice is provided', () => {
    it('renders the modal title', () => {
      renderWithProviders(<PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={baseNotice} />)
      expect(screen.getByText('Aviso de Privacidad')).toBeInTheDocument()
    })

    it('renders the privacy content', () => {
      renderWithProviders(<PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={baseNotice} />)
      expect(screen.getByText('Este es el contenido de privacidad.')).toBeInTheDocument()
    })

    it('applies privacy-modal__content class to the content paragraph', () => {
      const { container } = renderWithProviders(
        <PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={baseNotice} />
      )
      expect(container.querySelector('.privacy-modal__content')).toBeInTheDocument()
    })

    it('does not render the links section when there are no PDF URLs', () => {
      const { container } = renderWithProviders(
        <PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={baseNotice} />
      )
      expect(container.querySelector('.privacy-modal__links')).not.toBeInTheDocument()
    })

    it('does not apply --with-links modifier when there are no PDF URLs', () => {
      const { container } = renderWithProviders(
        <PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={baseNotice} />
      )
      expect(container.querySelector('.privacy-modal__content--with-links')).not.toBeInTheDocument()
    })

    it('renders PDF links with translated labels', () => {
      const notice = { ...baseNotice, privacy_pdf_url: ['https://example.com/doc.pdf'] }
      renderWithProviders(<PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={notice} />)
      const link = screen.getByRole('link', { name: i18n.t('signup.privacyLinkLabel', { number: 1 }) })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/doc.pdf')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders the intro text when PDF URLs are present', () => {
      const notice = { ...baseNotice, privacy_pdf_url: ['https://example.com/doc.pdf'] }
      renderWithProviders(<PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={notice} />)
      expect(screen.getByText(i18n.t('signup.privacyLinksIntro'), { exact: false })).toBeInTheDocument()
    })

    it('renders multiple PDF links with sequential labels', () => {
      const notice = {
        ...baseNotice,
        privacy_pdf_url: ['https://example.com/doc1.pdf', 'https://example.com/doc2.pdf'],
      }
      renderWithProviders(<PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={notice} />)
      expect(screen.getByRole('link', { name: i18n.t('signup.privacyLinkLabel', { number: 1 }) })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: i18n.t('signup.privacyLinkLabel', { number: 2 }) })).toBeInTheDocument()
    })

    it('applies --with-links modifier and links section when PDF URLs are present', () => {
      const notice = { ...baseNotice, privacy_pdf_url: ['https://example.com/doc.pdf'] }
      const { container } = renderWithProviders(
        <PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={notice} />
      )
      expect(container.querySelector('.privacy-modal__content--with-links')).toBeInTheDocument()
      expect(container.querySelector('.privacy-modal__links')).toBeInTheDocument()
    })

    it('applies privacy-modal__link class to each PDF link', () => {
      const notice = { ...baseNotice, privacy_pdf_url: ['https://example.com/doc.pdf'] }
      const { container } = renderWithProviders(
        <PrivacyModal isOpen={true} onClose={vi.fn()} privacyNotice={notice} />
      )
      expect(container.querySelector('.privacy-modal__link')).toBeInTheDocument()
    })

    it('calls onClose when the close button is clicked', () => {
      const onClose = vi.fn()
      renderWithProviders(<PrivacyModal isOpen={true} onClose={onClose} privacyNotice={baseNotice} />)
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('is not visually open when isOpen is false', () => {
      const { container } = renderWithProviders(
        <PrivacyModal isOpen={false} onClose={vi.fn()} privacyNotice={baseNotice} />
      )
      expect(container.querySelector('.modal__panel--open')).not.toBeInTheDocument()
    })
  })
})
