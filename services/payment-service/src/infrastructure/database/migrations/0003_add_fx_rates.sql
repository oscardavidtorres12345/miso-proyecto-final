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
