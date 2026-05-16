import BookingsChrome from '@/components/BookingsChrome'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import ReservationCard from '@/components/ReservationCard'
import Snackbar from '@/components/Snackbar'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getUserConfirmedUpcomingBookings, userCancelBooking, fetchCancellationPreview, type ReservationListItemDto, type CancellationPreviewResponseDto } from '@/services/bookingService'
import { parseIsoDateLocal } from '@/utils/searchFormat'

type SnackbarState = { show: boolean; variant: 'success' | 'error'; message: string }

const toCardData = (item: ReservationListItemDto) => ({
  ...item,
  arrival: parseIsoDateLocal(item.arrival),
  departure: parseIsoDateLocal(item.departure),
})

const MyReservations = () => {
  const { session } = useAuth()
  const { t } = useTranslation()
  const [reservations, setReservations] = useState<ReservationListItemDto[]>([])
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const [cancelPreview, setCancelPreview] = useState<CancellationPreviewResponseDto | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({ show: false, variant: 'success', message: '' })

  useEffect(() => {
    if (!session) return
    getUserConfirmedUpcomingBookings(String(session.user.user_id))
      .then((data) => setReservations(data.reservations))
      .catch(() => setReservations([]))
  }, [session])

  useEffect(() => {
    if (!session) return
    if (!selectedReservationId) {
      setCancelPreview(null)
      return
    }
    setPreviewLoading(true)
    fetchCancellationPreview(selectedReservationId, session.user.user_id)
      .then((data) => setCancelPreview(data))
      .catch(() => setCancelPreview(null))
      .finally(() => setPreviewLoading(false))
  }, [selectedReservationId, session])

  const closeCancelModal = () => {
    setSelectedReservationId(null)
    setCancelPreview(null)
  }

  const handleCancelConfirm = () => {
    if (!selectedReservationId || !session) return
    if (cancelPreview && !cancelPreview.can_cancel) return

    const bookingId = selectedReservationId
    closeCancelModal()
    setShowLoadingSpinner(true)
    userCancelBooking(bookingId, session.user.user_id)
      .then(() => {
        setReservations((prev) => prev.filter((r) => r.id !== bookingId))
        setSnackbar({ show: true, variant: 'success', message: t('bookings.cancelSuccessToast') })
      })
      .catch(() => {
        setSnackbar({ show: true, variant: 'error', message: t('portalReservations.cancelError') })
      })
      .finally(() => {
        setShowLoadingSpinner(false)
      })
  }

  const modalBody = () => {
    if (previewLoading) {
      return <p>{t('bookings.cancelPreviewLoading')}</p>
    }
    if (cancelPreview && !cancelPreview.can_cancel) {
      return (
        <div>
          <p className="modal__message">{t('bookings.cancelNotAllowed')}</p>
          {cancelPreview.conditions && <p className="modal__conditions">{cancelPreview.conditions}</p>}
        </div>
      )
    }
    return (
      <div>
        <p className="modal__message">{t('bookings.cancelReservationModalMessage')}</p>
        {cancelPreview && cancelPreview.refund_amount !== null && (
          <p className="modal__refund">
            {t('bookings.cancelRefundLabel')}: <strong>{cancelPreview.refund_amount.toLocaleString()} {cancelPreview.refund_currency}</strong>
          </p>
        )}
        {cancelPreview && cancelPreview.conditions && (
          <p className="modal__conditions">{cancelPreview.conditions}</p>
        )}
      </div>
    )
  }

  const canConfirmCancel = !previewLoading && (!cancelPreview || cancelPreview.can_cancel)

  return (
    <BookingsChrome
      titleKey="bookings.myReservationsTitle"
      switchHref="/past-trips"
      switchLabelKey="bookings.switchToPast"
    >
      {reservations.length === 0 ? (
        <p className="bookings-page__empty-message">{t('bookings.emptyMessage')}</p>
      ) : (
        <ul className="bookings-page__list">
          {reservations.map((item) => (
            <li key={item.id} className="bookings-page__list-item">
              <ReservationCard {...toCardData(item)} onCancel={() => setSelectedReservationId(item.id)} />
            </li>
          ))}
        </ul>
      )}
      <Modal
        isOpen={selectedReservationId !== null}
        onClose={closeCancelModal}
        title={t('bookings.cancelReservationModalTitle')}
        body={modalBody()}
        cancelLabel={t('bookings.cancelReservationModalDismiss')}
        confirmLabel={t('bookings.cancelReservationModalConfirm')}
        onConfirm={handleCancelConfirm}
        confirmDisabled={!canConfirmCancel}
      />
      <Snackbar
        show={snackbar.show}
        variant={snackbar.variant}
        message={snackbar.message}
        onClose={() => setSnackbar((s) => ({ ...s, show: false }))}
      />
      {showLoadingSpinner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <LoadingSpinner />
        </div>
      )}
    </BookingsChrome>
  )
}

export default MyReservations
