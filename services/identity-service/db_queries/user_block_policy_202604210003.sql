-- Incremental update for user_block_state policy model.
-- Adds severity and unblock_policy columns for block lifecycle handling.

ALTER TABLE user_block_state
ADD COLUMN IF NOT EXISTS severity VARCHAR(20);

ALTER TABLE user_block_state
ADD COLUMN IF NOT EXISTS unblock_policy VARCHAR(30);

UPDATE user_block_state
SET severity = 'MEDIUM'
WHERE severity IS NULL;

UPDATE user_block_state
SET unblock_policy = 'MANUAL_ONLY'
WHERE unblock_policy IS NULL;

ALTER TABLE user_block_state
ALTER COLUMN severity SET DEFAULT 'MEDIUM';

ALTER TABLE user_block_state
ALTER COLUMN severity SET NOT NULL;

ALTER TABLE user_block_state
ALTER COLUMN unblock_policy SET DEFAULT 'MANUAL_ONLY';

ALTER TABLE user_block_state
ALTER COLUMN unblock_policy SET NOT NULL;
