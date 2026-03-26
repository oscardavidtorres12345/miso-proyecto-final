"""
Redis Cache-Aside implementation (HU023).

Pattern:
  1. On search: compute cache_key from request params hash.
  2. GET key from Redis — if HIT, return cached JSON (0 DB round-trips).
  3. On MISS: execute DB query, SET result in Redis with TTL=300s.

TTL of 5 minutes balances freshness vs. performance. Popular destinations
(Cartagena weekend, Bogotá conferences) are served from cache for ~5 min,
keeping p95 well below 800ms even at 30k SKUs.
"""
import hashlib
import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)

_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
_DEFAULT_TTL = int(os.getenv("CACHE_TTL_SECONDS", "300"))  # 5 minutes


def make_cache_key(prefix: str, params: dict) -> str:
    """Deterministic cache key: sha256 of sorted JSON of params."""
    canonical = json.dumps(params, sort_keys=True, default=str)
    digest = hashlib.sha256(canonical.encode()).hexdigest()[:16]
    return f"travelhub:search:{prefix}:{digest}"


class RedisCache:
    """
    Async Redis client wrapper using redis-py v5 (redis[hiredis]).
    Gracefully degrades to a no-op when Redis is unavailable so the
    service never fails due to cache connectivity issues.
    """

    def __init__(self, url: str = _REDIS_URL, ttl: int = _DEFAULT_TTL):
        self._url = url
        self._ttl = ttl
        self._client = None

    async def connect(self) -> None:
        try:
            import redis.asyncio as aioredis
            self._client = aioredis.from_url(
                self._url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            await self._client.ping()
            logger.info("Redis connected: %s (TTL=%ds)", self._url, self._ttl)
        except Exception as exc:  # pragma: no cover
            logger.warning("Redis unavailable — cache disabled. (%s)", exc)
            self._client = None

    async def disconnect(self) -> None:
        if self._client:
            try:
                await self._client.aclose()
            except Exception:  # pragma: no cover
                pass
            self._client = None

    async def get(self, key: str) -> Optional[Any]:
        """Return parsed JSON value or None on miss/error."""
        if not self._client:
            return None
        try:
            raw = await self._client.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:  # pragma: no cover
            logger.debug("Cache GET error for key=%s: %s", key, exc)
            return None

    async def set(self, key: str, value: Any) -> None:
        """Serialize value to JSON and store with TTL. Silently ignores errors."""
        if not self._client:
            return
        try:
            await self._client.set(key, json.dumps(value, default=str), ex=self._ttl)
        except Exception as exc:  # pragma: no cover
            logger.debug("Cache SET error for key=%s: %s", key, exc)

    async def delete(self, key: str) -> None:
        """Invalidate a cache entry. Silently ignores errors."""
        if not self._client:
            return
        try:
            await self._client.delete(key)
        except Exception as exc:  # pragma: no cover
            logger.debug("Cache DELETE error for key=%s: %s", key, exc)


redis_cache = RedisCache()


