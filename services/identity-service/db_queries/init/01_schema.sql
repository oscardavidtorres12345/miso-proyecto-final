CREATE TABLE JURISDICTION (
    jurisdiction_id SERIAL PRIMARY KEY,
    iso_code CHAR(2) UNIQUE NOT NULL, -- 'CO', 'AR'
    region_name VARCHAR(50) NOT NULL,
    applicable_regulation VARCHAR(50) NOT NULL,
    privacy_title VARCHAR(200) NOT NULL,
    privacy_content TEXT NOT NULL,
    privacy_pdf_url JSONB NOT NULL,
    privacy_version VARCHAR(30) NOT NULL,
    privacy_effective_at TIMESTAMP WITH TIME ZONE,
    privacy_contact_email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ROLE (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE PERMISSION (
    permission_id SERIAL PRIMARY KEY,
    permission_key VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE ROLE_PERMISSION (
    role_id INT REFERENCES ROLE(role_id) ON DELETE CASCADE,
    permission_id INT REFERENCES PERMISSION(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE USER_ACCOUNT (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INT REFERENCES ROLE(role_id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE USER_ALLOWED_JURISDICTION (
    user_id INT REFERENCES USER_ACCOUNT(user_id) ON DELETE CASCADE,
    jurisdiction_id INT REFERENCES JURISDICTION(jurisdiction_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, jurisdiction_id)
);

CREATE TABLE DOCUMENT_TYPE (
    document_type_id INT PRIMARY KEY,
    document_type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Access audit table optimized for PostgreSQL
CREATE TABLE ACCESS_AUDIT_LOG (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES USER_ACCOUNT(user_id),
    source_ip INET NOT NULL,
    information_type VARCHAR(100),
    requested_jurisdiction CHAR(2),
    access_result VARCHAR(20) CHECK (access_result IN ('REJECTED', 'GRANTED')),
    latency_ms INT,
    rejection_reason TEXT,
    attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimized index for the 3 failed attempts/hour security rule
CREATE INDEX idx_access_audit_failed_attempts
ON ACCESS_AUDIT_LOG (user_id, attempt_timestamp)
WHERE access_result = 'REJECTED';

-- User blocking state managed by identity-service
CREATE TABLE USER_BLOCK_STATE (
    user_id INT PRIMARY KEY REFERENCES USER_ACCOUNT(user_id) ON DELETE CASCADE,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    block_reason VARCHAR(255),
    blocked_by_user_id INT REFERENCES USER_ACCOUNT(user_id),
    block_source VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_block_state_is_blocked
ON USER_BLOCK_STATE (is_blocked);

CREATE INDEX idx_user_block_state_blocked_until
ON USER_BLOCK_STATE (blocked_until);

-- Cross-domain security incident/event timeline
CREATE TABLE SECURITY_EVENT (
    event_id BIGSERIAL PRIMARY KEY,
    correlation_id UUID NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    source_service VARCHAR(60) NOT NULL DEFAULT 'identity-service',
    source_log_id BIGINT REFERENCES ACCESS_AUDIT_LOG(log_id),
    actor_user_id INT REFERENCES USER_ACCOUNT(user_id),
    target_user_id INT REFERENCES USER_ACCOUNT(user_id),
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

CREATE INDEX idx_security_event_timestamp
ON SECURITY_EVENT (event_timestamp DESC);

CREATE INDEX idx_security_event_correlation
ON SECURITY_EVENT (correlation_id);

CREATE INDEX idx_security_event_target_user
ON SECURITY_EVENT (target_user_id);

CREATE INDEX idx_security_event_type
ON SECURITY_EVENT (event_type);

CREATE INDEX idx_security_event_status
ON SECURITY_EVENT (status);

CREATE INDEX idx_security_event_source_ip
ON SECURITY_EVENT (source_ip);

CREATE TABLE GUEST (
    guest_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES USER_ACCOUNT(user_id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    document_type_id INT NOT NULL REFERENCES DOCUMENT_TYPE(document_type_id),
    document_id VARCHAR(50) NOT NULL,
    contact_email VARCHAR(100),
    jurisdiction_id INT NOT NULL REFERENCES JURISDICTION(jurisdiction_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_guest_jurisdiction ON GUEST(jurisdiction_id);

CREATE OR REPLACE FUNCTION check_failed_attempts()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
BEGIN
    IF (
        SELECT COUNT(*)
        FROM ACCESS_AUDIT_LOG
        WHERE user_id = NEW.user_id
          AND access_result = 'REJECTED'
          AND attempt_timestamp > NOW() - INTERVAL '1 hour'
    ) >= 3 THEN
        payload = json_build_object(
            'user_id', NEW.user_id,
            'ip', NEW.source_ip,
            'jurisdiction', NEW.requested_jurisdiction,
            'reason', 'Exceeded failed attempts threshold'
        );

        PERFORM pg_notify('security_alert', payload::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_failed_attempts
AFTER INSERT ON ACCESS_AUDIT_LOG
FOR EACH ROW
EXECUTE FUNCTION check_failed_attempts();
