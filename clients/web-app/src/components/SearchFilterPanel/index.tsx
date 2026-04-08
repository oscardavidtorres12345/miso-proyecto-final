import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/Button'
import DateRangeInput from '@/components/DateRangeInput'
import DestinationInput from '@/components/DestinationInput'
import GuestsDropdown from '@/components/GuestsDropdown'
import { useSearch } from '@/context/SearchContext'
import type { CommittedSearchPayload } from '@/types/search'
import './SearchFilterPanel.css'

type SearchFilterPanelProps = {
  onCommitSearch?: (payload: CommittedSearchPayload) => void
}

const SearchFilterPanel = ({ onCommitSearch }: SearchFilterPanelProps) => {
  const { t } = useTranslation()
  const ctx = useSearch()
  const navigate = useNavigate()

  const [draftDestination, setDraftDestination] = useState(ctx.destination)
  const [draftDateRange, setDraftDateRange] = useState(ctx.dateRange)
  const [draftGuests, setDraftGuests] = useState(ctx.guests)

  useEffect(() => {
    if (!onCommitSearch) return
    setDraftDestination(ctx.destination)
    setDraftDateRange(ctx.dateRange)
    setDraftGuests(ctx.guests)
  }, [onCommitSearch, ctx.destination, ctx.dateRange, ctx.guests])

  const destination = onCommitSearch ? draftDestination : ctx.destination
  const setDestination = onCommitSearch ? setDraftDestination : ctx.setDestination
  const dateRange = onCommitSearch ? draftDateRange : ctx.dateRange
  const setDateRange = onCommitSearch ? setDraftDateRange : ctx.setDateRange
  const guests = onCommitSearch ? draftGuests : ctx.guests
  const setGuests = onCommitSearch ? setDraftGuests : ctx.setGuests

  const canSearch = destination.trim().length > 0 && !!dateRange?.from && !!dateRange?.to

  const handleSearchClick = () => {
    if (onCommitSearch) {
      onCommitSearch({
        destination: draftDestination,
        dateRange: draftDateRange,
        guests: draftGuests,
      })
      return
    }
    navigate('/search')
  }

  return (
    <div className="search-filter-panel">
      <div className="search-filter-panel__header">
        <h2 className="search-filter-panel__title">{t('searchFilter.title')}</h2>
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
          onClick={handleSearchClick}
        >
          {t('search.search')}
        </Button>
      </div>
    </div>
  )
}

export default SearchFilterPanel
