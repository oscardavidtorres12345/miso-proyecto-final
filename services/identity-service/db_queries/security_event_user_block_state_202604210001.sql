-- Additive migration for existing identity databases.
-- Introduces user blocking state and cross-domain security events.

CREATE TABLE IF NOT EXISTS user_block_state (
    user_id INT PRIMARY KEY REFERENCES user_account(user_id) ON DELETE CASCADE,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    block_reason VARCHAR(255),
    blocked_by_user_id INT REFERENCES user_account(user_id),
    block_source VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_block_state_is_blocked
ON user_block_state (is_blocked);

CREATE INDEX IF NOT EXISTS idx_user_block_state_blocked_until
ON user_block_state (blocked_until);

CREATE TABLE IF NOT EXISTS security_event (
    event_id BIGSERIAL PRIMARY KEY,
    correlation_id UUID NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    source_service VARCHAR(60) NOT NULL DEFAULT 'identity-service',
    source_log_id BIGINT REFERENCES access_audit_log(log_id),
    actor_user_id INT REFERENCES user_account(user_id),
    target_user_id INT REFERENCES user_account(user_id),
    source_ip INET,
    session_id VARCHAR(128),
    device_fingerprint VARCHAR(128),
    gateway VARCHAR(30),
    payment_ref VARCHAR(80),
    gateway_event_id VARCHAR(120),
    rule_code VARCHAR(80),
    attempts_count INT,
    threshold_value INT,
    action_taken VARCHAR(80),
    blocked_until TIMESTAMP WITH TIME ZONE,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    alert_sent_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_security_event_timestamp
ON security_event (event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_security_event_correlation
ON security_event (correlation_id);

CREATE INDEX IF NOT EXISTS idx_security_event_target_user
ON security_event (target_user_id);

CREATE INDEX IF NOT EXISTS idx_security_event_type
ON security_event (event_type);

CREATE INDEX IF NOT EXISTS idx_security_event_status
ON security_event (status);

CREATE INDEX IF NOT EXISTS idx_security_event_source_ip
ON security_event (source_ip);
