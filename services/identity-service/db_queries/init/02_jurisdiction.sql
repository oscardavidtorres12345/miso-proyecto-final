INSERT INTO public.jurisdiction (
    iso_code,
    region_name,
    applicable_regulation,
    privacy_title,
    privacy_content,
    privacy_pdf_url,
    privacy_version,
    privacy_effective_at,
    privacy_contact_email,
    created_at
) VALUES
    (
        'CO',
        'COLOMBIA',
        'Ley 1581 de 2012 y Decreto 1377 de 2013',
        'Politica de Tratamiento de Datos Personales',
        'Responsable: Travel Hub S.A.S (privacidad@travelhub.com). Finalidad: creacion de cuenta, reservas y servicios turisticos, notificaciones de seguridad y cumplimiento legal. Derechos: conocer, actualizar, rectificar, suprimir y revocar autorizacion.',
        '["https://uniandes-my.sharepoint.com/:b:/g/personal/e_herediar_uniandes_edu_co/IQDfAt4CuetaTqg6H1CsA3JyAfu5S6LZt31CTtdUQJoBOJ0?e=2kIrr5","https://uniandes-my.sharepoint.com/:b:/g/personal/e_herediar_uniandes_edu_co/IQC8ooGRFuiXR4wKY7e6xN4nAV_dY6adx6kQxS4g5GVREI4?e=615J1C"]'::jsonb,
        '2026.03',
        '2026-03-28 00:00:00-05',
        'privacidad@travelhub.com',
        '2026-03-26 19:56:40.17349-05'
    ),
    (
        'AR',
        'ARGENTINA',
        'Ley de Proteccion de Datos Personales N 25.326',
        'Terminos de Privacidad y Proteccion de Datos',
        'Consentimiento libre, expreso e informado para incorporacion de datos. Finalidad: prestacion de intermediacion turistica y optimizacion de plataforma. Seguridad y confidencialidad con medidas tecnicas y organizativas. Derecho de acceso gratuito cada seis meses.',
        '["https://uniandes-my.sharepoint.com/:b:/g/personal/e_herediar_uniandes_edu_co/IQAhJ8hl6ZqxQYTztkNZmvyPAdsB3eFkwOwDulzTJHQotFY?e=PitbrG"]'::jsonb,
        '2026.03',
        '2026-03-28 00:00:00-05',
        'privacidad@travelhub.com',
        '2026-03-26 19:57:30.355181-05'
    ),
    (
        'US',
        'UNITED STATES',
        'Privacy Act and state standards including CCPA',
        'Privacy Policy and Data Processing Agreement',
        'Information collection: identifiers, travel history and internet activity. Purpose: service operation, identity verification and fraud prevention. Data sharing only with required providers. International transfers may apply.',
        '["https://uniandes-my.sharepoint.com/:b:/g/personal/e_herediar_uniandes_edu_co/IQBkb9IwKMJ0SamRC_fy5hSdAYkFjJGoCGSPzmNGCn-a7rQ?e=EKwf6e"]'::jsonb,
        '2026.03',
        '2026-03-28 00:00:00-05',
        'privacidad@travelhub.com',
        '2026-03-26 20:00:01.344361-05'
    );
