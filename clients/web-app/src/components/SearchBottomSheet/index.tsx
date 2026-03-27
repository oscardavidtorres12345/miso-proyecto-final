import { useState } from 'react'
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
import type { Guests } from '@/types/search'
import type { SearchState } from '@/hooks/useSearchState'
import { cn } from '@/lib/utils'
import './SearchBottomSheet.css'

type View = 'main' | 'dates' | 'guests'

type SearchBottomSheetProps = Pick<SearchState, 'destination' | 'setDestination' | 'dateRange' | 'setDateRange' | 'guests' | 'setGuests'> & {
  isOpen: boolean
  onClose: () => void
  onSearch?: () => void
}

const SearchBottomSheet = ({
  isOpen, onClose, onSearch,
  destination, setDestination,
  dateRange, setDateRange,
  guests, setGuests,
}: SearchBottomSheetProps) => {
  const { t } = useTranslation()
  const { language } = useI18n()
  const [view, setView] = useState<View>('main')
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>()
  const [tempGuests, setTempGuests] = useState<Guests>(GUESTS_DEFAULTS)
  const [guestsSelected, setGuestsSelected] = useState(false)

  const openDates = () => {
    setTempDateRange(dateRange)
    setView('dates')
  }

  const openGuests = () => {
    setTempGuests({ ...guests })
    setView('guests')
  }

  const applyDates = () => {
    setDateRange(tempDateRange)
    setView('main')
  }

  const applyGuests = () => {
    setGuests({ ...tempGuests })
    setGuestsSelected(true)
    setView('main')
  }

  const goBack = () => setView('main')

  const canSearch = destination.trim().length > 0 && !!dateRange?.from && !!dateRange?.to
  const dateDisplay = formatDateRange(dateRange, language)
  const total = guests.adults + guests.children
  const guestDisplay = t('guests.guest', { count: total })

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
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
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
                <span className={cn('input-display', !guestsSelected && 'input-display--placeholder')}>
                  {guestsSelected ? guestDisplay : t('search.howManyPlaceholder')}
                </span>
              </div>
            </div>
          </div>

          <Button variant="primary" className="btn-full search-sheet__button" onClick={onSearch ?? onClose} disabled={!canSearch}>
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
