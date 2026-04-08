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
    """
    Main accommodation catalog entity.
    Maps the PROPERTY table from the ER diagram, enriched with
    fields required by HU002 filters.
    """
    __tablename__ = "property"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)

    # Location
    location = Column(String(500), nullable=False)          # City, country, etc.
    # country is the partition key (LIST PARTITION BY country).
    # ISO 3166-1 alpha-2 values — MVP: 'CO' (Colombia), 'AR' (Argentina), 'US' (United States)
    country = Column(String(10), nullable=False, default="CO")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    distance_to_center_km = Column(Float, nullable=True, default=0.0)

    # Category and type
    accommodation_type = Column(
        Enum(AccommodationType, name="accommodation_type_enum",
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AccommodationType.hotel,
    )
    stars = Column(Integer, nullable=True)                  # 1-5

    # Services / amenities (array of strings)
    amenities = Column(ARRAY(String), nullable=True, default=[])

    # Meal plan
    meal_plan = Column(
        Enum(MealPlan, name="meal_plan_enum",
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=MealPlan.none,
    )
    pets_allowed = Column(Boolean, nullable=False, default=False)

    # Description
    description = Column(Text, nullable=True)

    # Main image
    image_url = Column(String(1000), nullable=True)

    # PMS integration
    pms_endpoint = Column(String(500), nullable=True)

    # Tax rate applied to rates (e.g. 0.19 = 19% VAT Colombia)
    tax_rate = Column(Float, nullable=False, default=0.19)

    # Relationships
    rooms = relationship(
        "Room", back_populates="property", cascade="all, delete-orphan"
    )
    reviews = relationship(
        "Review", back_populates="property", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_property_country", "country"),                         # shard key
        Index("ix_property_location", "location"),
        Index("ix_property_accommodation_type", "accommodation_type"),
        Index("ix_property_stars", "stars"),
        Index("ix_property_pets_allowed", "pets_allowed"),
        Index("ix_property_country_location", "country", "location"),   # composite shard+search
    )

