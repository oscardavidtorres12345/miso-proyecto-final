CREATE TABLE JURISDICTION (
    jurisdiction_id SERIAL PRIMARY KEY,
    iso_code CHAR(2) UNIQUE NOT NULL, -- 'CO', 'AR'
    region_name VARCHAR(50) NOT NULL,
    applicable_regulation VARCHAR(50) NOT NULL,
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
