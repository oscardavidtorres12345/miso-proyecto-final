"""
Modelo Room — mapea la tabla 'room' de DB CATALOG A.
Incluye description e image_url (presentes en la DDL del search-service).
"""
from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Room(Base):
    """Habitación perteneciente a una propiedad."""

    __tablename__ = "room"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    max_capacity = Column(Integer, nullable=False, default=2)
    bed_type = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(1000), nullable=True)

    property = relationship("Property", back_populates="rooms")
    rates = relationship("Rate", back_populates="room", lazy="select")

    __table_args__ = {"extend_existing": True}
