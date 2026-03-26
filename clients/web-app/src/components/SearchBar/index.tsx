import { Search } from 'lucide-react'
import Button from '@/components/Button'
import DateRangeInput from '@/components/DateRangeInput'
import DestinationInput from '@/components/DestinationInput'
import GuestsDropdown from '@/components/GuestsDropdown'
import type { SearchState } from '@/hooks/useSearchState'
import './SearchBar.css'

const Separator = () => (
  <div className="search-bar__separator w-px self-stretch rounded-full flex-shrink-0" />
)

type SearchBarProps = Pick<SearchState, 'destination' | 'setDestination' | 'dateRange' | 'setDateRange' | 'guests' | 'setGuests'> & {
  onSearch?: () => void
}

const SearchBar = ({ destination, setDestination, dateRange, setDateRange, guests, setGuests, onSearch }: SearchBarProps) => {
  const canSearch = destination.trim().length > 0 && !!dateRange?.from && !!dateRange?.to

  return (
    <div className="search-bar flex items-center bg-white rounded-full shadow-lg pl-8 py-4">
      <div className="flex items-center flex-1 gap-3">
        <DestinationInput value={destination} onChange={setDestination} />
        <Separator />
        <DateRangeInput value={dateRange} onChange={setDateRange} />
        <Separator />
        <GuestsDropdown value={guests} onChange={setGuests} />
      </div>
      <Button variant="primary" className="search-bar__button" disabled={!canSearch} onClick={onSearch}>
        <Search className="search-bar__icon text-white" />
      </Button>
    </div>
  )
}

export default SearchBar
