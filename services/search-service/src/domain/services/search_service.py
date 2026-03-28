import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.schemas.search import SearchRequest, SearchResponse
from src.infrastructure.repositories.property_repository import PropertyRepository
from src.infrastructure.cache.redis_cache import redis_cache, make_cache_key, RedisCache

logger = logging.getLogger(__name__)


class SearchService:
    """
    Domain service for accommodation search (HU002 + HU023).

    Implements Cache-Aside on Redis:
      1. Computes cache_key from SHA-256 hash of the request parameters.
      2. HIT  → returns result from Redis (< 1 ms, p95 < 800 ms guaranteed).
      3. MISS → queries PostgreSQL, stores result in Redis with TTL=300 s.

    Cache degrades silently if Redis is unavailable.
    """

    def __init__(self, session: AsyncSession, cache: Optional[RedisCache] = None):
        self.repository = PropertyRepository(session)
        self.cache = cache if cache is not None else redis_cache

    async def search_properties(self, req: SearchRequest) -> SearchResponse:
        """
        Searches available properties according to the request filters.

        Availability criteria:
          - Room with total_quantity - confirmed_quantity >= rooms for ALL nights
          - Room with max_capacity >= adults + children
          - Property whose location contains destination (ilike)

        Optional filters:
          - pets                → property.pets_allowed = True
          - accommodation_type  → property.accommodation_type IN [...]
          - stars               → property.stars IN [...]
          - meal_plan           → property.meal_plan = slug
          - amenities           → property.amenities @> [required list] (GIN)
          - price_min/max       → average nightly rate before tax

        Total price = price_per_night × nights × (1 + tax_rate)
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

