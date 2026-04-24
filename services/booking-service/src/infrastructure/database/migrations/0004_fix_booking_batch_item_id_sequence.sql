CREATE SEQUENCE IF NOT EXISTS booking_batch_item_id_seq;

ALTER TABLE booking_batch_item
ALTER COLUMN id SET DEFAULT nextval('booking_batch_item_id_seq');

SELECT setval(
    'booking_batch_item_id_seq',
    COALESCE((SELECT MAX(id) FROM booking_batch_item), 0) + 1,
    false
);
