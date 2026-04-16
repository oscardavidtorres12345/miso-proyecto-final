-- Staff users seed: one per jurisdiction (Colombia, Argentina, United States)
-- Passwords are SHA-256 hashed (hashlib.sha256) as used in registration_service.py
-- Plain-text password for all three: Staff2026!
-- SHA-256('Staff2026!') = 4de15dda634c5c898899b3383b32fee8c8f69bd783c043b7e423bac1c1f6c329
-- role_id=3 => STAFF (as inserted in 03_role.sql: GUEST=1, ADMIN=2, STAFF=3)

INSERT INTO public.user_account (username, email, password_hash, role_id, is_active) VALUES
    (
        'staff_co',
        'staff.colombia@travelhub.com',
        '4de15dda634c5c898899b3383b32fee8c8f69bd783c043b7e423bac1c1f6c329',
        3,
        true
    ),
    (
        'staff_ar',
        'staff.argentina@travelhub.com',
        '4de15dda634c5c898899b3383b32fee8c8f69bd783c043b7e423bac1c1f6c329',
        3,
        true
    ),
    (
        'staff_us',
        'staff.unitedstates@travelhub.com',
        '4de15dda634c5c898899b3383b32fee8c8f69bd783c043b7e423bac1c1f6c329',
        3,
        true
    );

-- Assign each staff user to their corresponding jurisdiction
INSERT INTO public.user_allowed_jurisdiction (user_id, jurisdiction_id)
SELECT u.user_id, j.jurisdiction_id
FROM public.user_account u, public.jurisdiction j
WHERE (u.username = 'staff_co'  AND j.iso_code = 'CO')
   OR (u.username = 'staff_ar'  AND j.iso_code = 'AR')
   OR (u.username = 'staff_us'  AND j.iso_code = 'US');
