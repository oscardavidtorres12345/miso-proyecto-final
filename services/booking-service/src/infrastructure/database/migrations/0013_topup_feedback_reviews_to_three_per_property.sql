-- Top-up de feedback para garantizar hasta 3 comentarios por propiedad.
-- Usa reservas CONFIRMED que aún no tengan review.

WITH existing AS (
    SELECT property_id, COUNT(*)::int AS current_reviews
    FROM review
    GROUP BY property_id
),
eligible AS (
    SELECT
        b.booking_id,
        b.property_id,
        b.room_id,
        b.property_name,
        b.room_type,
        b.user_id,
        b.check_out,
        COALESCE(e.current_reviews, 0) AS current_reviews,
        ROW_NUMBER() OVER (
            PARTITION BY b.property_id
            ORDER BY b.check_out DESC, b.booking_id DESC
        ) AS rn
    FROM booking b
    LEFT JOIN existing e
      ON e.property_id = b.property_id
    WHERE b.status = 'CONFIRMED'
      AND b.property_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM review r
          WHERE r.booking_id = b.booking_id
      )
),
to_insert AS (
    SELECT *
    FROM eligible
    WHERE current_reviews < 3
      AND rn <= (3 - current_reviews)
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
    t.booking_id,
    t.property_id,
    t.room_id,
    COALESCE(NULLIF(TRIM(t.property_name), ''), 'Alojamiento'),
    t.room_type,
    CASE (t.rn % 3)
        WHEN 1 THEN 'Valentina Castro'
        WHEN 2 THEN 'Diego Herrera'
        ELSE 'Manuela Ortiz'
    END AS guest_name,
    'guest_' || t.user_id AS guest_username,
    'https://i.pravatar.cc/120?img=' || ((ABS(hashtext(t.user_id)) % 70) + 1) AS guest_avatar_url,
    CASE t.rn
        WHEN 1 THEN 5.0
        WHEN 2 THEN 4.0
        ELSE 4.5
    END AS rating,
    CASE t.rn
        WHEN 1 THEN 'Excelente atención del personal y muy buena experiencia general.'
        WHEN 2 THEN 'Buena relación calidad-precio y ubicación conveniente.'
        ELSE 'Habitación cómoda, buen descanso y check-in/check-out fluido.'
    END AS comment,
    (CURRENT_TIMESTAMP - (t.rn || ' days')::interval) AS review_date
FROM to_insert t;
