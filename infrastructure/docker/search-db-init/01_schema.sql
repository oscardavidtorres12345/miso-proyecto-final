-- =============================================================================
-- 01_schema.sql — search_db partitioned schema (HU023 PF-280)
-- =============================================================================
-- Creates the partitioned property table (LIST PARTITION BY country),
-- room, inventory, rate and review tables with their indexes.
-- Safe to run multiple times — all statements use IF NOT EXISTS.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enums
DO $$ BEGIN
    CREATE TYPE accommodation_type_enum AS ENUM (
        'hotel','house','cabin','hostel','villa','resort'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE meal_plan_enum AS ENUM (
        'none','breakfast','buffet','allinclusive'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sequence for property.id
CREATE SEQUENCE IF NOT EXISTS property_id_seq;

-- Partitioned parent table (LIST PARTITION BY country)
CREATE TABLE IF NOT EXISTS property (
    id                    INTEGER NOT NULL DEFAULT nextval('property_id_seq'),
    country               VARCHAR(10) NOT NULL DEFAULT 'CO',
    name                  VARCHAR(255) NOT NULL,
    location              VARCHAR(500) NOT NULL,
    latitude              FLOAT,
    longitude             FLOAT,
    distance_to_center_km FLOAT DEFAULT 0.0,
    accommodation_type    accommodation_type_enum NOT NULL DEFAULT 'hotel',
    stars                 INTEGER,
    amenities             TEXT[],
    meal_plan             meal_plan_enum NOT NULL DEFAULT 'none',
    pets_allowed          BOOLEAN NOT NULL DEFAULT FALSE,
    description           TEXT,
    image_url             VARCHAR(1000),
    pms_endpoint          VARCHAR(500),
    tax_rate              FLOAT NOT NULL DEFAULT 0.19,
    PRIMARY KEY (id, country)
) PARTITION BY LIST (country);

-- Country partitions (MVP: CO, AR, US)
CREATE TABLE IF NOT EXISTS property_co      PARTITION OF property FOR VALUES IN ('CO');
CREATE TABLE IF NOT EXISTS property_ar      PARTITION OF property FOR VALUES IN ('AR');
CREATE TABLE IF NOT EXISTS property_us      PARTITION OF property FOR VALUES IN ('US');
CREATE TABLE IF NOT EXISTS property_default PARTITION OF property DEFAULT;

-- Idempotent column additions (safe to run on existing tables)
DO $$ BEGIN
    ALTER TABLE property ADD COLUMN description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Indexes (propagate to all partitions automatically)
CREATE INDEX IF NOT EXISTS ix_property_country            ON property (country);
CREATE INDEX IF NOT EXISTS ix_property_accommodation_type ON property (accommodation_type);
CREATE INDEX IF NOT EXISTS ix_property_stars              ON property (stars);
CREATE INDEX IF NOT EXISTS ix_property_pets_allowed       ON property (pets_allowed);
CREATE INDEX IF NOT EXISTS ix_property_country_location   ON property (country, location);
CREATE INDEX IF NOT EXISTS ix_property_location_trgm      ON property USING GIN (location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_property_amenities          ON property USING GIN (amenities);

-- room
CREATE TABLE IF NOT EXISTS room (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    property_id   INTEGER NOT NULL,
    max_capacity  INTEGER NOT NULL DEFAULT 2,
    bed_type      VARCHAR(100),
    description   TEXT,
    image_url     VARCHAR(1000)
);
CREATE INDEX IF NOT EXISTS ix_room_property_id ON room (property_id);

-- inventory
CREATE TABLE IF NOT EXISTS inventory (
    id                 SERIAL PRIMARY KEY,
    room_id            INTEGER NOT NULL,
    date               DATE NOT NULL,
    total_quantity     INTEGER NOT NULL DEFAULT 0,
    confirmed_quantity INTEGER NOT NULL DEFAULT 0,
    UNIQUE (room_id, date)
);
CREATE INDEX IF NOT EXISTS ix_inventory_room_date ON inventory (room_id, date);

-- rate
CREATE TABLE IF NOT EXISTS rate (
    id          SERIAL PRIMARY KEY,
    room_id     INTEGER NOT NULL,
    date        DATE NOT NULL,
    amount      FLOAT NOT NULL,
    currency    VARCHAR(10) NOT NULL DEFAULT 'COP',
    UNIQUE (room_id, date)
);
CREATE INDEX IF NOT EXISTS ix_rate_room_date ON rate (room_id, date);

-- review
CREATE TABLE IF NOT EXISTS review (
    id           SERIAL PRIMARY KEY,
    property_id  INTEGER NOT NULL,
    rating       FLOAT NOT NULL,
    comment      TEXT,
    review_date  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_review_property_id ON review (property_id);
