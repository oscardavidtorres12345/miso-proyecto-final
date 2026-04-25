-- Add enrichment columns to booking table so we can store property name,
-- city and image URL at hold creation time and avoid calling the
-- search-service on every listing request.

ALTER TABLE booking
    ADD COLUMN property_name VARCHAR(255),
    ADD COLUMN city VARCHAR(120),
    ADD COLUMN image_url VARCHAR(500);
