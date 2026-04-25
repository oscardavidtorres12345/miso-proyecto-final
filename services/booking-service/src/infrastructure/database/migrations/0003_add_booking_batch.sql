CREATE TABLE IF NOT EXISTS booking_batch (
    booking_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_booking_batch_user_id ON booking_batch (user_id);

CREATE TABLE IF NOT EXISTS booking_batch_item (
    id SERIAL PRIMARY KEY,
    batch_booking_id VARCHAR(64) NOT NULL,
    booking_id VARCHAR(64) NOT NULL,
    CONSTRAINT fk_booking_batch_item_batch
        FOREIGN KEY (batch_booking_id) REFERENCES booking_batch(booking_id),
    CONSTRAINT fk_booking_batch_item_booking
        FOREIGN KEY (booking_id) REFERENCES booking(booking_id)
);

CREATE INDEX IF NOT EXISTS ix_booking_batch_item_batch_booking_id ON booking_batch_item (batch_booking_id);
CREATE INDEX IF NOT EXISTS ix_booking_batch_item_booking_id ON booking_batch_item (booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_booking_batch_item_batch_booking ON booking_batch_item (batch_booking_id, booking_id);
