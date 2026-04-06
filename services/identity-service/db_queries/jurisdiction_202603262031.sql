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
        '["https://drive.google.com/file/d/1mJmE6Y_Ekrh9FeErKk6SVNchuVKdDn8y/view?usp=drive_link","https://drive.google.com/file/d/1LKzT8uD6GirfM4h8AMHPgXkir3ooawnK/view?usp=drive_link"]'::jsonb,
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
        '["https://drive.google.com/file/d/1AG0c1wFMHhnOVmEOaxmQerlk8eHQ6lu4/view?usp=sharing"]'::jsonb,
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
        '["https://drive.google.com/file/d/1qFOJmRNu9EJY8domEd_cR_KfFnREV5Hm/view?usp=drive_link"]'::jsonb,
        '2026.03',
        '2026-03-28 00:00:00-05',
        'privacidad@travelhub.com',
        '2026-03-26 20:00:01.344361-05'
    );
