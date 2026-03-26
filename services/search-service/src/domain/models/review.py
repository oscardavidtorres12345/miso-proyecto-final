from sqlalchemy import Column, Date, Float, ForeignKey, Index, Integer, Text
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Resena(Base):
    """
    Reseña de un huésped sobre una propiedad.
    Mapea la tabla RESENA del ER diagram.
    """
    __tablename__ = "resena"

    id = Column(Integer, primary_key=True, index=True)
    propiedad_id = Column(
        Integer, ForeignKey("propiedad.id", ondelete="CASCADE"), nullable=False
    )
    calificacion = Column(Float, nullable=False)   # 1.0 – 5.0
    comentario = Column(Text, nullable=True)
    fecha = Column(Date, nullable=True)

    # Relaciones
    propiedad = relationship("Propiedad", back_populates="resenas")

    __table_args__ = (
        Index("ix_resena_propiedad_id", "propiedad_id"),
    )

