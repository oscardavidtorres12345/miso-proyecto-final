ALTER TABLE booking
ADD COLUMN checked_in_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS ix_booking_checked_in_at ON booking (checked_in_at);
