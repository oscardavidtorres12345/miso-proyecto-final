-- Seed inicial para inventory_db
-- Alineado con search-db-init/02_seed.sql:
-- - 25 propiedades x 3 rooms => room_id secuenciales 1..75
-- - inventario para 10 dias: CURRENT_DATE + 0..9
INSERT INTO inventory_stock (room_id, date, total_units, confirmed_units, held_units)
SELECT
    r.room_id,
    CURRENT_DATE + d.day_offset,
    5 AS total_units,
    0 AS confirmed_units,
    0 AS held_units
FROM generate_series(1, 75) AS r(room_id)
CROSS JOIN generate_series(0, 9) AS d(day_offset)
ON CONFLICT (room_id, date) DO NOTHING;
