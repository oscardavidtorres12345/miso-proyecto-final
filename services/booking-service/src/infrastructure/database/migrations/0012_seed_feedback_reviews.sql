-- Seed de feedback realista para portal/admin/feedback:
-- inserta 3 comentarios por propiedad (cuando existan reservas elegibles),
-- completando todos los campos del modelo Review.

WITH eligible AS (
    SELECT
        b.booking_id,
        b.property_id,
        b.room_id,
        b.property_name,
        b.room_type,
        b.user_id,
        b.check_out,
        ROW_NUMBER() OVER (
            PARTITION BY b.property_id
            ORDER BY b.check_out DESC, b.booking_id DESC
        ) AS rn
    FROM booking b
    WHERE b.status = 'CONFIRMED'
      AND b.property_id IS NOT NULL
      AND b.check_out < CURRENT_DATE
      AND NOT EXISTS (
          SELECT 1
          FROM review r
          WHERE r.booking_id = b.booking_id
      )
),
picked AS (
    SELECT *
    FROM eligible
    WHERE rn <= 3
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
    p.booking_id,
    p.property_id,
    p.room_id,
    COALESCE(NULLIF(TRIM(p.property_name), ''), 'Alojamiento'),
    p.room_type,
    CASE (p.rn % 3)
        WHEN 1 THEN 'Ana Martínez'
        WHEN 2 THEN 'Carlos Ríos'
        ELSE 'Luisa Gómez'
    END AS guest_name,
    'guest_' || p.user_id AS guest_username,
    'https://i.pravatar.cc/120?img=' || ((ABS(hashtext(p.user_id)) % 70) + 1) AS guest_avatar_url,
    CASE p.rn
        WHEN 1 THEN 5.0
        WHEN 2 THEN 4.0
        ELSE 4.5
    END AS rating,
    CASE p.rn
        WHEN 1 THEN 'Excelente estadía. Servicio ágil, limpieza impecable y muy buena ubicación.'
        WHEN 2 THEN 'Buena experiencia general. Habitaciones cómodas y proceso de check-in rápido.'
        ELSE 'Muy recomendable para viajes de negocio y turismo. Volveríamos sin problema.'
    END AS comment,
    (p.check_out::timestamp + INTERVAL '10 hours') AS review_date
FROM picked p;
