import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import Input from '@/components/Input'

interface DestinationInputProps {
  value: string
  onChange: (value: string) => void
}

const DestinationInput = ({ value, onChange }: DestinationInputProps) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col flex-1 min-w-0">
      <span className="input-field-label font-bold text-black">{t('search.destination')}</span>
      <div className="flex items-center gap-1">
        <MapPin className="input-field-icon text-primary" />
        <div className="input-box flex-1">
          <Input
            type="text"
            placeholder={t('search.wherePlaceholder')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

export default DestinationInput
