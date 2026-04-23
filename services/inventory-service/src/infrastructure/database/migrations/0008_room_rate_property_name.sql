-- Ensures property_name column exists (no-op on fresh installs where 0004 already creates it)
-- and backfills any null values left by older seeds.
ALTER TABLE inventory_room_rate
    ADD COLUMN IF NOT EXISTS property_name VARCHAR(255);

UPDATE inventory_room_rate
SET property_name = CASE property_id
    WHEN 1  THEN 'Casa del Mar'
    WHEN 2  THEN 'Villa Murallas'
    WHEN 3  THEN 'Nube Andina Hotel'
    WHEN 4  THEN 'La Candelaria Hostel'
    WHEN 5  THEN 'Hotel El Poblado'
    WHEN 6  THEN 'Cabaña Verde Guayabal'
    WHEN 7  THEN 'Tayrona Bay Resort'
    WHEN 8  THEN 'Villa Sierra Nevada'
    WHEN 9  THEN 'Hotel Carnaval'
    WHEN 10 THEN 'Hostal Puerto Colombia'
    WHEN 11 THEN 'Palermo Grand Hotel'
    WHEN 12 THEN 'San Telmo Roots'
    WHEN 13 THEN 'Hotel Viña del Sol'
    WHEN 14 THEN 'Villa Cordillera'
    WHEN 15 THEN 'Cabaña Lago Nahuel'
    WHEN 16 THEN 'Hotel Sierras Chicas'
    WHEN 17 THEN 'Paraná River Hotel'
    WHEN 18 THEN 'Ocean Drive Suites'
    WHEN 19 THEN 'Biscayne Bay Resort'
    WHEN 20 THEN 'Midtown Manhattan Inn'
    WHEN 21 THEN 'Brooklyn Social Hostel'
    WHEN 22 THEN 'Sunset Strip Hotel'
    WHEN 23 THEN 'Lakefront Chicago Hotel'
    WHEN 24 THEN 'The Strip Grand Resort'
    WHEN 25 THEN 'Neon Lights Boutique'
END
WHERE property_name IS NULL
  AND property_id BETWEEN 1 AND 25;
