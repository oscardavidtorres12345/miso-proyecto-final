-- Change primary key from room_id to (room_id, currency) to allow
-- one rate row per room per currency.
ALTER TABLE inventory_room_rate DROP CONSTRAINT inventory_room_rate_pkey;
ALTER TABLE inventory_room_rate ADD PRIMARY KEY (room_id, currency);
