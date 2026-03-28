-- =============================================================================
-- ci_seed.sql — Minimal dataset for JMeter CI (HU023 PF-283)
-- =============================================================================
-- Inserts ~30 properties with 10 days of inventory/rates.
-- Designed to run quickly on GitHub Actions (~5 seconds).
-- Covers all cities used by destinations.csv so JMeter
-- finds real results and not empty responses.
--
-- Usage:
--   docker compose exec -T db-primary psql -U travelhub -d search_db \
--     -f tests/performance/ci_seed.sql
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_prop_id INTEGER;
    v_room_id INTEGER;
    props     TEXT[][] := ARRAY[
        -- {country_iso, city, type}  — MVP: CO (Colombia), AR (Argentina), US (United States)
        ARRAY['CO', 'Cartagena',    'hotel'],
        ARRAY['CO', 'Cartagena',    'house'],
        ARRAY['CO', 'Bogota',       'hotel'],
        ARRAY['CO', 'Bogota',       'hostel'],
        ARRAY['CO', 'Medellin',     'hotel'],
        ARRAY['CO', 'Medellin',     'cabin'],
        ARRAY['CO', 'Santa Marta',  'hotel'],
        ARRAY['CO', 'Santa Marta',  'villa'],
        ARRAY['CO', 'Barranquilla', 'hotel'],
        ARRAY['CO', 'Barranquilla', 'hostel'],
        ARRAY['AR', 'Buenos Aires', 'hotel'],
        ARRAY['AR', 'Buenos Aires', 'hostel'],
        ARRAY['AR', 'Mendoza',      'hotel'],
        ARRAY['AR', 'Mendoza',      'villa'],
        ARRAY['AR', 'Bariloche',    'cabin'],
        ARRAY['AR', 'Cordoba',      'hotel'],
        ARRAY['AR', 'Rosario',      'hotel'],
        ARRAY['US', 'Miami',        'hotel'],
        ARRAY['US', 'Miami',        'resort'],
        ARRAY['US', 'New York',     'hotel'],
        ARRAY['US', 'New York',     'hostel'],
        ARRAY['US', 'Los Angeles',  'hotel'],
        ARRAY['US', 'Chicago',      'hotel'],
        ARRAY['US', 'Las Vegas',    'resort'],
        ARRAY['US', 'Las Vegas',    'hotel']
    ];
    p INTEGER;
    d INTEGER;
BEGIN
    FOR p IN 1..array_length(props, 1) LOOP
        INSERT INTO property (
            country, name, location, latitude, longitude,
            distance_to_center_km, accommodation_type, stars, amenities,
            meal_plan, pets_allowed, tax_rate
        ) VALUES (
            props[p][1],
            props[p][3] || ' ' || props[p][2] || ' CI #' || p,
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
            END
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

            -- 10 days of inventory and rates (enough for the CI JMeter test)
            FOR d IN 0..9 LOOP
                INSERT INTO inventory (room_id, date, total_quantity, confirmed_quantity)
                VALUES (v_room_id, CURRENT_DATE + d, 5, (random() * 2)::INTEGER)
                ON CONFLICT (room_id, date) DO NOTHING;

                INSERT INTO rate (room_id, date, amount, currency)
                VALUES (
                    v_room_id,
                    CURRENT_DATE + d,
                    150000 + (random() * 850000)::INTEGER,
                    CASE props[p][1] WHEN 'CO' THEN 'COP' WHEN 'AR' THEN 'ARS'
                                     ELSE 'USD' END
                ) ON CONFLICT (room_id, date) DO NOTHING;
            END LOOP;
        END LOOP;

        -- Reviews per property: 3-5 reviews with varied ratings
        -- Exercises CA: rating scores across Excellent/Very good/Good/Fair thresholds
        INSERT INTO review (property_id, rating, comment, review_date)
        VALUES
            (v_prop_id, 4.5 + (random() * 0.5), 'Excellent stay', NOW() - INTERVAL '30 days'),
            (v_prop_id, 3.8 + (random() * 0.6), 'Very good experience', NOW() - INTERVAL '20 days'),
            (v_prop_id, 4.0 + (random() * 0.5), 'Recommended', NOW() - INTERVAL '10 days');
    END LOOP;
END $$;

COMMIT;

SELECT country, COUNT(*) AS properties FROM property GROUP BY country ORDER BY properties DESC;
SELECT p.country, COUNT(r.id) AS reviews FROM review r JOIN property p ON r.property_id = p.id GROUP BY p.country;

