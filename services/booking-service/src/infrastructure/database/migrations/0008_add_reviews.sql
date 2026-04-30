CREATE TABLE IF NOT EXISTS review (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL UNIQUE REFERENCES booking(booking_id),
    property_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    hotel_name VARCHAR(255) NOT NULL,
    room_name VARCHAR(255),
    guest_name VARCHAR(255) NOT NULL,
    guest_avatar_url VARCHAR(500),
    rating DOUBLE PRECISION NOT NULL,
    comment TEXT NOT NULL,
    review_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_review_property_id ON review (property_id);
CREATE INDEX IF NOT EXISTS ix_review_room_id ON review (room_id);
CREATE INDEX IF NOT EXISTS ix_review_review_date ON review (review_date DESC);
