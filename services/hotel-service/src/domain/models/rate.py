"""
Modelo Rate — precio por noche de una habitación en una fecha concreta.
"""
from sqlalchemy import Column, Date, Float, Integer, String
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Rate(Base):
    """Tarifa diaria de una habitación."""

    __tablename__ = "rate"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, nullable=False, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="COP")

    room = relationship("Room", back_populates="rates")

    __table_args__ = {"extend_existing": True}
