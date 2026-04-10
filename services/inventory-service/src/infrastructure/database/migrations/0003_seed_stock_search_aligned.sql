INSERT INTO inventory_stock (room_id, date, total_units, confirmed_units, held_units)
SELECT
    r.room_id,
    nights.stay_date,
    5,
    0,
    0
FROM generate_series(1, 100) AS r (room_id)
CROSS JOIN generate_series(
    current_date,
    current_date + 120,
    INTERVAL '1 day'
) AS nights (stay_date)
ON CONFLICT (room_id, date) DO NOTHING;
