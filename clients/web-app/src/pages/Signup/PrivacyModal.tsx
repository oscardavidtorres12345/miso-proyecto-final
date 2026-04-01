import { useTranslation } from 'react-i18next'
import Modal from '@/components/Modal'
import { PrivacyNoticeResponse } from '@/services/identityService'
import './PrivacyModal.css'

interface PrivacyModalProps {
  isOpen: boolean
  onClose: () => void
  privacyNotice: PrivacyNoticeResponse | null
}

const PrivacyModal = ({ isOpen, onClose, privacyNotice }: PrivacyModalProps) => {
  const { t } = useTranslation()

  if (!privacyNotice) return null

  const hasPdfs = privacyNotice.privacy_pdf_url.length > 0

  const body = (
    <>
      <p className={`privacy-modal__content${hasPdfs ? ' privacy-modal__content--with-links' : ''}`}>
        {privacyNotice.privacy_content}
      </p>

      {
        hasPdfs && (
          <div className="privacy-modal__links">
            <p>
              {t('signup.privacyLinksIntro')}
              {
                privacyNotice.privacy_pdf_url.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="privacy-modal__link"
                  >
                    {t('signup.privacyLinkLabel', { number: i + 1 })}
                  </a>
                ))
              }
            </p>
          </div>
        )
      }
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={privacyNotice.privacy_title}
      body={body}
    />
  )
}

export default PrivacyModal
