CREATE TABLE IF NOT EXISTS push_token (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(120) NOT NULL,
    expo_push_token VARCHAR(128) NOT NULL UNIQUE,
    platform VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_push_token_user_id ON push_token (user_id);
CREATE INDEX IF NOT EXISTS ix_push_token_expo_push_token ON push_token (expo_push_token);
