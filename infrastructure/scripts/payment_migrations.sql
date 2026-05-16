CREATE TABLE IF NOT EXISTS payment_transaction (
    payment_id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL,
    stripe_payment_intent_id VARCHAR(128) UNIQUE NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method_id VARCHAR(64) NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    failure_code VARCHAR(50) NULL,
    failure_message TEXT NULL
);

CREATE INDEX IF NOT EXISTS ix_payment_booking_id ON payment_transaction (booking_id);
CREATE INDEX IF NOT EXISTS ix_payment_status ON payment_transaction (status);
CREATE INDEX IF NOT EXISTS ix_payment_stripe_intent_id ON payment_transaction (stripe_payment_intent_id);

CREATE TABLE IF NOT EXISTS webhook_event (
    event_id VARCHAR(64) PRIMARY KEY,
    stripe_event_id VARCHAR(128) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payment_id VARCHAR(64) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    payload TEXT NOT NULL,
    received_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS ix_webhook_stripe_event_id ON webhook_event (stripe_event_id);
CREATE INDEX IF NOT EXISTS ix_webhook_status ON webhook_event (status);

CREATE TABLE IF NOT EXISTS payment_method (
    payment_method_id VARCHAR(64) PRIMARY KEY,
    stripe_payment_method_id VARCHAR(128) UNIQUE NOT NULL,
    user_id VARCHAR(120) NOT NULL,
    card_brand VARCHAR(20) NULL,
    last4_digits VARCHAR(4) NULL,
    exp_month INTEGER NULL,
    exp_year INTEGER NULL,
    country VARCHAR(2) NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_payment_method_user_id ON payment_method (user_id);

CREATE TABLE IF NOT EXISTS supported_currency (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    symbol VARCHAR(8) NOT NULL,
    decimals INTEGER NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO supported_currency (code, name, symbol, decimals, is_active)
VALUES
    ('COP', 'Peso colombiano', '$', 0, TRUE),
    ('USD', 'United States dollar', '$', 2, TRUE),
    ('ARS', 'Peso argentino', '$', 2, TRUE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS fx_rate (
    id BIGSERIAL PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL REFERENCES supported_currency(code),
    quote_currency VARCHAR(3) NOT NULL REFERENCES supported_currency(code),
    rate NUMERIC(18, 8) NOT NULL,
    effective_at TIMESTAMP NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fx_rate_pair_distinct CHECK (base_currency <> quote_currency),
    CONSTRAINT fx_rate_positive CHECK (rate > 0),
    CONSTRAINT fx_rate_unique_pair_effective UNIQUE (base_currency, quote_currency, effective_at)
);

CREATE INDEX IF NOT EXISTS idx_fx_rate_pair_effective
    ON fx_rate (base_currency, quote_currency, effective_at DESC);

INSERT INTO fx_rate (base_currency, quote_currency, rate, effective_at, source)
VALUES
    ('USD', 'COP', 3775.07000000, CURRENT_TIMESTAMP, 'manual'),
    ('COP', 'USD', 0.00026490, CURRENT_TIMESTAMP, 'manual'),
    ('USD', 'ARS', 1389.75600000, CURRENT_TIMESTAMP, 'manual'),
    ('ARS', 'USD', 0.00071955, CURRENT_TIMESTAMP, 'manual'),
    ('COP', 'ARS', 0.36814000, CURRENT_TIMESTAMP, 'manual'),
    ('ARS', 'COP', 2.71638000, CURRENT_TIMESTAMP, 'manual')
ON CONFLICT (base_currency, quote_currency, effective_at) DO NOTHING;

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (version) VALUES
    ('0001_init.sql'),
    ('0002_add_supported_currencies.sql'),
    ('0003_add_fx_rates.sql'),
    ('0004_fix_fx_rate_pk_sqlite_compat.sql')
ON CONFLICT (version) DO NOTHING;
