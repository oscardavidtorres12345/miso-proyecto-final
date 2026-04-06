"""
Modelo Review — reseña de un huésped sobre una propiedad.
"""
from sqlalchemy import Column, DateTime, Float, Integer, Text
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Review(Base):
    """Reseña de una propiedad."""

    __tablename__ = "review"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, nullable=False, index=True)
    rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    review_date = Column(DateTime(timezone=True), nullable=True)

    property = relationship("Property", back_populates="reviews")

    __table_args__ = {"extend_existing": True}
