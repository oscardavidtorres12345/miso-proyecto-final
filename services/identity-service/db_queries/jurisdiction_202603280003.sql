DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'jurisdiction'
          AND column_name = 'privacy_pdf_url'
          AND data_type IN ('text', 'character varying')
    ) THEN
        ALTER TABLE public.jurisdiction
        ALTER COLUMN privacy_pdf_url TYPE JSONB
        USING CASE
            WHEN privacy_pdf_url IS NULL THEN '[]'::jsonb
            WHEN left(trim(privacy_pdf_url), 1) = '[' THEN privacy_pdf_url::jsonb
            ELSE jsonb_build_array(privacy_pdf_url)
        END;
    END IF;
END $$;

UPDATE public.jurisdiction
SET privacy_pdf_url = '[]'::jsonb
WHERE privacy_pdf_url IS NULL;
