ALTER TABLE public.jurisdiction
ADD COLUMN IF NOT EXISTS privacy_title VARCHAR(200),
ADD COLUMN IF NOT EXISTS privacy_content TEXT,
ADD COLUMN IF NOT EXISTS privacy_pdf_url JSONB,
ADD COLUMN IF NOT EXISTS privacy_version VARCHAR(30),
ADD COLUMN IF NOT EXISTS privacy_effective_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_contact_email VARCHAR(100);

UPDATE public.jurisdiction
SET
    privacy_title = COALESCE(privacy_title, 'Politica de Tratamiento de Datos Personales'),
    privacy_content = COALESCE(
        privacy_content,
        'Politica de privacidad y tratamiento de datos personales de Travel Hub S.A.S.'
    ),
    privacy_pdf_url = COALESCE(
        privacy_pdf_url,
        '["https://onedrive.live.com/?cid=travelhub&resid=default-privacy-policy-pdf"]'::jsonb
    ),
    privacy_version = COALESCE(privacy_version, '2026.03'),
    privacy_contact_email = COALESCE(privacy_contact_email, 'privacidad@travelhub.com')
WHERE iso_code IN ('CO', 'AR', 'US');

ALTER TABLE public.jurisdiction
ALTER COLUMN privacy_title SET NOT NULL,
ALTER COLUMN privacy_content SET NOT NULL,
ALTER COLUMN privacy_pdf_url SET NOT NULL,
ALTER COLUMN privacy_version SET NOT NULL,
ALTER COLUMN privacy_contact_email SET NOT NULL;
