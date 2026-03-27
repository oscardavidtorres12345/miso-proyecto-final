from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, Text
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Review(Base):
    """
    Guest review for a property.
    Maps the REVIEW table from the ER diagram (review_date TIMESTAMPTZ column).
    """
    __tablename__ = "review"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(
        Integer, ForeignKey("property.id", ondelete="CASCADE"), nullable=False
    )
    rating = Column(Float, nullable=False)          # 1.0 – 5.0
    comment = Column(Text, nullable=True)
    review_date = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    property = relationship("Property", back_populates="reviews")

    __table_args__ = (
        Index("ix_review_property_id", "property_id"),
    )

