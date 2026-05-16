-- Normalize seeded rates by property region so portal prices match expected market ranges.
-- CO properties: 1..10 (COP), AR properties: 11..17 (ARS), US properties: 18..25 (USD)

UPDATE inventory_room_rate
SET
  base_rate = CASE ((room_id - 1) % 3) + 1
    WHEN 1 THEN 95000
    WHEN 2 THEN 145000
    ELSE 195000
  END,
  offer_rate = CASE ((room_id - 1) % 3) + 1
    WHEN 1 THEN 79000
    WHEN 2 THEN 119000
    ELSE 165000
  END,
  offer_active = TRUE,
  updated_at = CURRENT_TIMESTAMP
WHERE property_id BETWEEN 1 AND 10
  AND currency = 'COP';

UPDATE inventory_room_rate
SET
  base_rate = CASE ((room_id - 1) % 3) + 1
    WHEN 1 THEN 78000
    WHEN 2 THEN 118000
    ELSE 158000
  END,
  offer_rate = CASE ((room_id - 1) % 3) + 1
    WHEN 1 THEN 65000
    WHEN 2 THEN 99000
    ELSE 132000
  END,
  offer_active = TRUE,
  updated_at = CURRENT_TIMESTAMP
WHERE property_id BETWEEN 11 AND 17
  AND currency = 'ARS';

UPDATE inventory_room_rate
SET
  base_rate = CASE ((room_id - 1) % 3) + 1
    WHEN 1 THEN 105
    WHEN 2 THEN 149
    ELSE 199
  END,
  offer_rate = CASE ((room_id - 1) % 3) + 1
    WHEN 1 THEN 89
    WHEN 2 THEN 129
    ELSE 169
  END,
  offer_active = TRUE,
  updated_at = CURRENT_TIMESTAMP
WHERE property_id BETWEEN 18 AND 25
  AND currency = 'USD';
