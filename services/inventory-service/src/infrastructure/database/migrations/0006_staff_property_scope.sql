CREATE TABLE IF NOT EXISTS inventory_staff_property (
    id SERIAL PRIMARY KEY,
    staff_user_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_inventory_staff_property_staff_property
        UNIQUE (staff_user_id, property_id)
);

CREATE INDEX IF NOT EXISTS ix_inventory_staff_property_staff_user_id
    ON inventory_staff_property (staff_user_id);
CREATE INDEX IF NOT EXISTS ix_inventory_staff_property_property_id
    ON inventory_staff_property (property_id);
