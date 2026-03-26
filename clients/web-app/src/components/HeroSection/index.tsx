import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import coverImage from '@/assets/cover_image.png'
import Button from '@/components/Button'
import Container from '@/components/Container'
import SearchBar from '@/components/SearchBar'
import SearchBottomSheet from '@/components/SearchBottomSheet'
import { useSearch } from '@/context/SearchContext'
import './HeroSection.css'

const HeroSection = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const navigate = useNavigate()
  const searchState = useSearch()

  return (
    <>
      <section className="hero">
        <Container>
          <div className="hero__grid">
            <div className="hero__content flex flex-col">
              <span className="hero__subtitle font-semibold text-secondary leading-tight">
                Descubre tus proximas vacaciones
              </span>
              <h1 className="hero__title font-bold text-secondary">
                La vida es corta y el mundo es grande.
              </h1>
              <div className="hero__search">
                <SearchBar
                  destination={searchState.destination}
                  setDestination={searchState.setDestination}
                  dateRange={searchState.dateRange}
                  setDateRange={searchState.setDateRange}
                  guests={searchState.guests}
                  setGuests={searchState.setGuests}
                  onSearch={() => navigate('/search')}
                />
              </div>
              <div className="hero__search-button-wrapper">
                <Button
                  variant="primary"
                  className="hero__search-button"
                  onClick={() => setIsSheetOpen(true)}
                >
                  Buscar
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
        onSearch={() => { setIsSheetOpen(false); navigate('/search') }}
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
