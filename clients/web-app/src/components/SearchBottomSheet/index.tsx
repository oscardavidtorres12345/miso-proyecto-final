import { useState } from 'react'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import BottomSheet from '@/components/BottomSheet'
import Button from '@/components/Button'
import DateRangePicker from '@/components/DateRangePicker'
import GuestsPanel from '@/components/GuestsPanel'
import Input from '@/components/Input'
import SubView from '@/components/SubView'
import { formatDateRange, formatGuestSummary } from '@/utils/searchFormat'
import { GUESTS_DEFAULTS } from '@/types/search'
import type { Guests } from '@/types/search'
import type { SearchState } from '@/hooks/useSearchState'
import { cn } from '@/lib/utils'
import './SearchBottomSheet.css'

type View = 'main' | 'dates' | 'guests'

type SearchBottomSheetProps = Pick<SearchState, 'destination' | 'setDestination' | 'dateRange' | 'setDateRange' | 'guests' | 'setGuests'> & {
  isOpen: boolean
  onClose: () => void
}

const SearchBottomSheet = ({
  isOpen, onClose,
  destination, setDestination,
  dateRange, setDateRange,
  guests, setGuests,
}: SearchBottomSheetProps) => {
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
  const dateDisplay = formatDateRange(dateRange)
  const guestDisplay = formatGuestSummary(guests)

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} className="search-sheet-panel">
        <div className="search-sheet">
          <div className="search-sheet__field">
            <span className="search-sheet__label">Destino</span>
            <div className="search-sheet__input-row">
              <MapPin className="search-sheet__icon" />
              <div className="search-sheet__input-box">
                <Input
                  type="text"
                  placeholder="¿Donde?"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="search-sheet__field search-sheet__field--tap" onClick={openDates}>
            <span className="search-sheet__label">Fechas</span>
            <div className="search-sheet__input-row">
              <Calendar className="search-sheet__icon" />
              <div className="search-sheet__input-box">
                <span className={cn('search-sheet__display', !dateDisplay && 'search-sheet__display--placeholder')}>
                  {dateDisplay ?? 'Agrega fechas'}
                </span>
              </div>
            </div>
          </div>

          <div className="search-sheet__field search-sheet__field--tap" onClick={openGuests}>
            <span className="search-sheet__label">Quién</span>
            <div className="search-sheet__input-row">
              <Users className="search-sheet__icon" />
              <div className="search-sheet__input-box">
                <span className={cn('search-sheet__display', !guestsSelected && 'search-sheet__display--placeholder')}>
                  {guestsSelected ? guestDisplay : '¿Cuántos?'}
                </span>
              </div>
            </div>
          </div>

          <Button variant="primary" className="search-sheet__button" onClick={onClose} disabled={!canSearch}>
            Buscar
          </Button>
        </div>
      </BottomSheet>

      <SubView isOpen={view === 'dates'} title="Fechas" onCancel={goBack} onApply={applyDates}>
        <DateRangePicker value={tempDateRange} onChange={setTempDateRange} />
      </SubView>

      <SubView isOpen={view === 'guests'} title="Quién" onCancel={goBack} onApply={applyGuests}>
        <GuestsPanel value={tempGuests} onChange={setTempGuests} />
      </SubView>
    </>
  )
}

export default SearchBottomSheet
