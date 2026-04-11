import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import coverImage from '@/assets/cover_image.png'
import Button from '@/components/Button'
import Container from '@/components/Container'
import SearchBar from '@/components/SearchBar'
import SearchBottomSheet from '@/components/SearchBottomSheet'
import { useSearch } from '@/context/SearchContext'
import {
  committedSearchFromSearchState,
  committedSearchToUrlParams,
  normalizeCommittedSearch,
} from '@/utils/searchUrl'
import './HeroSection.css'

const HeroSection = () => {
  const { t } = useTranslation()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const navigate = useNavigate()
  const searchState = useSearch()

  const goToSearchResults = () => {
    const payload = normalizeCommittedSearch(
      committedSearchFromSearchState(
        searchState.destination,
        searchState.dateRange,
        searchState.guests,
      ),
    )
    navigate({
      pathname: '/search',
      search: `?${committedSearchToUrlParams(payload).toString()}`,
    })
  }

  return (
    <>
      <section className="hero">
        <Container>
          <div className="hero__grid">
            <div className="hero__content flex flex-col">
              <span className="hero__subtitle font-semibold text-secondary leading-tight">
                {t('hero.subtitle')}
              </span>
              <h1 className="hero__title font-bold text-secondary">
                {t('hero.title')}
              </h1>
              <div className="hero__search">
                <SearchBar
                  destination={searchState.destination}
                  setDestination={searchState.setDestination}
                  dateRange={searchState.dateRange}
                  setDateRange={searchState.setDateRange}
                  guests={searchState.guests}
                  setGuests={searchState.setGuests}
                  onSearch={goToSearchResults}
                />
              </div>
              <div className="hero__search-button-wrapper">
                <Button
                  variant="primary"
                  className="hero__search-button"
                  onClick={() => setIsSheetOpen(true)}
                >
                  {t('hero.search')}
                </Button>
              </div>
            </div>

            <div className="hero__image-column">
              <div className="hero__image-container rounded-full overflow-hidden bg-gray-200 shadow-md">
                <img
                  src={coverImage}
                  alt="Travel destination"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <SearchBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSearch={() => {
          setIsSheetOpen(false)
          goToSearchResults()
        }}
        destination={searchState.destination}
        setDestination={searchState.setDestination}
        dateRange={searchState.dateRange}
        setDateRange={searchState.setDateRange}
        guests={searchState.guests}
        setGuests={searchState.setGuests}
      />
    </>
  )
}

export default HeroSection
