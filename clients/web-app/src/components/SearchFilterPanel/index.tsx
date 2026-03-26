import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import DateRangeInput from '@/components/DateRangeInput'
import DestinationInput from '@/components/DestinationInput'
import GuestsDropdown from '@/components/GuestsDropdown'
import { useSearch } from '@/context/SearchContext'
import './SearchFilterPanel.css'

const SearchFilterPanel = () => {
  const { destination, setDestination, dateRange, setDateRange, guests, setGuests } = useSearch()
  const navigate = useNavigate()

  const canSearch = destination.trim().length > 0 && !!dateRange?.from && !!dateRange?.to

  return (
    <div className="search-filter-panel">
      <div className="search-filter-panel__header">
        <h2 className="search-filter-panel__title">Alojamientos</h2>
      </div>
      <div className="search-filter-panel__body">
        <div className="search-filter-panel__field">
          <DestinationInput value={destination} onChange={setDestination} />
        </div>
        <div className="search-filter-panel__field">
          <DateRangeInput value={dateRange} onChange={setDateRange} />
        </div>
        <div className="search-filter-panel__field">
          <GuestsDropdown value={guests} onChange={setGuests} showValue />
        </div>
        <Button
          variant="primary"
          className="search-filter-panel__button"
          disabled={!canSearch}
          onClick={() => navigate('/search')}
        >
          Buscar
        </Button>
      </div>
    </div>
  )
}

export default SearchFilterPanel
