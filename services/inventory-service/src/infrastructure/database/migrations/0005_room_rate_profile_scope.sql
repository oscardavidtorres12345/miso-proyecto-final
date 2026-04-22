ALTER TABLE inventory_room_rate
    ADD COLUMN IF NOT EXISTS property_id INTEGER;

ALTER TABLE inventory_room_rate
    ADD COLUMN IF NOT EXISTS staff_user_id INTEGER;

UPDATE inventory_room_rate
SET property_id = 0
WHERE property_id IS NULL;

UPDATE inventory_room_rate
SET staff_user_id = 0
WHERE staff_user_id IS NULL;

ALTER TABLE inventory_room_rate
    ALTER COLUMN property_id SET NOT NULL;

ALTER TABLE inventory_room_rate
    ALTER COLUMN staff_user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS ix_inventory_room_rate_property_id ON inventory_room_rate (property_id);
CREATE INDEX IF NOT EXISTS ix_inventory_room_rate_staff_user_id ON inventory_room_rate (staff_user_id);
