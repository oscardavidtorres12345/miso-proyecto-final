-- Align inventory-service data with search-db-init/02_seed.sql assumptions.
-- search seed creates:
-- - 25 properties with ids 1..25
-- - 3 rooms each => room_id 1..75
-- - inventory/rates for CURRENT_DATE + 0..9

-- 1) Keep stock universe aligned to room_id 1..75 and 10-day window.
DELETE FROM inventory_stock
WHERE room_id > 75;

DELETE FROM inventory_stock
WHERE room_id BETWEEN 1 AND 75
  AND (date < CURRENT_DATE OR date >= CURRENT_DATE + 10);

INSERT INTO inventory_stock (room_id, date, total_units, confirmed_units, held_units)
SELECT
    r.room_id,
    CURRENT_DATE + d.day_offset,
    5 AS total_units,
    0 AS confirmed_units,
    0 AS held_units
FROM generate_series(1, 75) AS r(room_id)
CROSS JOIN generate_series(0, 9) AS d(day_offset)
ON CONFLICT (room_id, date) DO NOTHING;

-- 2) Seed staff/property scope aligned with identity-db-init/07_staff_users.sql.
-- Expected staff user ids in seeded env:
--   1 -> staff_co, 2 -> staff_ar, 3 -> staff_us
-- Properties from search seed:
--   CO: 1..10, AR: 11..17, US: 18..25
INSERT INTO inventory_staff_property (staff_user_id, property_id, created_at)
SELECT
    CASE
        WHEN p.property_id BETWEEN 1 AND 10 THEN 1
        WHEN p.property_id BETWEEN 11 AND 17 THEN 2
        ELSE 3
    END AS staff_user_id,
    p.property_id,
    CURRENT_TIMESTAMP
FROM generate_series(1, 25) AS p(property_id)
ON CONFLICT (staff_user_id, property_id) DO NOTHING;

-- 3) Seed room rates aligned with room/property distribution from search seed.
-- property_name values mirror search-db-init/02_seed.sql props array (index = property_id).
INSERT INTO inventory_room_rate (
    room_id,
    property_id,
    property_name,
    staff_user_id,
    room_type,
    base_rate,
    offer_rate,
    offer_active,
    currency,
    updated_at
)
SELECT
    r.room_id,
    ((r.room_id - 1) / 3) + 1 AS property_id,
    CASE ((r.room_id - 1) / 3) + 1
        WHEN 1  THEN 'Casa del Mar'
        WHEN 2  THEN 'Villa Murallas'
        WHEN 3  THEN 'Nube Andina Hotel'
        WHEN 4  THEN 'La Candelaria Hostel'
        WHEN 5  THEN 'Hotel El Poblado'
        WHEN 6  THEN 'Cabaña Verde Guayabal'
        WHEN 7  THEN 'Tayrona Bay Resort'
        WHEN 8  THEN 'Villa Sierra Nevada'
        WHEN 9  THEN 'Hotel Carnaval'
        WHEN 10 THEN 'Hostal Puerto Colombia'
        WHEN 11 THEN 'Palermo Grand Hotel'
        WHEN 12 THEN 'San Telmo Roots'
        WHEN 13 THEN 'Hotel Viña del Sol'
        WHEN 14 THEN 'Villa Cordillera'
        WHEN 15 THEN 'Cabaña Lago Nahuel'
        WHEN 16 THEN 'Hotel Sierras Chicas'
        WHEN 17 THEN 'Paraná River Hotel'
        WHEN 18 THEN 'Ocean Drive Suites'
        WHEN 19 THEN 'Biscayne Bay Resort'
        WHEN 20 THEN 'Midtown Manhattan Inn'
        WHEN 21 THEN 'Brooklyn Social Hostel'
        WHEN 22 THEN 'Sunset Strip Hotel'
        WHEN 23 THEN 'Lakefront Chicago Hotel'
        WHEN 24 THEN 'The Strip Grand Resort'
        WHEN 25 THEN 'Neon Lights Boutique'
    END AS property_name,
    CASE
        WHEN ((r.room_id - 1) / 3) + 1 BETWEEN 1 AND 10 THEN 1
        WHEN ((r.room_id - 1) / 3) + 1 BETWEEN 11 AND 17 THEN 2
        ELSE 3
    END AS staff_user_id,
    CASE ((r.room_id - 1) % 3) + 1
        WHEN 1 THEN 'Suite Junior'
        WHEN 2 THEN 'Habitación estándar'
        ELSE 'Suite deluxe'
    END AS room_type,
    CASE ((r.room_id - 1) % 3) + 1
        WHEN 1 THEN 100000
        WHEN 2 THEN 150000
        ELSE 200000
    END AS base_rate,
    CASE ((r.room_id - 1) % 3) + 1
        WHEN 1 THEN 80000
        WHEN 2 THEN 120000
        ELSE 170000
    END AS offer_rate,
    TRUE AS offer_active,
    CASE
        WHEN ((r.room_id - 1) / 3) + 1 BETWEEN 1 AND 10 THEN 'COP'
        WHEN ((r.room_id - 1) / 3) + 1 BETWEEN 11 AND 17 THEN 'ARS'
        ELSE 'USD'
    END AS currency,
    CURRENT_TIMESTAMP
FROM generate_series(1, 75) AS r(room_id)
ON CONFLICT (room_id) DO UPDATE SET
    property_id   = EXCLUDED.property_id,
    property_name = EXCLUDED.property_name,
    staff_user_id = EXCLUDED.staff_user_id,
    room_type     = EXCLUDED.room_type,
    base_rate     = EXCLUDED.base_rate,
    offer_rate    = EXCLUDED.offer_rate,
    offer_active  = EXCLUDED.offer_active,
    currency      = EXCLUDED.currency,
    updated_at    = EXCLUDED.updated_at;
