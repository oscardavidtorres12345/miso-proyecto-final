ALTER TABLE booking
ADD COLUMN guest_count INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS ix_booking_guest_count ON booking (guest_count);
