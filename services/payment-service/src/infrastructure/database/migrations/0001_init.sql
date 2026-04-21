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
