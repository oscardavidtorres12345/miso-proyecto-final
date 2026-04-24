-- Re-seed inventory_room_rate with one row per (room_id, currency).
-- Each of the 75 rooms gets rates in COP, ARS and USD.
-- Property/staff mapping mirrors 0007_seed_rates_search_aligned.sql.

DELETE FROM inventory_room_rate;

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
        WHEN ((r.room_id - 1) / 3) + 1 BETWEEN 1  AND 10 THEN 1
        WHEN ((r.room_id - 1) / 3) + 1 BETWEEN 11 AND 17 THEN 2
        ELSE 3
    END AS staff_user_id,
    CASE ((r.room_id - 1) % 3) + 1
        WHEN 1 THEN 'Suite Junior'
        WHEN 2 THEN 'Habitación estándar'
        ELSE        'Suite deluxe'
    END AS room_type,
    CASE c.currency
        WHEN 'COP' THEN
            CASE ((r.room_id - 1) % 3) + 1
                WHEN 1 THEN 100000
                WHEN 2 THEN 150000
                ELSE        200000
            END
        WHEN 'ARS' THEN
            CASE ((r.room_id - 1) % 3) + 1
                WHEN 1 THEN 50000
                WHEN 2 THEN 75000
                ELSE        100000
            END
        ELSE -- USD
            CASE ((r.room_id - 1) % 3) + 1
                WHEN 1 THEN 25
                WHEN 2 THEN 37
                ELSE        50
            END
    END AS base_rate,
    CASE c.currency
        WHEN 'COP' THEN
            CASE ((r.room_id - 1) % 3) + 1
                WHEN 1 THEN 80000
                WHEN 2 THEN 120000
                ELSE        170000
            END
        WHEN 'ARS' THEN
            CASE ((r.room_id - 1) % 3) + 1
                WHEN 1 THEN 40000
                WHEN 2 THEN 60000
                ELSE        85000
            END
        ELSE -- USD
            CASE ((r.room_id - 1) % 3) + 1
                WHEN 1 THEN 20
                WHEN 2 THEN 30
                ELSE        42
            END
    END AS offer_rate,
    TRUE AS offer_active,
    c.currency,
    CURRENT_TIMESTAMP
FROM generate_series(1, 75) AS r(room_id)
CROSS JOIN (VALUES ('COP'), ('ARS'), ('USD')) AS c(currency)
ON CONFLICT (room_id, currency) DO UPDATE SET
    property_id   = EXCLUDED.property_id,
    property_name = EXCLUDED.property_name,
    staff_user_id = EXCLUDED.staff_user_id,
    room_type     = EXCLUDED.room_type,
    base_rate     = EXCLUDED.base_rate,
    offer_rate    = EXCLUDED.offer_rate,
    offer_active  = EXCLUDED.offer_active,
    updated_at    = EXCLUDED.updated_at;
