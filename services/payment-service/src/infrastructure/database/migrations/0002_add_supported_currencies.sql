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
