# Importar todos los modelos para que SQLAlchemy los registre al crear las tablas
from src.domain.models.property import Propiedad, AccommodationType, MealPlan  # noqa: F401
from src.domain.models.room import Habitacion  # noqa: F401
from src.domain.models.inventory import Inventario  # noqa: F401
from src.domain.models.rate import Tarifa  # noqa: F401
from src.domain.models.review import Resena  # noqa: F401
