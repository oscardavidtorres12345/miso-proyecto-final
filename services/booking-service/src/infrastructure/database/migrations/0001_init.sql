CREATE TABLE IF NOT EXISTS booking (
    booking_id VARCHAR(64) PRIMARY KEY,
    hold_id VARCHAR(64) NOT NULL,
    room_id INTEGER NOT NULL,
    user_id VARCHAR(120) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    units INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS ix_booking_hold_id ON booking (hold_id);
CREATE INDEX IF NOT EXISTS ix_booking_room_id ON booking (room_id);
CREATE INDEX IF NOT EXISTS ix_booking_user_id ON booking (user_id);
CREATE INDEX IF NOT EXISTS ix_booking_status ON booking (status);
