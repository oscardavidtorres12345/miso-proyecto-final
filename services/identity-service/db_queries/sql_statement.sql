CREATE TABLE JURISDICCION (
    id_jurisdiccion SERIAL PRIMARY KEY,
    codigo_iso CHAR(2) UNIQUE NOT NULL, -- 'CO', 'AR'
    nombre_region VARCHAR(50) NOT NULL,
    normativa_aplicable VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ROL (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE PERMISO (
    id_permiso SERIAL PRIMARY KEY,
    clave_permiso VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

CREATE TABLE ROL_PERMISO (
    id_rol INT REFERENCES ROL(id_rol) ON DELETE CASCADE,
    id_permiso INT REFERENCES PERMISO(id_permiso) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE USUARIO (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    id_rol INT REFERENCES Rol(id_rol),
    activo BOOLEAN DEFAULT TRUE,
    ultima_conexion TIMESTAMP WITH TIME ZONE
);

CREATE TABLE USUARIO_JURISDICCION_PERMITIDA (
    id_usuario INT REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    id_jurisdiccion INT REFERENCES JURISDICCION(id_jurisdiccion) ON DELETE CASCADE,
    PRIMARY KEY (id_usuario, id_jurisdiccion)
);

-- Tabla de Auditoría optimizada para Postgres
CREATE TABLE LOG_AUDITORIA_ACCESO (
    id_log BIGSERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuario(id_usuario),
    ip_origen INET NOT NULL, -- Tipo nativo de Postgres para IPs
    tipo_informacion VARCHAR(100),
    jurisdiccion_solicitada CHAR(2),
    resultado_acceso VARCHAR(20) CHECK (resultado_acceso IN ('RECHAZADO', 'CONCEDIDO')),
    latencia_ms INT,
    motivo_rechazo TEXT,
    timestamp_intento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice optimizado para la alerta de 3 intentos/hora
CREATE INDEX idx_alerta_cumplimiento
ON Log_Auditoria_Acceso (id_usuario, timestamp_intento)
WHERE resultado_acceso = 'RECHAZADO';

CREATE TABLE HUESPED (
    id_huesped SERIAL PRIMARY KEY,
    -- Datos de Identidad (Relación con cuenta de acceso)
    id_usuario INT REFERENCES USUARIO(id_usuario) ON DELETE SET NULL,

    -- Datos Personales (Sujetos a GDPR/LGPD)
    nombre_completo VARCHAR(150) NOT NULL,
    documento_id VARCHAR(50) NOT NULL,
    email_contacto VARCHAR(100),

    id_jurisdiccion INT NOT NULL REFERENCES JURISDICCION(id_jurisdiccion),

    -- Auditoría interna de la fila
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE
);

-- Índice para búsquedas rápidas por jurisdicción (Optimiza validaciones < 100ms)
CREATE INDEX idx_huesped_jurisdiccion ON HUESPED(id_jurisdiccion);

CREATE OR REPLACE FUNCTION check_intentos_fallidos()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
BEGIN
    IF (SELECT COUNT(*) FROM Log_Auditoria_Acceso
        WHERE id_usuario = NEW.id_usuario
        AND resultado_acceso = 'RECHAZADO'
        AND timestamp_intento > NOW() - INTERVAL '1 hour') >= 3 THEN

        -- Creamos un JSON con la info para la API
        payload = json_build_object(
            'usuario_id', NEW.id_usuario,
            'ip', NEW.ip_origen,
            'jurisdiccion', NEW.jurisdiccion_solicitada,
            'motivo', 'Exceso de intentos fallidos cross-border'
        );

        PERFORM pg_notify('alerta_seguridad', payload::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
