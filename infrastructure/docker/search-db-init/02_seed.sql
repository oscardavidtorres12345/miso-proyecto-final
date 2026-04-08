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
        -- {country_iso, city, type, image_url, name, description, amenities_csv}
        ARRAY['CO', 'Cartagena',    'hotel',   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',   'Casa del Mar',           'Ubicado frente al mar Caribe, este hotel boutique combina arquitectura colonial con comodidades modernas. Disfruta de sus terrazas con vista al océano y gastronomía local de primera.',        'wifi,pool,restaurant,ac,parking'],
        ARRAY['CO', 'Cartagena',    'house',   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',   'Villa Murallas',         'Casa colonial restaurada en el corazón de la ciudad amurallada. Cada rincón conserva el encanto histórico de Cartagena con acabados de lujo y patio interior privado.',                  'wifi,ac,bathtub,kids,parking'],
        ARRAY['CO', 'Bogota',       'hotel',   'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',      'Nube Andina Hotel',      'Hotel de diseño contemporáneo en la Zona Rosa de Bogotá. A pasos de los mejores restaurantes y centros comerciales, con vistas panorámicas a los cerros orientales.',               'wifi,gym,restaurant,ac,parking,spa'],
        ARRAY['CO', 'Bogota',       'hostel',  'https://images.unsplash.com/photo-1555854877-bab8e564b8d5?w=800',      'La Candelaria Hostel',   'Hostal vibrante en el centro histórico, ideal para mochileros y viajeros culturales. Ambiente social, tours a pie incluidos y cocina comunitaria disponible las 24 horas.',          'wifi,restaurant,kids'],
        ARRAY['CO', 'Medellin',     'hotel',   'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',      'Hotel El Poblado',       'Elegante hotel en el barrio más exclusivo de Medellín. Rodeado de restaurantes de autor, bares de cocteles y galerías de arte contemporáneo.',                                      'wifi,pool,gym,spa,restaurant,ac,parking'],
        ARRAY['CO', 'Medellin',     'cabin',   'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',   'Cabaña Verde Guayabal',  'Refugio ecológico en las afueras de Medellín rodeado de jardines tropicales. Perfecta para desconectarse del ruido urbano con senderos naturales y piscina natural.',           'wifi,pool,pets,kids,parking'],
        ARRAY['CO', 'Santa Marta',  'hotel',   'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',   'Tayrona Bay Resort',     'Hotel frente al mar en la bahía de Santa Marta, puerta de entrada al Parque Nacional Tayrona. Playa privada, snorkel y excursiones a la sierra nevada incluidas.',               'wifi,pool,restaurant,parking,kids,ac'],
        ARRAY['CO', 'Santa Marta',  'villa',   'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',   'Villa Sierra Nevada',    'Lujosa villa privada con jardín tropical, piscina infinita y vistas a la Sierra Nevada de Santa Marta. Ideal para grupos o familias que buscan exclusividad total.',            'wifi,pool,ac,bathtub,parking,pets'],
        ARRAY['CO', 'Barranquilla', 'hotel',   'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',   'Hotel Carnaval',         'Hotel temático en el corazón de Barranquilla que celebra la cultura del carnaval. Murales de artistas locales, música en vivo los fines de semana y cocina costeña auténtica.',   'wifi,restaurant,ac,parking,pool'],
        ARRAY['CO', 'Barranquilla', 'hostel',  'https://images.unsplash.com/photo-1555854877-bab8e564b8d5?w=800',      'Hostal Puerto Colombia', 'Hostal acogedor en el barrio histórico de El Prado, a metros del río Magdalena. Arquitectura republicana restaurada y ambiente familiar ideal para conocer la calidez barranquillera.', 'wifi,ac,restaurant'],
        ARRAY['AR', 'Buenos Aires', 'hotel',   'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800',   'Palermo Grand Hotel',    'Hotel de lujo en el corazón de Palermo Soho, el barrio más creativo de Buenos Aires. Rodeado de galerías, cafés literarios y la mejor escena gastronómica de la ciudad.',         'wifi,gym,spa,restaurant,ac,parking,bathtub'],
        ARRAY['AR', 'Buenos Aires', 'hostel',  'https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800',   'San Telmo Roots',        'Hostal con historia en el barrio más antiguo de Buenos Aires. Feria de antigüedades a la vuelta, tanguerías tradicionales y tours de street art incluidos en la estadía.',        'wifi,restaurant,kids'],
        ARRAY['AR', 'Mendoza',      'hotel',   'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',   'Hotel Viña del Sol',     'Hotel boutique en plena ruta del vino mendocino. Catas privadas en bodega propia, spa de vinoterapia y vistas a la Cordillera de los Andes desde cada habitación.',             'wifi,spa,restaurant,ac,parking,bathtub,pool'],
        ARRAY['AR', 'Mendoza',      'villa',   'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',   'Villa Cordillera',       'Exclusiva villa privada con viñedo propio al pie de los Andes. Piscina con vista a la montaña, sommelier personal y transfers privados a las principales bodegas de Luján de Cuyo.',  'wifi,pool,ac,bathtub,parking,pets'],
        ARRAY['AR', 'Bariloche',    'cabin',   'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800',   'Cabaña Lago Nahuel',     'Cabaña de montaña frente al lago Nahuel Huapi con chimenea a leña y muelle privado. Acceso directo a pistas de esquí en invierno y senderismo en verano.',                      'wifi,parking,pets,kids,bathtub'],
        ARRAY['AR', 'Cordoba',      'hotel',   'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800',   'Hotel Sierras Chicas',   'Hotel moderno en Nueva Córdoba a pasos de la Universidad Nacional y el Paseo del Buen Pastor. Terraza rooftop con vista a las sierras y cocina de autor.',                        'wifi,pool,gym,restaurant,ac,parking'],
        ARRAY['AR', 'Rosario',      'hotel',   'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=800',     'Paraná River Hotel',     'Hotel contemporáneo a orillas del río Paraná con acceso a playa fluvial privada. Arquitectura vidriada que aprovecha cada atardecer sobre el río más ancho del mundo.',         'wifi,pool,restaurant,ac,parking,gym'],
        ARRAY['US', 'Miami',        'hotel',   'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',   'Ocean Drive Suites',     'Stylish hotel steps from South Beach with direct access to the white sand and turquoise waters of the Atlantic. Art Deco architecture, rooftop pool and vibrant nightlife nearby.',   'wifi,pool,ac,parking,restaurant,gym'],
        ARRAY['US', 'Miami',        'resort',  'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800',   'Biscayne Bay Resort',    'Full-service beachfront resort on Biscayne Bay with three pools, a world-class spa and five dining options. Perfect for families and couples seeking a complete Miami escape.',       'wifi,pool,spa,gym,restaurant,ac,parking,kids,pets'],
        ARRAY['US', 'New York',     'hotel',   'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',   'Midtown Manhattan Inn',  'Boutique hotel in the heart of Midtown, walking distance from Times Square, Central Park and the best Broadway shows. Iconic skyline views from every floor.',                    'wifi,gym,restaurant,ac,bathtub'],
        ARRAY['US', 'New York',     'hostel',  'https://images.unsplash.com/photo-1555854877-bab8e564b8d5?w=800',      'Brooklyn Social Hostel', 'Trendy hostel in Williamsburg with a rooftop terrace overlooking the Manhattan skyline. Known for its creative community vibe, free yoga classes and locally sourced breakfast.',   'wifi,gym,restaurant,kids'],
        ARRAY['US', 'Los Angeles',  'hotel',   'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',   'Sunset Strip Hotel',     'Iconic hotel on the legendary Sunset Strip with a celebrity-favorite rooftop bar and panoramic views of the Hollywood Hills. Minutes from top studios and Beverly Hills.',          'wifi,pool,gym,spa,restaurant,ac,parking,bathtub'],
        ARRAY['US', 'Chicago',      'hotel',   'https://images.unsplash.com/photo-1549294413-26f195200d9d?w=800',      'Lakefront Chicago Hotel','Contemporary hotel overlooking Lake Michigan in the vibrant River North neighborhood. Walk to Navy Pier, Millennium Park and Chicago''s world-renowned deep-dish pizza spots.',    'wifi,pool,gym,restaurant,ac,parking,kids'],
        ARRAY['US', 'Las Vegas',    'resort',  'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=800',   'The Strip Grand Resort', 'All-inclusive resort on the Las Vegas Strip featuring a casino, six pools, a luxury spa and eleven restaurants. Live entertainment every night and concierge gaming services.',      'wifi,pool,spa,gym,restaurant,ac,parking,kids,bathtub'],
        ARRAY['US', 'Las Vegas',    'hotel',   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',   'Neon Lights Boutique',   'Intimate boutique hotel just off the Strip offering a quieter Vegas experience without sacrificing style. Rooftop lounge with Strip views and curated local art throughout.',       'wifi,ac,restaurant,gym,parking']
    ];
    p INTEGER;
    h INTEGER;
    d INTEGER;
BEGIN
    FOR p IN 1..array_length(props, 1) LOOP
        INSERT INTO property (
            country, name, location, latitude, longitude,
            distance_to_center_km, accommodation_type, stars, amenities,
            meal_plan, pets_allowed, tax_rate, image_url, description
        ) VALUES (
            props[p][1],
            props[p][5],
            props[p][2] || ', ' || props[p][1],
            -4 + random() * 14,
            -77 + random() * 20,
            round((random() * 10)::NUMERIC, 1),
            props[p][3]::accommodation_type_enum,
            3 + (p % 3),
            string_to_array(props[p][7], ','),
            'breakfast'::meal_plan_enum,
            (p % 3 = 0),
            CASE props[p][1]
                WHEN 'CO' THEN 0.19
                WHEN 'AR' THEN 0.21
                ELSE 0.12
            END,
            props[p][4],
            props[p][6]
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
