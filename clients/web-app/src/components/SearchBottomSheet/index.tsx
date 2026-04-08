import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import DateRangePicker from '@/components/DateRangePicker'
import GuestsPanel from '@/components/GuestsPanel'
import Input from '@/components/Input'
import SubView from '@/components/SubView'
import { formatDateRange } from '@/utils/searchFormat'
import { useI18n } from '@/context/I18nContext'
import { GUESTS_DEFAULTS } from '@/types/search'
import type { CommittedSearchPayload, Guests } from '@/types/search'
import type { SearchState } from '@/hooks/useSearchState'
import { cn } from '@/lib/utils'
import './SearchBottomSheet.css'

type View = 'main' | 'dates' | 'guests'

type SearchBottomSheetProps = Pick<
  SearchState,
  'destination' | 'setDestination' | 'dateRange' | 'setDateRange' | 'guests' | 'setGuests'
> & {
  isOpen: boolean
  onClose: () => void
  onSearch?: () => void
  variant?: 'live' | 'draft'
  onDraftCommit?: (payload: CommittedSearchPayload) => void
}

type SheetSnapshot = Pick<CommittedSearchPayload, 'destination' | 'dateRange' | 'guests'>

type SheetModel = {
  snapshot: SheetSnapshot
  setDestinationValue: (value: string) => void
  seedDatesPicker: () => void
  seedGuestsPanel: () => void
  applyDatesPicker: (range: DateRange | undefined) => void
  applyGuestsPanel: (next: Guests) => void
}

const SearchBottomSheet = ({
  isOpen,
  onClose,
  onSearch,
  destination,
  setDestination,
  dateRange,
  setDateRange,
  guests,
  setGuests,
  variant = 'live',
  onDraftCommit,
}: SearchBottomSheetProps) => {
  const { t } = useTranslation()
  const { language } = useI18n()
  const [view, setView] = useState<View>('main')
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>()
  const [tempGuests, setTempGuests] = useState<Guests>(GUESTS_DEFAULTS)
  const [guestsSelected, setGuestsSelected] = useState(false)
  const [draft, setDraft] = useState<CommittedSearchPayload>({
    destination: '',
    dateRange: undefined,
    guests: GUESTS_DEFAULTS,
  })
  const wasOpenRef = useRef(false)

  const isDraft = variant === 'draft'

  useEffect(() => {
    if (isDraft && isOpen && !wasOpenRef.current) {
      setDraft({
        destination,
        dateRange,
        guests: { ...guests },
      })
      setView('main')
    }
    wasOpenRef.current = isOpen
  }, [isOpen, isDraft, destination, dateRange, guests])

  const model = useMemo((): SheetModel => {
    const goBackToMain = () => setView('main')

    if (isDraft) {
      return {
        snapshot: {
          destination: draft.destination,
          dateRange: draft.dateRange,
          guests: draft.guests,
        },
        setDestinationValue: (value) =>
          setDraft((d) => ({ ...d, destination: value })),
        seedDatesPicker: () => setTempDateRange(draft.dateRange),
        seedGuestsPanel: () => setTempGuests({ ...draft.guests }),
        applyDatesPicker: (range) => {
          setDraft((d) => ({ ...d, dateRange: range }))
          goBackToMain()
        },
        applyGuestsPanel: (next) => {
          setDraft((d) => ({ ...d, guests: { ...next } }))
          goBackToMain()
        },
      }
    }

    return {
      snapshot: { destination, dateRange, guests },
      setDestinationValue: setDestination,
      seedDatesPicker: () => setTempDateRange(dateRange),
      seedGuestsPanel: () => setTempGuests({ ...guests }),
      applyDatesPicker: (range) => {
        setDateRange(range)
        goBackToMain()
      },
      applyGuestsPanel: (next) => {
        setGuests({ ...next })
        setGuestsSelected(true)
        goBackToMain()
      },
    }
  }, [
    isDraft,
    draft.destination,
    draft.dateRange,
    draft.guests,
    destination,
    dateRange,
    guests,
    setDestination,
    setDateRange,
    setGuests,
  ])

  const { snapshot } = model
  const canSearch =
    snapshot.destination.trim().length > 0 &&
    !!snapshot.dateRange?.from &&
    !!snapshot.dateRange?.to
  const dateDisplay = formatDateRange(snapshot.dateRange, language)
  const total = snapshot.guests.adults + snapshot.guests.children
  const guestDisplay = t('guests.guest', { count: total })

  const openDates = () => {
    model.seedDatesPicker()
    setView('dates')
  }

  const openGuests = () => {
    model.seedGuestsPanel()
    setView('guests')
  }

  const applyDates = () => model.applyDatesPicker(tempDateRange)
  const applyGuests = () => model.applyGuestsPanel(tempGuests)

  const goBack = () => setView('main')

  const handleSearchClick = () => {
    if (isDraft && onDraftCommit) {
      onDraftCommit(draft)
      onClose()
      return
    }
    const run = onSearch ?? onClose
    run()
  }

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} className="search-sheet-panel">
        <div className="search-sheet">
          <div className="search-sheet__field">
            <span className="search-sheet__label">{t('search.destination')}</span>
            <div className="search-sheet__input-row">
              <MapPin className="search-sheet__icon" />
              <div className="input-box flex-1">
                <Input
                  type="text"
                  placeholder={t('search.wherePlaceholder')}
                  value={snapshot.destination}
                  onChange={(e) => model.setDestinationValue(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="search-sheet__field search-sheet__field--tap" onClick={openDates}>
            <span className="search-sheet__label">{t('search.dates')}</span>
            <div className="search-sheet__input-row">
              <Calendar className="search-sheet__icon" />
              <div className="input-box flex-1">
                <span className={cn('input-display', !dateDisplay && 'input-display--placeholder')}>
                  {dateDisplay ?? t('search.addDates')}
                </span>
              </div>
            </div>
          </div>

          <div className="search-sheet__field search-sheet__field--tap" onClick={openGuests}>
            <span className="search-sheet__label">{t('search.who')}</span>
            <div className="search-sheet__input-row">
              <Users className="search-sheet__icon" />
              <div className="input-box flex-1">
                <span
                  className={cn(
                    'input-display',
                    !isDraft && !guestsSelected && 'input-display--placeholder',
                  )}
                >
                  {isDraft || guestsSelected ? guestDisplay : t('search.howManyPlaceholder')}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            className="btn-full search-sheet__button"
            onClick={handleSearchClick}
            disabled={!canSearch}
          >
            {t('search.search')}
          </Button>
        </div>
      </BottomSheet>

      <SubView isOpen={view === 'dates'} title={t('search.dates')} onCancel={goBack} onApply={applyDates}>
        <DateRangePicker value={tempDateRange} onChange={setTempDateRange} />
      </SubView>

      <SubView isOpen={view === 'guests'} title={t('search.who')} onCancel={goBack} onApply={applyGuests}>
        <GuestsPanel value={tempGuests} onChange={setTempGuests} />
      </SubView>
    </>
  )
}

export default SearchBottomSheet
