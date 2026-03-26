-- =============================================================================
-- seed_catalog.sql — HU023 PF-283: Seed data para pruebas de escalabilidad
-- =============================================================================
-- Genera un catálogo realista con:
--   • 2,500 propiedades distribuidas por país (LIST PARTITION)
--   • ~10 habitaciones por propiedad → ~25,000 habitaciones
--   • Inventario y tarifas para los próximos 90 días
--   Total de filas de inventario/tarifa: ~25,000 × 90 ≈ 2.25M (simula 30k SKUs activos)
--
-- Uso:
--   psql -h localhost -p 5433 -U travelhub -d search_db -f seed_catalog.sql
-- =============================================================================

BEGIN;

-- ── Distribución geográfica de propiedades (MVP: CO, AR, US) ─────────────────
-- Colombia (CO):        1,000 propiedades  (40%)
-- Argentina (AR):         800 propiedades  (32%)
-- Estados Unidos (US):    700 propiedades  (28%)

DO $$
DECLARE
    v_prop_id   INTEGER;
    v_hab_id    INTEGER;
    v_pais      TEXT;
    v_ciudad    TEXT;
    v_tipo      accommodation_type_enum;
    paises      TEXT[]  := ARRAY['CO','AR','US'];
    counts      INTEGER[] := ARRAY[1000, 800, 700];
    ciudades    TEXT[]  := ARRAY[
        'Cartagena,Bogotá,Medellín,Cali,Santa Marta,Barranquilla',
        'Buenos Aires,Mendoza,Córdoba,Bariloche,Rosario',
        'Miami,Nueva York,Los Ángeles,Chicago,Las Vegas'
    ];
    tipos       accommodation_type_enum[] := ARRAY[
        'Hotel','Casa','Cabaña','Hostal','Villa','Resort'
    ]::accommodation_type_enum[];
    amenidades_set TEXT[][] := ARRAY[
        ARRAY['Piscina','WiFi','Estacionamiento'],
        ARRAY['WiFi','Desayuno incluido'],
        ARRAY['Piscina','Spa','Gimnasio','Restaurante'],
        ARRAY['WiFi','Acepta mascotas','Estacionamiento'],
        ARRAY['Piscina','WiFi','Bañera','Servicios para niños']
    ];
    i           INTEGER;
    j           INTEGER;
    k           INTEGER;
    n_props     INTEGER;
    ciudad_list TEXT[];
    hab_count   INTEGER;
    precio_base FLOAT;
BEGIN
    FOR p IN 1..3 LOOP
        v_pais  := paises[p];
        n_props := counts[p];
        ciudad_list := string_to_array(ciudades[p], ',');

        FOR i IN 1..n_props LOOP
            v_ciudad := ciudad_list[1 + ((i - 1) % array_length(ciudad_list, 1))];
            v_tipo   := tipos[1 + ((i - 1) % 6)];
            precio_base := 80000 + (random() * 1200000)::INTEGER;

            INSERT INTO propiedad (
                pais, nombre, ubicacion_geog, latitud, longitud,
                distancia_centro_km, tipo, estrellas, amenidades,
                plan_alimentacion, acepta_mascotas, porcentaje_impuesto
            ) VALUES (
                v_pais,
                v_tipo::TEXT || ' ' || v_ciudad || ' #' || i,
                v_ciudad || ', ' || v_pais,
                -4 + random() * 14,
                -77 + random() * 20,
                round((random() * 15)::NUMERIC, 1),
                v_tipo,
                1 + ((i - 1) % 5),
                amenidades_set[1 + ((i - 1) % 5)],
                CASE (i % 4)
                    WHEN 0 THEN 'Ninguno'
                    WHEN 1 THEN 'Desayuno'
                    WHEN 2 THEN 'Desayuno buffet'
                    ELSE        'All inclusive'
                END::meal_plan_enum,
                (i % 3 = 0),
                CASE v_pais WHEN 'CO' THEN 0.19 WHEN 'AR' THEN 0.21 ELSE 0.12 END
            ) RETURNING id INTO v_prop_id;

            -- ── Habitaciones (8-12 por propiedad) ──────────────────────────
            hab_count := 8 + (i % 5);
            FOR j IN 1..hab_count LOOP
                INSERT INTO habitacion (propiedad_id, nombre, capacidad_max, tipo_cama)
                VALUES (
                    v_prop_id,
                    'Habitación ' || j,
                    CASE (j % 4) WHEN 0 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 3 ELSE 4 END,
                    CASE (j % 3) WHEN 0 THEN 'Sencilla' WHEN 1 THEN 'Doble' ELSE 'King' END
                ) RETURNING id INTO v_hab_id;

                -- ── Inventario y tarifas: próximos 90 días ──────────────────
                FOR k IN 0..89 LOOP
                    INSERT INTO inventario (habitacion_id, fecha, cantidad_total, cantidad_confirmada)
                    VALUES (v_hab_id, CURRENT_DATE + k, 5, (random() * 3)::INTEGER)
                    ON CONFLICT (habitacion_id, fecha) DO NOTHING;

                    INSERT INTO tarifa (habitacion_id, fecha, monto, moneda)
                    VALUES (
                        v_hab_id,
                        CURRENT_DATE + k,
                        precio_base * (0.9 + random() * 0.3),
                        CASE v_pais WHEN 'CO' THEN 'COP' WHEN 'AR' THEN 'ARS' ELSE 'USD' END
                    ) ON CONFLICT (habitacion_id, fecha) DO NOTHING;
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

COMMIT;

-- Verify
SELECT pais, COUNT(*) AS propiedades FROM propiedad GROUP BY pais ORDER BY propiedades DESC;

