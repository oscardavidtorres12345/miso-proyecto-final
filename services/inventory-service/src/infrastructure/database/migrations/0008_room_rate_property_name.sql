ALTER TABLE inventory_room_rate
    ADD COLUMN IF NOT EXISTS property_name VARCHAR(255);
