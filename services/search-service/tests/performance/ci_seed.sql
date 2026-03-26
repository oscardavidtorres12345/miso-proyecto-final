-- =============================================================================
-- ci_seed.sql — Dataset mínimo para el CI de JMeter (HU023 PF-283)
-- =============================================================================
-- Inserta ~30 propiedades con 10 días de inventario/tarifas.
-- Diseñado para ejecutarse rápidamente en GitHub Actions (~5 segundos).
-- Cubre todas las ciudades que usa destinations.csv para que JMeter
-- encuentre resultados reales y no respuestas vacías.
--
-- Uso:
--   docker compose exec -T db-primary psql -U travelhub -d search_db \
--     -f tests/performance/ci_seed.sql
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_prop_id INTEGER;
    v_hab_id  INTEGER;
    props     TEXT[][] := ARRAY[
        -- {pais_iso, ciudad, tipo}  — MVP: CO (Colombia), AR (Argentina), US (Estados Unidos)
        ARRAY['CO', 'Cartagena',    'Hotel'],
        ARRAY['CO', 'Cartagena',    'Casa'],
        ARRAY['CO', 'Bogotá',       'Hotel'],
        ARRAY['CO', 'Bogotá',       'Hostal'],
        ARRAY['CO', 'Medellín',     'Hotel'],
        ARRAY['CO', 'Medellín',     'Cabaña'],
        ARRAY['CO', 'Santa Marta',  'Hotel'],
        ARRAY['CO', 'Santa Marta',  'Villa'],
        ARRAY['CO', 'Barranquilla', 'Hotel'],
        ARRAY['CO', 'Barranquilla', 'Hostal'],
        ARRAY['AR', 'Buenos Aires', 'Hotel'],
        ARRAY['AR', 'Buenos Aires', 'Hostal'],
        ARRAY['AR', 'Mendoza',      'Hotel'],
        ARRAY['AR', 'Mendoza',      'Villa'],
        ARRAY['AR', 'Bariloche',    'Cabaña'],
        ARRAY['AR', 'Córdoba',      'Hotel'],
        ARRAY['AR', 'Rosario',      'Hotel'],
        ARRAY['US', 'Miami',        'Hotel'],
        ARRAY['US', 'Miami',        'Resort'],
        ARRAY['US', 'Nueva York',   'Hotel'],
        ARRAY['US', 'Nueva York',   'Hostal'],
        ARRAY['US', 'Los Ángeles',  'Hotel'],
        ARRAY['US', 'Chicago',      'Hotel'],
        ARRAY['US', 'Las Vegas',    'Resort'],
        ARRAY['US', 'Las Vegas',    'Hotel']
    ];
    p INTEGER;
    d INTEGER;
BEGIN
    FOR p IN 1..array_length(props, 1) LOOP
        INSERT INTO propiedad (
            pais, nombre, ubicacion_geog, latitud, longitud,
            distancia_centro_km, tipo, estrellas, amenidades,
            plan_alimentacion, acepta_mascotas, porcentaje_impuesto
        ) VALUES (
            props[p][1],
            props[p][3] || ' ' || props[p][2] || ' CI #' || p,
            props[p][2] || ', ' || props[p][1],
            -4 + random() * 14,
            -77 + random() * 20,
            round((random() * 10)::NUMERIC, 1),
            props[p][3]::accommodation_type_enum,
            3 + (p % 3),
            ARRAY['WiFi', 'Piscina'],
            'Desayuno'::meal_plan_enum,
            (p % 3 = 0),
            CASE props[p][1]
                WHEN 'CO' THEN 0.19
                WHEN 'AR' THEN 0.21
                ELSE 0.12
            END
        ) RETURNING id INTO v_prop_id;

        -- 3 habitaciones por propiedad
        FOR h IN 1..3 LOOP
            INSERT INTO habitacion (propiedad_id, nombre, capacidad_max, tipo_cama)
            VALUES (
                v_prop_id,
                'Hab ' || h,
                CASE h WHEN 1 THEN 2 WHEN 2 THEN 3 ELSE 4 END,
                CASE h WHEN 1 THEN 'Doble' WHEN 2 THEN 'King' ELSE 'Sencilla' END
            ) RETURNING id INTO v_hab_id;

            -- 10 días de inventario y tarifas (suficiente para el JMeter de CI)
            FOR d IN 0..9 LOOP
                INSERT INTO inventario (habitacion_id, fecha, cantidad_total, cantidad_confirmada)
                VALUES (v_hab_id, CURRENT_DATE + d, 5, (random() * 2)::INTEGER)
                ON CONFLICT (habitacion_id, fecha) DO NOTHING;

                INSERT INTO tarifa (habitacion_id, fecha, monto, moneda)
                VALUES (
                    v_hab_id,
                    CURRENT_DATE + d,
                    150000 + (random() * 850000)::INTEGER,
                    CASE props[p][1] WHEN 'CO' THEN 'COP' WHEN 'AR' THEN 'ARS'
                                     ELSE 'USD' END
                ) ON CONFLICT (habitacion_id, fecha) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

COMMIT;

SELECT pais, COUNT(*) AS propiedades FROM propiedad GROUP BY pais ORDER BY propiedades DESC;

