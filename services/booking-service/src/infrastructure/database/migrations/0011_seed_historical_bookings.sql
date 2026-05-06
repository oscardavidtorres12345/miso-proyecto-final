-- Inserta ~180 reservas CONFIRMED distribuidas en los 60 días anteriores a
-- CURRENT_DATE para que el dashboard portal/dashboard tenga datos históricos.
--
-- Propiedades incluidas (alineado con search-db-init/02_seed.sql):
--   prop  1 → Casa del Mar,         Cartagena,    rooms 1-3,   COP, staff 1
--   prop  3 → Nube Andina Hotel,     Bogota,       rooms 7-9,   COP, staff 1
--   prop  5 → Hotel El Poblado,      Medellin,     rooms 13-15, COP, staff 1
--   prop  7 → Tayrona Bay Resort,    Santa Marta,  rooms 19-21, COP, staff 1
--   prop 11 → Palermo Grand Hotel,   Buenos Aires, rooms 31-33, ARS, staff 2
--   prop 13 → Hotel Viña del Sol,    Mendoza,      rooms 37-39, ARS, staff 2
--   prop 18 → Ocean Drive Suites,    Miami,        rooms 52-54, USD, staff 3
--   prop 22 → Sunset Strip Hotel,    Los Angeles,  rooms 64-66, USD, staff 3
--
-- room_id = (property_id - 1) * 3 + room_index  (room_index ∈ {1,2,3})
-- Tarifas/noche: Doble 80 000 | King 120 000 | Sencilla 170 000

INSERT INTO booking (
    booking_id,
    hold_id,
    room_id,
    property_id,
    user_id,
    check_in,
    check_out,
    units,
    guest_count,
    room_type,
    status,
    payment_summary_json,
    property_name,
    city,
    created_at,
    hotel_confirmed_at,
    expires_at,
    updated_at
)
SELECT
    'seed-hist-' || to_char(c.check_in, 'YYYYMMDD')
        || '-P' || p.prop_id
        || '-R' || c.room_idx
        || '-S' || c.slot,
    'hold-seed-' || to_char(c.check_in, 'YYYYMMDD')
        || '-P' || p.prop_id
        || '-R' || c.room_idx
        || '-S' || c.slot,
    (p.prop_id - 1) * 3 + c.room_idx,
    p.prop_id,
    'seed-guest-' || ((c.day_offset * 3 + c.slot) % 20 + 1),
    c.check_in,
    c.check_in + c.nights,
    1,
    CASE c.room_idx WHEN 1 THEN 2 WHEN 2 THEN 3 ELSE 1 END,
    CASE c.room_idx
        WHEN 1 THEN 'Habitación Doble'
        WHEN 2 THEN 'Suite King'
        ELSE        'Habitación Sencilla'
    END,
    'CONFIRMED',
    '{"total":' || (CASE c.room_idx WHEN 1 THEN 80000 WHEN 2 THEN 120000 ELSE 170000 END * c.nights)::text
        || ',"currency":"' || p.currency || '"}',
    p.prop_name,
    p.city,
    (c.check_in - INTERVAL '3 days')::TIMESTAMP,
    (c.check_in - INTERVAL '1 day')::TIMESTAMP,
    (c.check_in - INTERVAL '3 days' + INTERVAL '1 hour')::TIMESTAMP,
    (c.check_in - INTERVAL '1 day')::TIMESTAMP
FROM (
    SELECT
        (d.dt::date - (CURRENT_DATE - INTERVAL '60 days')::date) AS day_offset,
        s.n                                                        AS slot,
        d.dt::date                                                 AS check_in,
        ((d.dt::date - (CURRENT_DATE - INTERVAL '60 days')::date) % 4) + 1 AS nights,
        (((d.dt::date - (CURRENT_DATE - INTERVAL '60 days')::date) * 3 + s.n) % 8) + 1 AS prop_rank,
        (((d.dt::date - (CURRENT_DATE - INTERVAL '60 days')::date) + s.n * 3) % 3) + 1 AS room_idx
    FROM generate_series(
        CURRENT_DATE - INTERVAL '60 days',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    ) AS d(dt)
    CROSS JOIN generate_series(0, 2) AS s(n)
) AS c
JOIN (VALUES
    (1, 1,  'Casa del Mar',        'Cartagena',    'COP'),
    (2, 3,  'Nube Andina Hotel',   'Bogota',       'COP'),
    (3, 5,  'Hotel El Poblado',    'Medellin',     'COP'),
    (4, 7,  'Tayrona Bay Resort',  'Santa Marta',  'COP'),
    (5, 11, 'Palermo Grand Hotel', 'Buenos Aires', 'ARS'),
    (6, 13, 'Hotel Viña del Sol',  'Mendoza',      'ARS'),
    (7, 18, 'Ocean Drive Suites',  'Miami',        'USD'),
    (8, 22, 'Sunset Strip Hotel',  'Los Angeles',  'USD')
) AS p(rank, prop_id, prop_name, city, currency) ON c.prop_rank = p.rank
ON CONFLICT (booking_id) DO NOTHING
