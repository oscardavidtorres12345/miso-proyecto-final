CREATE TABLE IF NOT EXISTS inventory_room_rate (
    room_id INTEGER PRIMARY KEY,
    property_id INTEGER NOT NULL,
    property_name VARCHAR(255) NULL,
    staff_user_id INTEGER NOT NULL,
    room_type VARCHAR(120) NOT NULL,
    base_rate DOUBLE PRECISION NOT NULL,
    offer_rate DOUBLE PRECISION NULL,
    offer_active BOOLEAN NOT NULL DEFAULT FALSE,
    currency VARCHAR(10) NOT NULL DEFAULT 'COP',
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_inventory_room_rate_room_type ON inventory_room_rate (room_type);
CREATE INDEX IF NOT EXISTS ix_inventory_room_rate_offer_active ON inventory_room_rate (offer_active);
CREATE INDEX IF NOT EXISTS ix_inventory_room_rate_property_id ON inventory_room_rate (property_id);
CREATE INDEX IF NOT EXISTS ix_inventory_room_rate_staff_user_id ON inventory_room_rate (staff_user_id);
