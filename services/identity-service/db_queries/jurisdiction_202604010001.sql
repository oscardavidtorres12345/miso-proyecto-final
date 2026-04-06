UPDATE public.jurisdiction
SET privacy_pdf_url = CASE iso_code
    WHEN 'CO' THEN '["https://drive.google.com/file/d/1mJmE6Y_Ekrh9FeErKk6SVNchuVKdDn8y/view?usp=drive_link","https://drive.google.com/file/d/1LKzT8uD6GirfM4h8AMHPgXkir3ooawnK/view?usp=drive_link"]'::jsonb
    WHEN 'AR' THEN '["https://drive.google.com/file/d/1AG0c1wFMHhnOVmEOaxmQerlk8eHQ6lu4/view?usp=sharing"]'::jsonb
    WHEN 'US' THEN '["https://drive.google.com/file/d/1qFOJmRNu9EJY8domEd_cR_KfFnREV5Hm/view?usp=drive_link"]'::jsonb
    ELSE privacy_pdf_url
END
WHERE iso_code IN ('CO', 'AR', 'US');
