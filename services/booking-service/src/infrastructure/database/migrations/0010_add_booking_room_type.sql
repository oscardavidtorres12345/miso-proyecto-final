ALTER TABLE booking
ADD COLUMN IF NOT EXISTS room_type VARCHAR(120) NULL;

CREATE INDEX IF NOT EXISTS ix_booking_room_type ON booking (room_type);
