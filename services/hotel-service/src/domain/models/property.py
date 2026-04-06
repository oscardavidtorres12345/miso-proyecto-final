"""
Modelo Property — mapea la tabla 'property' de DB CATALOG A.
Tabla particionada por country (LIST PARTITION). PK compuesta (id, country).
"""
import enum

from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    Enum,
    Float,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class AccommodationType(str, enum.Enum):
    hotel = "hotel"
    house = "house"
    cabin = "cabin"
    hostel = "hostel"
    villa = "villa"
    resort = "resort"


class MealPlan(str, enum.Enum):
    none = "none"
    breakfast = "breakfast"
    buffet = "buffet"
    all_inclusive = "allinclusive"


class Property(Base):
    """Catálogo de hospedajes. Tabla principal de DB CATALOG A."""

    __tablename__ = "property"

    id = Column(Integer, primary_key=True, index=True)
    country = Column(String(10), nullable=False, default="CO", primary_key=True)
    name = Column(String(255), nullable=False)
    location = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    distance_to_center_km = Column(Float, nullable=True, default=0.0)

    accommodation_type = Column(
        Enum(AccommodationType, name="accommodation_type_enum",
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AccommodationType.hotel,
    )
    stars = Column(Integer, nullable=True)
    amenities = Column(ARRAY(String), nullable=True, default=[])
    meal_plan = Column(
        Enum(MealPlan, name="meal_plan_enum",
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=MealPlan.none,
    )
    pets_allowed = Column(Boolean, nullable=False, default=False)
    image_url = Column(String(1000), nullable=True)
    pms_endpoint = Column(String(500), nullable=True)
    tax_rate = Column(Float, nullable=False, default=0.19)

    rooms = relationship("Room", back_populates="property", lazy="select")
    reviews = relationship("Review", back_populates="property", lazy="select")

    __table_args__ = {"extend_existing": True}
