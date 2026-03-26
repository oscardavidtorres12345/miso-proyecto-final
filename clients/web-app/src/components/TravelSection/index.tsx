import mountainImg from '@/assets/mountain.png'
import seaImg from '@/assets/sea.png'
import Container from '@/components/Container'
import './TravelSection.css'

const TravelSection = () => (
  <section className="travel page-section">
    <Container>
      <div className="travel__grid">
        <div className="travel__images">
          <div className="travel__mountain-wrapper">
            <img src={mountainImg} alt="Aventura en montaña" className="travel__img" />
          </div>
          <div className="travel__sea-wrapper">
            <img src={seaImg} alt="Destino de mar" className="travel__img" />
          </div>
        </div>

        <div className="travel__content">
          <p className="section-label">Punto de viaje</p>
          <h2 className="section-heading">Te ayudamos a encontrar las vacaciones de tus sueños</h2>
          <p className="travel__text">
            Te acompañamos en cada paso de tu aventura, desde la búsqueda del destino perfecto
            hasta la reserva de tu alojamiento ideal. Con miles de opciones disponibles alrededor
            del mundo, encontrarás el lugar que se adapta a tu estilo de vida, tu presupuesto y
            todo lo que siempre has soñado vivir. Descubre nuevos horizontes con la tranquilidad
            de saber que cada detalle está en buenas manos.
          </p>
        </div>
      </div>
    </Container>
  </section>
)

export default TravelSection
