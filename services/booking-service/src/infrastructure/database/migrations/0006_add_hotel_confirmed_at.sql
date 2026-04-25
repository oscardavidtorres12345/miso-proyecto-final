ALTER TABLE booking
ADD COLUMN hotel_confirmed_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS ix_booking_hotel_confirmed_at ON booking (hotel_confirmed_at);
