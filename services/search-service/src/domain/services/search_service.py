import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.schemas.search import SearchRequest, SearchResponse
from src.infrastructure.repositories.property_repository import PropertyRepository
from src.infrastructure.cache.redis_cache import redis_cache, make_cache_key, RedisCache

logger = logging.getLogger(__name__)


class SearchService:
    """
    Servicio de dominio para búsqueda de hospedajes (HU002 + HU023).

    Implementa Cache-Aside sobre Redis:
      1. Calcula cache_key a partir del hash SHA-256 de los parámetros.
      2. HIT  → devuelve resultado desde Redis (< 1 ms, p95 < 800 ms garantizado).
      3. MISS → consulta PostgreSQL, almacena resultado en Redis con TTL=300 s.

    El cache se degrada silenciosamente si Redis no está disponible.
    """

    def __init__(self, session: AsyncSession, cache: Optional[RedisCache] = None):
        self.repository = PropertyRepository(session)
        self.cache = cache if cache is not None else redis_cache

    async def search_properties(self, req: SearchRequest) -> SearchResponse:
        """
        Busca propiedades disponibles según los filtros del request.

        Criterios de disponibilidad:
          - Habitación con CANTIDAD_TOTAL - CANTIDAD_CONFIRMADA >= rooms en TODAS las noches
          - Habitación con CAPACIDAD_MAX >= adults + children
          - Propiedad cuya UBICACION_GEOG contiene el destination (ilike)

        Filtros opcionales:
          - pets           → propiedad.acepta_mascotas = True
          - accommodation_type → propiedad.tipo IN [...]
          - stars          → propiedad.estrellas IN [...]
          - meal_plan      → propiedad.plan_alimentacion = valor
          - amenities      → propiedad.amenidades @> [lista requerida]  (GIN)
          - price_min/max  → precio promedio por noche (sin impuesto)

        Precio total = precio_noche × noches × (1 + porcentaje_impuesto)
        """
        # ── Cache-Aside: try cache first ──────────────────────────────────────
        cache_key = make_cache_key("props", req.model_dump(mode="json"))
        cached = await self.cache.get(cache_key)
        if cached is not None:
            logger.debug("Cache HIT key=%s", cache_key)
            return SearchResponse(**cached)

        logger.debug("Cache MISS key=%s — querying DB", cache_key)

        # ── DB query ──────────────────────────────────────────────────────────
        result = await self.repository.search(req)

        # ── Populate cache (fire-and-forget style, errors are suppressed) ─────
        await self.cache.set(cache_key, result.model_dump(mode="json"))

        return result

