-- =============================================================================
-- 02_seed.sql — search_db initial seed data
-- =============================================================================
-- Inserts 25 properties with 3 rooms each, 10 days of inventory/rates,
-- and 3 reviews per property. Covers CO, AR and US partitions.
-- =============================================================================

BEGIN;

-- Limpiar datos existentes respetando el orden de dependencias
TRUNCATE TABLE review, inventory, rate, room RESTART IDENTITY CASCADE;
DELETE FROM property;
ALTER SEQUENCE property_id_seq RESTART WITH 1;

DO $$
DECLARE
    v_prop_id INTEGER;
    v_room_id INTEGER;
    props     TEXT[][] := ARRAY[
        -- {country_iso, city, type, image_url}
        ARRAY['CO', 'Cartagena',    'hotel',   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
        ARRAY['CO', 'Cartagena',    'house',   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
        ARRAY['CO', 'Bogota',       'hotel',   'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'],
        ARRAY['CO', 'Bogota',       'hostel',  'https://images.unsplash.com/photo-1555854877-bab8e564b8d5?w=800'],
        ARRAY['CO', 'Medellin',     'hotel',   'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'],
        ARRAY['CO', 'Medellin',     'cabin',   'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'],
        ARRAY['CO', 'Santa Marta',  'hotel',   'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'],
        ARRAY['CO', 'Santa Marta',  'villa',   'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800'],
        ARRAY['CO', 'Barranquilla', 'hotel',   'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'],
        ARRAY['CO', 'Barranquilla', 'hostel',  'https://images.unsplash.com/photo-1555854877-bab8e564b8d5?w=800'],
        ARRAY['AR', 'Buenos Aires', 'hotel',   'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'],
        ARRAY['AR', 'Buenos Aires', 'hostel',  'https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800'],
        ARRAY['AR', 'Mendoza',      'hotel',   'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'],
        ARRAY['AR', 'Mendoza',      'villa',   'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800'],
        ARRAY['AR', 'Bariloche',    'cabin',   'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800'],
        ARRAY['AR', 'Cordoba',      'hotel',   'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800'],
        ARRAY['AR', 'Rosario',      'hotel',   'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=800'],
        ARRAY['US', 'Miami',        'hotel',   'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'],
        ARRAY['US', 'Miami',        'resort',  'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800'],
        ARRAY['US', 'New York',     'hotel',   'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800'],
        ARRAY['US', 'New York',     'hostel',  'https://images.unsplash.com/photo-1555854877-bab8e564b8d5?w=800'],
        ARRAY['US', 'Los Angeles',  'hotel',   'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800'],
        ARRAY['US', 'Chicago',      'hotel',   'https://images.unsplash.com/photo-1549294413-26f195200d9d?w=800'],
        ARRAY['US', 'Las Vegas',    'resort',  'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=800'],
        ARRAY['US', 'Las Vegas',    'hotel',   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800']
    ];
    p INTEGER;
    h INTEGER;
    d INTEGER;
BEGIN
    FOR p IN 1..array_length(props, 1) LOOP
        INSERT INTO property (
            country, name, location, latitude, longitude,
            distance_to_center_km, accommodation_type, stars, amenities,
            meal_plan, pets_allowed, tax_rate, image_url
        ) VALUES (
            props[p][1],
            props[p][3] || ' ' || props[p][2] || ' #' || p,
            props[p][2] || ', ' || props[p][1],
            -4 + random() * 14,
            -77 + random() * 20,
            round((random() * 10)::NUMERIC, 1),
            props[p][3]::accommodation_type_enum,
            3 + (p % 3),
            ARRAY['wifi', 'pool'],
            'breakfast'::meal_plan_enum,
            (p % 3 = 0),
            CASE props[p][1]
                WHEN 'CO' THEN 0.19
                WHEN 'AR' THEN 0.21
                ELSE 0.12
            END,
            props[p][4]
        ) RETURNING id INTO v_prop_id;

        -- 3 rooms per property
        FOR h IN 1..3 LOOP
            INSERT INTO room (property_id, name, max_capacity, bed_type)
            VALUES (
                v_prop_id,
                'Room ' || h,
                CASE h WHEN 1 THEN 2 WHEN 2 THEN 3 ELSE 4 END,
                CASE h WHEN 1 THEN 'Double' WHEN 2 THEN 'King' ELSE 'Single' END
            ) RETURNING id INTO v_room_id;

            -- 10 days of inventory and rates
            FOR d IN 0..9 LOOP
                INSERT INTO inventory (room_id, date, total_quantity, confirmed_quantity)
                VALUES (v_room_id, CURRENT_DATE + d, 5, (random() * 2)::INTEGER)
                ON CONFLICT (room_id, date) DO NOTHING;

                INSERT INTO rate (room_id, date, amount, currency)
                VALUES (
                    v_room_id,
                    CURRENT_DATE + d,
                    150000 + (random() * 850000)::INTEGER,
                    CASE props[p][1] WHEN 'CO' THEN 'COP' WHEN 'AR' THEN 'ARS' ELSE 'USD' END
                ) ON CONFLICT (room_id, date) DO NOTHING;
            END LOOP;
        END LOOP;

        -- 3 reviews per property
        INSERT INTO review (property_id, rating, comment, review_date) VALUES
            (v_prop_id, 4.5 + (random() * 0.5), 'Excellent stay',        NOW() - INTERVAL '30 days'),
            (v_prop_id, 3.8 + (random() * 0.6), 'Very good experience',  NOW() - INTERVAL '20 days'),
            (v_prop_id, 4.0 + (random() * 0.5), 'Recommended',           NOW() - INTERVAL '10 days');
    END LOOP;
END $$;

COMMIT;

-- Verification
SELECT country, COUNT(*) AS properties FROM property GROUP BY country ORDER BY properties DESC;
SELECT p.country, COUNT(r.id) AS reviews FROM review r JOIN property p ON r.property_id = p.id GROUP BY p.country;
