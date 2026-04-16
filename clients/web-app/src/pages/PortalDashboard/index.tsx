import { useTranslation } from 'react-i18next'
import './PortalDashboard.css'

const PortalDashboard = () => {
  const { t } = useTranslation()

  return (
    <div className="portal-dashboard">
      <h1 className="portal-dashboard__title">{t('portalDashboard.title')}</h1>
      <p className="portal-dashboard__subtitle">{t('portalDashboard.subtitle')}</p>
    </div>
  )
}

export default PortalDashboard
