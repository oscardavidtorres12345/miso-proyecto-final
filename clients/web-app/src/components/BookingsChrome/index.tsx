import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Container from '@/components/Container'
import { cn } from '@/lib/utils'
import '@/components/Button/Button.css'
import './BookingsChrome.css'

type BookingsChromeProps = {
  titleKey: string
  switchHref: string
  switchLabelKey: string
  children: React.ReactNode
}

const BookingsChrome = ({ titleKey, switchHref, switchLabelKey, children }: BookingsChromeProps) => {
  const { t } = useTranslation()
  return (
    <main className="bookings-page">
      <Container>
        <div className="bookings-page__head">
          <h1 className="bookings-page__title">{t(titleKey)}</h1>
          <Link to={switchHref} className={cn('btn', 'btn--primary', 'bookings-page__switch')}>
            {t(switchLabelKey)}
          </Link>
        </div>
        {children}
      </Container>
    </main>
  )
}

export default BookingsChrome
