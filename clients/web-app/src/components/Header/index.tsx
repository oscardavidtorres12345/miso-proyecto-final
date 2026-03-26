import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, Globe } from 'lucide-react'
import logo from '@/assets/logo.svg'
import Button from '@/components/Button'
import Container from '@/components/Container'
import './Header.css'

const COUNTRIES = [
  { code: 'co', label: 'Colombia' },
  { code: 'ar', label: 'Argentina' },
  { code: 'us', label: 'Estados Unidos' },
]

const flagUrl = (code: string) => `https://flagcdn.com/w80/${code}.png`

interface HeaderProps {
  showCart?: boolean
  showLogin?: boolean
  showMenu?: boolean
  showFlag?: boolean
}

const Header = ({ showCart, showLogin, showMenu, showFlag }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])

  const menuRef = useRef<HTMLDivElement>(null)
  const flagRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (flagRef.current && !flagRef.current.contains(e.target as Node)) {
        setFlagOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="header">
      <Container>
        <div className="header__inner">
          <a href="/" className="header__logo">
            <img src={logo} alt="Travel Hub" className="header__logo-img" />
          </a>

          <div className="header__actions">
            {showCart && (
              <button className="header__icon-btn" aria-label="Cart">
                <ShoppingCart size={20} />
              </button>
            )}

            {showLogin && (
              <Button variant="outline" className="header__login-btn">
                Login
              </Button>
            )}

            {showMenu && (
              <div className="header__menu-wrapper" ref={menuRef}>
                <button
                  className="header__menu-btn"
                  aria-label="Menu"
                  onClick={() => setMenuOpen(prev => !prev)}
                >
                  A
                </button>
                {menuOpen && (
                  <div className="header__dropdown">
                    <button className="header__dropdown-item">
                      <Globe size={18} />
                      Mis reservas
                    </button>
                  </div>
                )}
              </div>
            )}

            {showFlag && (
              <div className="header__menu-wrapper" ref={flagRef}>
                <button
                  className="header__flag"
                  aria-label="Seleccionar país"
                  onClick={() => setFlagOpen(prev => !prev)}
                >
                  <img src={flagUrl(selectedCountry.code)} alt={selectedCountry.label} className="header__flag-img" />
                </button>
                {flagOpen && (
                  <div className="header__dropdown">
                    {COUNTRIES.map(country => (
                      <button
                        key={country.code}
                        className="header__dropdown-item"
                        onClick={() => { setSelectedCountry(country); setFlagOpen(false) }}
                      >
                        <img src={flagUrl(country.code)} alt={country.label} className="header__dropdown-flag" />
                        {country.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  )
}

export default Header
