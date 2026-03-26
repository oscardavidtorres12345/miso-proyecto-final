import Container from '@/components/Container'
import './PopularDestinationsSection.css'

interface Destination {
  id: number
  city: string
  image: string
}

const destinations: Destination[] = [
  { id: 1, city: 'Cartagena', image: 'https://picsum.photos/seed/cartagena/286/270' },
  { id: 2, city: 'Medellín', image: 'https://picsum.photos/seed/medellin/286/270' },
  { id: 3, city: 'Bogotá', image: 'https://picsum.photos/seed/bogota/286/270' },
  { id: 4, city: 'Santa Marta', image: 'https://picsum.photos/seed/santamarta/286/270' },
]

const PopularDestinationsSection = () => (
  <section className="destinations page-section">
    <Container>
      <p className="section-label">Destinos populares</p>
      <h2 className="section-heading">Descubre destinos populares</h2>
    </Container>
    <Container className="destinations__scroll-wrapper">
      <div className="destinations__cards">
        {destinations.map(({ id, city, image }) => (
          <div key={id} className="destination-card">
            <img src={image} alt={city} className="destination-card__image" />
            <p className="destination-card__city">{city}</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
)

export default PopularDestinationsSection
