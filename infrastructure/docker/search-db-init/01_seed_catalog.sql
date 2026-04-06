-- Seed base de catalogo para search_db
-- Nota: este script asume que el esquema del search-service ya fue creado.

-- Properties
INSERT INTO property (
    id,
    country,
    name,
    location,
    latitude,
    longitude,
    distance_to_center_km,
    accommodation_type,
    stars,
    amenities,
    meal_plan,
    pets_allowed,
    image_url,
    pms_endpoint,
    tax_rate
)
VALUES
    (
        9001,
        'CO',
        'TravelHub Cartagena Centro',
        'Cartagena',
        10.4236,
        -75.5478,
        1.2,
        'hotel',
        4,
        ARRAY['wifi','pool','restaurant'],
        'breakfast',
        true,
        'https://images.example.com/hotel-9001.jpg',
        'https://pms.example.com/hotels/9001',
        0.19
    ),
    (
        9002,
        'CO',
        'TravelHub Bocagrande',
        'Cartagena',
        10.4020,
        -75.5530,
        2.0,
        'hotel',
        5,
        ARRAY['wifi','spa','gym'],
        'buffet',
        false,
        'https://images.example.com/hotel-9002.jpg',
        'https://pms.example.com/hotels/9002',
        0.19
    )
ON CONFLICT (id, country) DO NOTHING;

-- Rooms (IDs consistentes para booking/inventory)
INSERT INTO room (id, name, property_id, max_capacity, bed_type, description, image_url)
VALUES
    (101, 'Superior Queen', 9001, 2, 'queen', 'Room 101 superior', 'https://images.example.com/rooms/101.jpg'),
    (102, 'Deluxe Twin',    9001, 3, 'twin',  'Room 102 deluxe',   'https://images.example.com/rooms/102.jpg'),
    (201, 'Junior Suite',   9002, 4, 'king',  'Room 201 suite',    'https://images.example.com/rooms/201.jpg')
ON CONFLICT (id) DO NOTHING;

-- Inventory (proyeccion para busqueda)
INSERT INTO inventory (room_id, date, total_quantity, confirmed_quantity)
VALUES
    (101, DATE '2026-04-10', 3, 0),
    (101, DATE '2026-04-11', 3, 0),
    (101, DATE '2026-04-12', 3, 0),
    (102, DATE '2026-04-10', 2, 0),
    (102, DATE '2026-04-11', 2, 0),
    (102, DATE '2026-04-12', 2, 0),
    (201, DATE '2026-04-10', 4, 0),
    (201, DATE '2026-04-11', 4, 0),
    (201, DATE '2026-04-12', 4, 0)
ON CONFLICT (room_id, date) DO NOTHING;

-- Rates
INSERT INTO rate (room_id, date, amount, currency)
VALUES
    (101, DATE '2026-04-10', 420000, 'COP'),
    (101, DATE '2026-04-11', 420000, 'COP'),
    (101, DATE '2026-04-12', 420000, 'COP'),
    (102, DATE '2026-04-10', 520000, 'COP'),
    (102, DATE '2026-04-11', 520000, 'COP'),
    (102, DATE '2026-04-12', 520000, 'COP'),
    (201, DATE '2026-04-10', 780000, 'COP'),
    (201, DATE '2026-04-11', 780000, 'COP'),
    (201, DATE '2026-04-12', 780000, 'COP')
ON CONFLICT (room_id, date) DO NOTHING;
