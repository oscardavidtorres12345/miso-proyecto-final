import { useTranslation } from 'react-i18next'
import Container from '@/components/Container'
import FilterGroup from '@/components/FilterGroup'
import PriceFilter from '@/components/PriceFilter'
import SearchFilterPanel from '@/components/SearchFilterPanel'
import './SearchResults.css'

const SearchResults = () => {
  const { t } = useTranslation()

  const ACCOMMODATION_TYPES = [
    { id: 'hotel', label: t('searchResults.accommodation.hotel') },
    { id: 'house', label: t('searchResults.accommodation.house') },
    { id: 'cabin', label: t('searchResults.accommodation.cabin') },
    { id: 'hostel', label: t('searchResults.accommodation.hostel') },
    { id: 'villa', label: t('searchResults.accommodation.villa') },
    { id: 'resort', label: t('searchResults.accommodation.resort') },
  ]

  const SERVICES = [
    { id: 'parking', label: t('searchResults.service.parking') },
    { id: 'pool', label: t('searchResults.service.pool') },
    { id: 'pets', label: t('searchResults.service.pets') },
    { id: 'kids', label: t('searchResults.service.kids') },
    { id: 'bathtub', label: t('searchResults.service.bathtub') },
    { id: 'restaurant', label: t('searchResults.service.restaurant') },
    { id: 'spa', label: t('searchResults.service.spa') },
    { id: 'gym', label: t('searchResults.service.gym') },
    { id: 'wifi', label: t('searchResults.service.wifi') },
    { id: 'ac', label: t('searchResults.service.ac') },
  ]

  const MEALS = [
    { id: 'breakfast', label: t('searchResults.meal.breakfast') },
    { id: 'buffet', label: t('searchResults.meal.buffet') },
    { id: 'allinclusive', label: t('searchResults.meal.allinclusive') },
  ]

  return (
    <main className="search-results-page page-section">
      <Container>
        <div className="search-results-page__grid">
          <aside className="search-results-page__filters">
            <SearchFilterPanel />
            <PriceFilter />
            <FilterGroup title={t('searchResults.services')} options={SERVICES} withSearch />
            <FilterGroup title={t('searchResults.accommodationType')} options={ACCOMMODATION_TYPES} />
            <FilterGroup title={t('searchResults.meals')} options={MEALS} />
          </aside>
          <section className="search-results-page__content"></section>
        </div>
      </Container>
    </main>
  )
}

export default SearchResults
