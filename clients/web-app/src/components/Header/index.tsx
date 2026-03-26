import { ShoppingCart } from 'lucide-react'
import Container from '@/components/Container'
import './Header.css'

const Header = () => (
  <header className="header">
    <Container>
      <div className="header__inner">
        <a href="/" className="header__logo">
          <span className="header__logo-badge">Travel</span>
          <span className="header__logo-text">Hub</span>
        </a>

        <div className="header__actions">
          <button className="header__icon-btn" aria-label="Cart">
            <ShoppingCart size={20} />
          </button>
          <div className="header__flag" aria-label="Colombia">
            🇨🇴
          </div>
        </div>
      </div>
    </Container>
  </header>
)

export default Header
