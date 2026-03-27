import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Globe } from 'lucide-react'
import logo from '@/assets/logo.svg'
import Button from '@/components/Button'
import Container from '@/components/Container'
import { useI18n, COUNTRIES } from '@/context/I18nContext'
import './Header.css'

const flagUrl = (code: string) => `https://flagcdn.com/w80/${code}.png`

interface HeaderProps {
  showCart?: boolean
  showLogin?: boolean
  showMenu?: boolean
  showFlag?: boolean
}

const Header = ({ showCart, showLogin, showMenu, showFlag }: HeaderProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selectedCountry, setSelectedCountry } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)

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
              <Button variant="outline" className="header__login-btn" onClick={() => navigate('/login')}>
                {t('header.login')}
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
                      {t('header.myBookings')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {showFlag && (
              <div className="header__menu-wrapper" ref={flagRef}>
                <button
                  className="header__flag"
                  aria-label={t('header.selectCountry')}
                  onClick={() => setFlagOpen(prev => !prev)}
                >
                  <img src={flagUrl(selectedCountry.code)} alt={t(`header.countries.${selectedCountry.code}`)} className="header__flag-img" />
                </button>
                {flagOpen && (
                  <div className="header__dropdown">
                    {COUNTRIES.map(country => (
                      <button
                        key={country.code}
                        className="header__dropdown-item"
                        onClick={() => { setSelectedCountry(country); setFlagOpen(false) }}
                      >
                        <img src={flagUrl(country.code)} alt={t(`header.countries.${country.code}`)} className="header__dropdown-flag" />
                        {t(`header.countries.${country.code}`)}
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
