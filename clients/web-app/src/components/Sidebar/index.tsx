import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, BookOpen, LayoutDashboard, MessageSquare, Tag } from 'lucide-react'
import logo from '@/assets/logo.svg'
import './Sidebar.css'

const NAV_ITEMS = [
  { key: 'dashboard',      path: '/portal/dashboard',     icon: LayoutDashboard },
  { key: 'monthlyReport',  path: '/portal/reports',       icon: BarChart3 },
  { key: 'rateManagement', path: '/portal/rates',         icon: Tag },
  { key: 'feedback',       path: '/portal/feedback',      icon: MessageSquare },
  { key: 'reservations',   path: '/portal/reservations',  icon: BookOpen },
] as const

const Sidebar = () => {
  const { t } = useTranslation()

  return (
    <aside className="sidebar">
      <NavLink to="/portal/dashboard" className="sidebar__logo">
        <img src={logo} alt="Travel Hub" className="sidebar__logo-img" />
      </NavLink>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ key, path, icon: Icon }) => (
          <NavLink
            key={key}
            to={path}
            className={({ isActive }) =>
              `sidebar__item${isActive ? ' sidebar__item--active' : ''}`
            }
          >
            <Icon size={18} aria-hidden />
            {t(`sidebar.${key}`)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
