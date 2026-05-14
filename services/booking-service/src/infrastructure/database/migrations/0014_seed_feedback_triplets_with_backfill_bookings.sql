-- Backfill para garantizar 3 reviews por propiedad en feedback.
-- Crea reservas históricas mínimas cuando faltan y luego inserta reviews.

WITH target_properties AS (
    -- Propiedades visibles hoy en feedback/demo
    SELECT * FROM (VALUES
        (1, 'Casa del Mar', 'Cartagena'),
        (2, 'Sierra Nevada Lodge', 'Santa Marta'),
        (3, 'Nube Andina Hotel', 'Bogota'),
        (6, 'Hospedaje Cafetero', 'Manizales')
    ) AS t(property_id, property_name, city)
),
counts AS (
    SELECT
        t.property_id,
        t.property_name,
        t.city,
        COALESCE(r.review_count, 0) AS review_count
    FROM target_properties t
    LEFT JOIN (
        SELECT property_id, COUNT(*)::int AS review_count
        FROM review
        GROUP BY property_id
    ) r
      ON r.property_id = t.property_id
),
missing AS (
    SELECT
        c.property_id,
        c.property_name,
        c.city,
        gs AS slot
    FROM counts c
    CROSS JOIN LATERAL generate_series(1, GREATEST(0, 3 - c.review_count)) gs
),
inserted_bookings AS (
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
        checked_in_at,
        expires_at,
        updated_at
    )
    SELECT
        'seed-fb-' || m.property_id || '-' || m.slot,
        'hold-seed-fb-' || m.property_id || '-' || m.slot,
        (m.property_id - 1) * 3 + MOD((m.slot - 1), 3) + 1,
        m.property_id,
        'seed-feedback-user-' || m.property_id || '-' || m.slot,
        (CURRENT_DATE - (20 + m.slot))::date,
        (CURRENT_DATE - (18 + m.slot))::date,
        1,
        CASE WHEN m.slot = 2 THEN 3 ELSE 2 END,
        CASE m.slot
            WHEN 1 THEN 'Habitación Doble'
            WHEN 2 THEN 'Suite King'
            ELSE 'Habitación Sencilla'
        END,
        'CONFIRMED',
        json_build_object('total', 420000, 'currency', 'COP')::text,
        m.property_name,
        m.city,
        (CURRENT_TIMESTAMP - INTERVAL '25 days'),
        (CURRENT_TIMESTAMP - INTERVAL '19 days'),
        (CURRENT_TIMESTAMP - INTERVAL '18 days'),
        NULL,
        (CURRENT_TIMESTAMP - INTERVAL '18 days')
    FROM missing m
    ON CONFLICT (booking_id) DO NOTHING
    RETURNING booking_id, property_id, room_id, property_name, room_type, user_id
)
INSERT INTO review (
    booking_id,
    property_id,
    room_id,
    hotel_name,
    room_name,
    guest_name,
    guest_username,
    guest_avatar_url,
    rating,
    comment,
    review_date
)
SELECT
    b.booking_id,
    b.property_id,
    b.room_id,
    b.property_name,
    b.room_type,
    CASE MOD((ROW_NUMBER() OVER (PARTITION BY b.property_id ORDER BY b.booking_id))::int, 3)
        WHEN 1 THEN 'Laura Pérez'
        WHEN 2 THEN 'Sebastián Díaz'
        ELSE 'Camila Torres'
    END,
    'guest_' || b.user_id,
    'https://i.pravatar.cc/120?img=' || ((ABS(hashtext(b.user_id)) % 70) + 1),
    CASE MOD((ROW_NUMBER() OVER (PARTITION BY b.property_id ORDER BY b.booking_id))::int, 3)
        WHEN 1 THEN 5.0
        WHEN 2 THEN 4.0
        ELSE 4.5
    END,
    CASE MOD((ROW_NUMBER() OVER (PARTITION BY b.property_id ORDER BY b.booking_id))::int, 3)
        WHEN 1 THEN 'Excelente servicio, personal atento y habitaciones cómodas.'
        WHEN 2 THEN 'Muy buena ubicación y proceso de ingreso sin contratiempos.'
        ELSE 'Buena limpieza y descanso. Recomendado para viaje familiar.'
    END,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM inserted_bookings b
WHERE NOT EXISTS (
    SELECT 1
    FROM review r
    WHERE r.booking_id = b.booking_id
);
