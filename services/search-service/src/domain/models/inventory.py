from sqlalchemy import Column, Date, ForeignKey, Index, Integer
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Inventario(Base):
    """
    Disponibilidad de una habitación por fecha.
    Mapea la tabla INVENTARIO del ER diagram.
    
    Disponibilidad = CANTIDAD_TOTAL - CANTIDAD_CONFIRMADA > 0
    """
    __tablename__ = "inventario"

    id = Column(Integer, primary_key=True, index=True)
    habitacion_id = Column(
        Integer, ForeignKey("habitacion.id", ondelete="CASCADE"), nullable=False
    )
    fecha = Column(Date, nullable=False)
    cantidad_total = Column(Integer, nullable=False, default=0)
    cantidad_confirmada = Column(Integer, nullable=False, default=0)

    # Relaciones
    habitacion = relationship("Habitacion", back_populates="inventarios")

    __table_args__ = (
        Index("ix_inventario_fecha_habitacion", "fecha", "habitacion_id"),
    )

