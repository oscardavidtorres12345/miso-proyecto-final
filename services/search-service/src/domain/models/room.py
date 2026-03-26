from sqlalchemy import Column, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Habitacion(Base):
    """
    Habitaciones de una propiedad.
    Mapea la tabla HABITACION del ER diagram.
    """
    __tablename__ = "habitacion"

    id = Column(Integer, primary_key=True, index=True)
    propiedad_id = Column(
        Integer, ForeignKey("propiedad.id", ondelete="CASCADE"), nullable=False
    )
    nombre = Column(String(255), nullable=False)
    capacidad_max = Column(Integer, nullable=False)   # Adultos + Niños
    tipo_cama = Column(String(100), nullable=True)    # doble, twin, king, etc.

    # Relaciones
    propiedad = relationship("Propiedad", back_populates="habitaciones")
    inventarios = relationship(
        "Inventario", back_populates="habitacion", cascade="all, delete-orphan"
    )
    tarifas = relationship(
        "Tarifa", back_populates="habitacion", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_habitacion_propiedad_id", "propiedad_id"),
        Index("ix_habitacion_capacidad_max", "capacidad_max"),
    )

