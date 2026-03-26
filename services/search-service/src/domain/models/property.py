import enum
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    Float,
    Index,
    Integer,
    String,
    Text,
    ARRAY,
)
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class AccommodationType(str, enum.Enum):
    hotel = "Hotel"
    casa = "Casa"
    cabana = "Cabaña"
    hostal = "Hostal"
    villa = "Villa"
    resort = "Resort"


class MealPlan(str, enum.Enum):
    none = "Ninguno"
    desayuno = "Desayuno"
    desayuno_buffet = "Desayuno buffet"
    all_inclusive = "All inclusive"


class Propiedad(Base):
    """
    Entidad principal del catálogo de hospedajes.
    Mapea la tabla PROPIEDAD del ER diagram, enriquecida con
    campos necesarios para filtros de HU002.
    """
    __tablename__ = "propiedad"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)

    # Ubicación
    ubicacion_geog = Column(String(500), nullable=False)   # Ciudad, país, etc.
    # pais es la clave de particionamiento (LIST PARTITION por país).
    # Valores ISO 3166-1 alpha-2 — MVP: 'CO' (Colombia), 'AR' (Argentina), 'US' (Estados Unidos)
    pais = Column(String(10), nullable=False, default="CO")
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    distancia_centro_km = Column(Float, nullable=True, default=0.0)

    # Categoría y tipo
    tipo = Column(
        Enum(AccommodationType, name="accommodation_type_enum"),
        nullable=False,
        default=AccommodationType.hotel,
    )
    estrellas = Column(Integer, nullable=True)             # 1-5

    # Servicios / amenidades (array de strings)
    amenidades = Column(ARRAY(String), nullable=True, default=[])

    # Plan de alimentación
    plan_alimentacion = Column(
        Enum(MealPlan, name="meal_plan_enum"),
        nullable=False,
        default=MealPlan.none,
    )
    acepta_mascotas = Column(Boolean, nullable=False, default=False)

    # Imagen principal
    imagen_url = Column(String(1000), nullable=True)

    # Integración PMS
    pms_endpoint = Column(String(500), nullable=True)

    # Impuesto aplicado a las tarifas (ej: 0.19 = 19% IVA Colombia)
    porcentaje_impuesto = Column(Float, nullable=False, default=0.19)

    # Relaciones
    habitaciones = relationship(
        "Habitacion", back_populates="propiedad", cascade="all, delete-orphan"
    )
    resenas = relationship(
        "Resena", back_populates="propiedad", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_propiedad_pais", "pais"),                        # clave de shard
        Index("ix_propiedad_ubicacion", "ubicacion_geog"),
        Index("ix_propiedad_tipo", "tipo"),
        Index("ix_propiedad_estrellas", "estrellas"),
        Index("ix_propiedad_acepta_mascotas", "acepta_mascotas"),
        Index("ix_propiedad_pais_ubicacion", "pais", "ubicacion_geog"),  # compuesto shard+search
    )

