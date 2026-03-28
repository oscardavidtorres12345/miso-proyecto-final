-- =============================================================================
-- seed_catalog.sql — HU023 PF-283: Scalability test seed data
-- =============================================================================
-- Generates a realistic catalogue with:
--   • 2,500 properties distributed by country (LIST PARTITION)
--   • ~10 rooms per property  → ~25,000 rooms
--   • Inventory and rates for the next 90 days
--   Total inventory/rate rows: ~25,000 × 90 ≈ 2.25M (simulates 30k active SKUs)
--
-- Usage:
--   psql -h localhost -p 5433 -U travelhub -d search_db -f seed_catalog.sql
-- =============================================================================

BEGIN;

-- ── Geographic distribution of properties (MVP: CO, AR, US) ──────────────────
-- Colombia (CO):       1,000 properties  (40%)
-- Argentina (AR):        800 properties  (32%)
-- United States (US):    700 properties  (28%)

DO $$
DECLARE
    v_prop_id   INTEGER;
    v_room_id   INTEGER;
    v_country   TEXT;
    v_city      TEXT;
    v_type      accommodation_type_enum;
    countries   TEXT[]    := ARRAY['CO','AR','US'];
    counts      INTEGER[] := ARRAY[1000, 800, 700];
    cities      TEXT[]    := ARRAY[
        'Cartagena,Bogota,Medellin,Cali,Santa Marta,Barranquilla',
        'Buenos Aires,Mendoza,Cordoba,Bariloche,Rosario',
        'Miami,New York,Los Angeles,Chicago,Las Vegas'
    ];
    types       accommodation_type_enum[] := ARRAY[
        'hotel','house','cabin','hostel','villa','resort'
    ]::accommodation_type_enum[];
    amenity_sets TEXT[][] := ARRAY[
        ARRAY['pool','wifi','parking'],
        ARRAY['wifi','gym'],
        ARRAY['pool','spa','gym','restaurant'],
        ARRAY['wifi','pets','parking'],
        ARRAY['pool','wifi','bathtub','kids']
    ];
    i           INTEGER;
    j           INTEGER;
    k           INTEGER;
    n_props     INTEGER;
    city_list   TEXT[];
    room_count  INTEGER;
    base_price  FLOAT;
BEGIN
    FOR p IN 1..3 LOOP
        v_country := countries[p];
        n_props   := counts[p];
        city_list := string_to_array(cities[p], ',');

        FOR i IN 1..n_props LOOP
            v_city     := city_list[1 + ((i - 1) % array_length(city_list, 1))];
            v_type     := types[1 + ((i - 1) % 6)];
            base_price := 80000 + (random() * 1200000)::INTEGER;

            INSERT INTO property (
                country, name, location, latitude, longitude,
                distance_to_center_km, accommodation_type, stars, amenities,
                meal_plan, pets_allowed, tax_rate
            ) VALUES (
                v_country,
                v_type::TEXT || ' ' || v_city || ' #' || i,
                v_city || ', ' || v_country,
                -4 + random() * 14,
                -77 + random() * 20,
                round((random() * 15)::NUMERIC, 1),
                v_type,
                1 + ((i - 1) % 5),
                amenity_sets[1 + ((i - 1) % 5)],
                CASE (i % 4)
                    WHEN 0 THEN 'none'
                    WHEN 1 THEN 'breakfast'
                    WHEN 2 THEN 'buffet'
                    ELSE        'allinclusive'
                END::meal_plan_enum,
                (i % 3 = 0),
                CASE v_country WHEN 'CO' THEN 0.19 WHEN 'AR' THEN 0.21 ELSE 0.12 END
            ) RETURNING id INTO v_prop_id;

            -- ── Rooms (8-12 per property) ───────────────────────────────────
            room_count := 8 + (i % 5);
            FOR j IN 1..room_count LOOP
                INSERT INTO room (property_id, name, max_capacity, bed_type)
                VALUES (
                    v_prop_id,
                    'Room ' || j,
                    CASE (j % 4) WHEN 0 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 3 ELSE 4 END,
                    CASE (j % 3) WHEN 0 THEN 'Single' WHEN 1 THEN 'Double' ELSE 'King' END
                ) RETURNING id INTO v_room_id;

                -- ── Inventory and rates: next 90 days ──────────────────────
                FOR k IN 0..89 LOOP
                    INSERT INTO inventory (room_id, date, total_quantity, confirmed_quantity)
                    VALUES (v_room_id, CURRENT_DATE + k, 5, (random() * 3)::INTEGER)
                    ON CONFLICT (room_id, date) DO NOTHING;

                    INSERT INTO rate (room_id, date, amount, currency)
                    VALUES (
                        v_room_id,
                        CURRENT_DATE + k,
                        base_price * (0.9 + random() * 0.3),
                        CASE v_country WHEN 'CO' THEN 'COP' WHEN 'AR' THEN 'ARS' ELSE 'USD' END
                    ) ON CONFLICT (room_id, date) DO NOTHING;
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

COMMIT;

-- Verify
SELECT country, COUNT(*) AS properties FROM property GROUP BY country ORDER BY properties DESC;

