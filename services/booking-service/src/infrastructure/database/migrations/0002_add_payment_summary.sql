ALTER TABLE booking ADD COLUMN property_id INTEGER NULL;
ALTER TABLE booking ADD COLUMN payment_summary_json TEXT NULL;

CREATE INDEX IF NOT EXISTS ix_booking_property_id ON booking (property_id);
