CREATE TABLE IF NOT EXISTS inventory_stock (
    room_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_units INTEGER NOT NULL DEFAULT 0,
    confirmed_units INTEGER NOT NULL DEFAULT 0,
    held_units INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (room_id, date)
);

CREATE TABLE IF NOT EXISTS inventory_hold (
    hold_id VARCHAR(64) PRIMARY KEY,
    room_id INTEGER NOT NULL,
    user_id VARCHAR(120) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    units INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS ix_inventory_hold_room_id ON inventory_hold (room_id);
CREATE INDEX IF NOT EXISTS ix_inventory_hold_user_id ON inventory_hold (user_id);
CREATE INDEX IF NOT EXISTS ix_inventory_hold_status ON inventory_hold (status);
CREATE INDEX IF NOT EXISTS ix_inventory_hold_expires_at ON inventory_hold (expires_at);
