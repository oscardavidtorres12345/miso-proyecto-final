import certificateIcon from '@/assets/certificate.svg'
import cloudIcon from '@/assets/computing_cloud.svg'
import moneyIcon from '@/assets/money_cash.svg'
import padlockIcon from '@/assets/padlock.svg'
import Container from '@/components/Container'
import './FeaturesSection.css'

const features = [
  {
    icon: padlockIcon,
    title: 'Reservas seguras',
    description: 'Reserva con total confianza. Tus pagos y datos están protegidos en todo momento.',
  },
  {
    icon: certificateIcon,
    title: 'Mejores precios',
    description: 'Comparamos tarifas para que siempre encuentres la mejor opción disponible.',
  },
  {
    icon: cloudIcon,
    title: 'Cancelación flexible',
    description: 'Cambia de planes sin estrés. Muchas propiedades permiten cancelación con reembolso.',
  },
  {
    icon: moneyIcon,
    title: 'Paga en tu moneda',
    description: 'Ve los precios en tu moneda local, sin sorpresas al finalizar.',
  },
]

const FeaturesSection = () => (
  <section className="features page-section">
    <Container>
      <div className="features__grid">
        {features.map(({ icon, title, description }) => (
          <div key={title} className="features__card">
            <img src={icon} alt="" aria-hidden="true" className="features__icon" />
            <h3 className="features__title">{title}</h3>
            <p className="features__description">{description}</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
)

export default FeaturesSection
