from sqlalchemy import Column, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Room(Base):
    """
    Rooms belonging to a property.
    Maps the ROOM table from the ER diagram.
    """
    __tablename__ = "room"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(
        Integer, ForeignKey("property.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(255), nullable=False)
    max_capacity = Column(Integer, nullable=False)    # Adults + Children
    bed_type = Column(String(100), nullable=True)     # double, twin, king, etc.
    description = Column(String(1000), nullable=True) # HU004: visible en detalle
    image_url = Column(String(1000), nullable=True)   # HU004: foto de la habitación

    # Relationships
    property = relationship("Property", back_populates="rooms")
    inventories = relationship(
        "Inventory", back_populates="room", cascade="all, delete-orphan"
    )
    rates = relationship(
        "Rate", back_populates="room", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_room_property_id", "property_id"),
        Index("ix_room_max_capacity", "max_capacity"),
    )

