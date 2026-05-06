-- Guest users seed for E2E tests
-- Plain-text password for all users: Guest2026!
-- SHA-256('Guest2026!') = 1afc14e1e0676836a23b602b0b8c1609da95e234c147e7b7d36b562a0a79c3cb
-- role_id=1 => GUEST (as inserted in 03_role.sql)

INSERT INTO public.user_account (username, email, password_hash, role_id, is_active) VALUES
    (
        'guest_e2e_co',
        'guest.e2e.co@travelhub.com',
        '1afc14e1e0676836a23b602b0b8c1609da95e234c147e7b7d36b562a0a79c3cb',
        1,
        true
    ),
    (
        'guest_e2e_ar',
        'guest.e2e.ar@travelhub.com',
        '1afc14e1e0676836a23b602b0b8c1609da95e234c147e7b7d36b562a0a79c3cb',
        1,
        true
    ),
    (
      'guest_e2e_us',
      'guest.e2e.us@travelhub.com',
      '1afc14e1e0676836a23b602b0b8c1609da95e234c147e7b7d36b562a0a79c3cb',
      1,
      true
    )
ON CONFLICT DO NOTHING;

-- Assign each guest user to the corresponding jurisdiction
INSERT INTO public.user_allowed_jurisdiction (user_id, jurisdiction_id)
SELECT u.user_id, j.jurisdiction_id
FROM public.user_account u
JOIN public.jurisdiction j
  ON (u.username = 'guest_e2e_co' AND j.iso_code = 'CO')
  OR (u.username = 'guest_e2e_ar' AND j.iso_code = 'AR')
  OR (u.username = 'guest_e2e_us' AND j.iso_code = 'US')
WHERE NOT EXISTS (
    SELECT 1
    FROM public.user_allowed_jurisdiction uaj
    WHERE uaj.user_id = u.user_id
      AND uaj.jurisdiction_id = j.jurisdiction_id
);

-- Create guest profiles linked to user accounts
INSERT INTO public.guest (user_id, full_name, document_type_id, document_id, contact_email, jurisdiction_id)
SELECT u.user_id, 'Guest E2E Colombia', 2, 'E2E-CO-0001', 'guest.e2e.co@travelhub.com', j.jurisdiction_id
FROM public.user_account u
JOIN public.jurisdiction j ON j.iso_code = 'CO'
WHERE u.username = 'guest_e2e_co'
  AND NOT EXISTS (
      SELECT 1
      FROM public.guest g
      WHERE g.contact_email = 'guest.e2e.co@travelhub.com'
  );

INSERT INTO public.guest (user_id, full_name, document_type_id, document_id, contact_email, jurisdiction_id)
SELECT u.user_id, 'Guest E2E Argentina', 1, 'E2E-AR-0001', 'guest.e2e.ar@travelhub.com', j.jurisdiction_id
FROM public.user_account u
JOIN public.jurisdiction j ON j.iso_code = 'AR'
WHERE u.username = 'guest_e2e_ar'
  AND NOT EXISTS (
      SELECT 1
      FROM public.guest g
      WHERE g.contact_email = 'guest.e2e.ar@travelhub.com'
  );

INSERT INTO public.guest (user_id, full_name, document_type_id, document_id, contact_email, jurisdiction_id)
SELECT u.user_id, 'Guest E2E United States', 2, 'E2E-US-0001', 'guest.e2e.us@travelhub.com', j.jurisdiction_id
FROM public.user_account u
JOIN public.jurisdiction j ON j.iso_code = 'US'
WHERE u.username = 'guest_e2e_us'
  AND NOT EXISTS (
      SELECT 1
      FROM public.guest g
      WHERE g.contact_email = 'guest.e2e.us@travelhub.com'
  );
