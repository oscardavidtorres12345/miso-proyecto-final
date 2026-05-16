ALTER TABLE booking ADD COLUMN IF NOT EXISTS payment_id VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_booking_payment_id ON booking(payment_id);
