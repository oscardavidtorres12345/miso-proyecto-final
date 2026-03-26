"""
db_init.py — PostgreSQL partitioned schema initializer (HU023 — PF-280).

Creates the `propiedad` table with LIST PARTITIONING by country code (pais).
MVP countries (ISO 3166-1 alpha-2):
  - propiedad_co      → 'CO' (Colombia)
  - propiedad_ar      → 'AR' (Argentina)
  - propiedad_us      → 'US' (Estados Unidos)
  - propiedad_default → DEFAULT (cualquier otro código futuro)

Enables pg_trgm for trigram text search on ubicacion_geog (PF-282).
Adds GIN index on amenidades[] for fast array containment queries (PF-282).
Adds composite index on inventario(habitacion_id, fecha) for BETWEEN queries.

NOTE: Partitioned tables use composite PK (id, pais). Foreign keys from
habitacion/resena to propiedad are enforced at the application level, which
is the standard practice in geographically sharded databases.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy import text

logger = logging.getLogger(__name__)

_DDL: list[str] = [
    # ── Extensions ────────────────────────────────────────────────────────────
    "CREATE EXTENSION IF NOT EXISTS pg_trgm",

    # ── Enums ─────────────────────────────────────────────────────────────────
    """DO $$ BEGIN
        CREATE TYPE accommodation_type_enum AS ENUM (
            'Hotel','Casa','Cabaña','Hostal','Villa','Resort'
        );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$""",

    """DO $$ BEGIN
        CREATE TYPE meal_plan_enum AS ENUM (
            'Ninguno','Desayuno','Desayuno buffet','All inclusive'
        );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$""",

    # ── Sequence for propiedad.id ─────────────────────────────────────────────
    "CREATE SEQUENCE IF NOT EXISTS propiedad_id_seq",

    # ── Partitioned parent table ──────────────────────────────────────────────
    """CREATE TABLE IF NOT EXISTS propiedad (
        id                  INTEGER NOT NULL DEFAULT nextval('propiedad_id_seq'),
        pais                VARCHAR(10) NOT NULL DEFAULT 'CO',
        nombre              VARCHAR(255) NOT NULL,
        ubicacion_geog      VARCHAR(500) NOT NULL,
        latitud             FLOAT,
        longitud            FLOAT,
        distancia_centro_km FLOAT DEFAULT 0.0,
        tipo                accommodation_type_enum NOT NULL DEFAULT 'Hotel',
        estrellas           INTEGER,
        amenidades          TEXT[],
        plan_alimentacion   meal_plan_enum NOT NULL DEFAULT 'Ninguno',
        acepta_mascotas     BOOLEAN NOT NULL DEFAULT FALSE,
        imagen_url          VARCHAR(1000),
        pms_endpoint        VARCHAR(500),
        porcentaje_impuesto FLOAT NOT NULL DEFAULT 0.19,
        PRIMARY KEY (id, pais)
    ) PARTITION BY LIST (pais)""",

    # ── Country partitions (MVP: CO, AR, US — ISO 3166-1 alpha-2) ───────────
    "CREATE TABLE IF NOT EXISTS propiedad_co      PARTITION OF propiedad FOR VALUES IN ('CO')",
    "CREATE TABLE IF NOT EXISTS propiedad_ar      PARTITION OF propiedad FOR VALUES IN ('AR')",
    "CREATE TABLE IF NOT EXISTS propiedad_us      PARTITION OF propiedad FOR VALUES IN ('US')",
    "CREATE TABLE IF NOT EXISTS propiedad_default PARTITION OF propiedad DEFAULT",

    # ── Indexes on parent (propagate to all partitions automatically) ─────────
    "CREATE INDEX IF NOT EXISTS ix_propiedad_pais          ON propiedad (pais)",
    "CREATE INDEX IF NOT EXISTS ix_propiedad_tipo          ON propiedad (tipo)",
    "CREATE INDEX IF NOT EXISTS ix_propiedad_estrellas     ON propiedad (estrellas)",
    "CREATE INDEX IF NOT EXISTS ix_propiedad_mascotas      ON propiedad (acepta_mascotas)",
    "CREATE INDEX IF NOT EXISTS ix_propiedad_pais_ubic     ON propiedad (pais, ubicacion_geog)",
    # GIN trigram: enables ilike/similarity on ubicacion_geog without seq-scan
    "CREATE INDEX IF NOT EXISTS ix_propiedad_ubic_trgm     ON propiedad USING GIN (ubicacion_geog gin_trgm_ops)",
    # GIN array: enables @> (contains) on amenidades
    "CREATE INDEX IF NOT EXISTS ix_propiedad_amenidades    ON propiedad USING GIN (amenidades)",

    # ── habitacion (no DB-level FK because propiedad PK is composite) ─────────
    """CREATE TABLE IF NOT EXISTS habitacion (
        id            SERIAL PRIMARY KEY,
        nombre        VARCHAR(255) NOT NULL,
        propiedad_id  INTEGER NOT NULL,
        capacidad_max INTEGER NOT NULL DEFAULT 2,
        tipo_cama     VARCHAR(100),
        descripcion   TEXT,
        imagen_url    VARCHAR(1000)
    )""",
    "CREATE INDEX IF NOT EXISTS ix_habitacion_prop ON habitacion (propiedad_id)",

    # ── inventario ────────────────────────────────────────────────────────────
    """CREATE TABLE IF NOT EXISTS inventario (
        id                  SERIAL PRIMARY KEY,
        habitacion_id       INTEGER NOT NULL,
        fecha               DATE NOT NULL,
        cantidad_total      INTEGER NOT NULL DEFAULT 0,
        cantidad_confirmada INTEGER NOT NULL DEFAULT 0,
        UNIQUE (habitacion_id, fecha)
    )""",
    # Composite index makes BETWEEN date queries on (hab, fecha) very fast
    "CREATE INDEX IF NOT EXISTS ix_inventario_hab_fecha ON inventario (habitacion_id, fecha)",

    # ── tarifa ────────────────────────────────────────────────────────────────
    """CREATE TABLE IF NOT EXISTS tarifa (
        id            SERIAL PRIMARY KEY,
        habitacion_id INTEGER NOT NULL,
        fecha         DATE NOT NULL,
        monto         FLOAT NOT NULL,
        moneda        VARCHAR(10) NOT NULL DEFAULT 'COP',
        UNIQUE (habitacion_id, fecha)
    )""",
    "CREATE INDEX IF NOT EXISTS ix_tarifa_hab_fecha ON tarifa (habitacion_id, fecha)",

    # ── resena ────────────────────────────────────────────────────────────────
    """CREATE TABLE IF NOT EXISTS resena (
        id            SERIAL PRIMARY KEY,
        propiedad_id  INTEGER NOT NULL,
        calificacion  FLOAT NOT NULL,
        comentario    TEXT,
        fecha_resena  TIMESTAMPTZ
    )""",
    "CREATE INDEX IF NOT EXISTS ix_resena_prop ON resena (propiedad_id)",
]


async def init_partitioned_db(engine: AsyncEngine) -> None:
    """
    Executes all DDL statements to create the partitioned schema.
    Safe to call multiple times — all statements use IF NOT EXISTS.
    """
    async with engine.begin() as conn:
        for stmt in _DDL:
            try:
                await conn.execute(text(stmt))
            except Exception as exc:  # pragma: no cover
                logger.warning("DDL skipped (%s): %s", type(exc).__name__, exc)
    logger.info("Partitioned schema ready (propiedad LIST PARTITION BY pais).")

