import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import CheckinQrModal from '@/components/CheckinQrModal'
import { renderWithProviders } from '../renderWithProviders'
import * as AuthContext from '@/context/AuthContext'
import * as bookingService from '@/services/bookingService'
import { UserRole } from '@/types/user'

const mockAuth = () => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    session: {
      user: {
        user_id: 99,
        username: 'staff',
        email: 'staff@test.com',
        role: UserRole.STAFF,
        is_active: true,
      },
      permissions: [],
      sessionExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      token: 'mock-jwt-token',
    },
    token: 'mock-jwt-token',
    isAuthenticated: true,
    autoLoggedOut: false,
    setAuthData: vi.fn(),
    clearAuthData: vi.fn(),
    clearAutoLoggedOut: vi.fn(),
  })
}

describe('CheckinQrModal', () => {
  beforeEach(() => {
    i18n.changeLanguage('es-CO')
    mockAuth()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests the QR token for the given booking and renders the QR', async () => {
    const spy = vi
      .spyOn(bookingService, 'getCheckinQrToken')
      .mockResolvedValue({
        status: 'ok',
        booking_id: 'booking-abc',
        qr_value: 'TH|booking-abc|123|hash',
        expires_at: '2026-05-14T13:36:38Z',
      })

    renderWithProviders(
      <CheckinQrModal open bookingId="booking-abc" onClose={() => {}} />,
    )

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(
        { token: 'mock-jwt-token', userId: 99 },
        'booking-abc',
      ),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('img', { name: 'Código QR de check-in' }),
      ).toBeInTheDocument(),
    )
  })

  it('shows the error message when the request fails', async () => {
    vi.spyOn(bookingService, 'getCheckinQrToken').mockRejectedValue(
      new Error('boom'),
    )

    renderWithProviders(
      <CheckinQrModal open bookingId="booking-abc" onClose={() => {}} />,
    )

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('boom'),
    )
  })

  it('does not request the QR when closed', () => {
    const spy = vi.spyOn(bookingService, 'getCheckinQrToken')
    renderWithProviders(
      <CheckinQrModal open={false} bookingId={null} onClose={() => {}} />,
    )
    expect(spy).not.toHaveBeenCalled()
  })
})
