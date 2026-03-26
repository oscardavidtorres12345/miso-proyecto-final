from sqlalchemy import Column, Date, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Tarifa(Base):
    """
    Tarifa (precio) de una habitación por fecha.
    Mapea la tabla TARIFA del ER diagram.
    """
    __tablename__ = "tarifa"

    id = Column(Integer, primary_key=True, index=True)
    habitacion_id = Column(
        Integer, ForeignKey("habitacion.id", ondelete="CASCADE"), nullable=False
    )
    fecha = Column(Date, nullable=False)
    monto = Column(Float, nullable=False)             # precio por noche (sin impuesto)
    moneda = Column(String(10), nullable=False, default="COP")
    reglas_cancelacion = Column(Text, nullable=True)

    # Relaciones
    habitacion = relationship("Habitacion", back_populates="tarifas")

    __table_args__ = (
        Index("ix_tarifa_fecha_habitacion", "fecha", "habitacion_id"),
        Index("ix_tarifa_monto", "monto"),
    )

