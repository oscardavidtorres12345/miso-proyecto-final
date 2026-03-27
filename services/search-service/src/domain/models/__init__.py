# Import all models so SQLAlchemy registers them when creating tables
from src.domain.models.property import Property, AccommodationType, MealPlan  # noqa: F401
from src.domain.models.room import Room  # noqa: F401
from src.domain.models.inventory import Inventory  # noqa: F401
from src.domain.models.rate import Rate  # noqa: F401
from src.domain.models.review import Review  # noqa: F401
