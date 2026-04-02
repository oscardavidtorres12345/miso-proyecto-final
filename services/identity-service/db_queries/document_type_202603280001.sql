CREATE TABLE IF NOT EXISTS DOCUMENT_TYPE (
    document_type_id INT PRIMARY KEY,
    document_type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO public.document_type (document_type_id, document_type_name, description) VALUES
    (1, 'DNI', 'Documento nacional de identidad'),
    (2, 'PASAPORTE', 'Documento de viaje internacional')
ON CONFLICT (document_type_id) DO NOTHING;

ALTER TABLE public.guest
ADD COLUMN IF NOT EXISTS document_type_id INT;

UPDATE public.guest
SET document_type_id = 1
WHERE document_type_id IS NULL;

ALTER TABLE public.guest
ALTER COLUMN document_type_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'guest_document_type_id_fkey'
    ) THEN
        ALTER TABLE public.guest
        ADD CONSTRAINT guest_document_type_id_fkey
        FOREIGN KEY (document_type_id)
        REFERENCES public.document_type(document_type_id);
    END IF;
END
$$;
