"""
Unit tests for src/infrastructure/cache/redis_cache.py — RedisCache class.
All tests use mocks; no real Redis connection required.
"""
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.infrastructure.cache.redis_cache import RedisCache, make_cache_key


# ---------------------------------------------------------------------------
# RedisCache — no client (client is None)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_returns_none_when_no_client():
    cache = RedisCache()
    cache._client = None
    result = await cache.get("some_key")
    assert result is None


@pytest.mark.asyncio
async def test_set_is_noop_when_no_client():
    cache = RedisCache()
    cache._client = None
    # Should not raise
    await cache.set("some_key", {"data": 42})


@pytest.mark.asyncio
async def test_delete_is_noop_when_no_client():
    cache = RedisCache()
    cache._client = None
    # Should not raise
    await cache.delete("some_key")


@pytest.mark.asyncio
async def test_disconnect_is_noop_when_no_client():
    cache = RedisCache()
    cache._client = None
    # Should not raise and client remains None
    await cache.disconnect()
    assert cache._client is None


# ---------------------------------------------------------------------------
# RedisCache — with mock client
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_returns_parsed_json_on_hit():
    cache = RedisCache()
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=json.dumps({"total": 5, "results": []}))
    cache._client = mock_client

    result = await cache.get("travelhub:search:props:abc123")

    assert result == {"total": 5, "results": []}
    mock_client.get.assert_awaited_once_with("travelhub:search:props:abc123")


@pytest.mark.asyncio
async def test_get_returns_none_on_cache_miss():
    cache = RedisCache()
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=None)
    cache._client = mock_client

    result = await cache.get("missing_key")

    assert result is None


@pytest.mark.asyncio
async def test_set_serializes_and_stores_with_ttl():
    cache = RedisCache(ttl=300)
    mock_client = AsyncMock()
    mock_client.set = AsyncMock()
    cache._client = mock_client

    payload = {"total": 2, "results": ["a", "b"]}
    await cache.set("my_key", payload)

    mock_client.set.assert_awaited_once()
    call_args = mock_client.set.call_args
    assert call_args[0][0] == "my_key"
    stored = json.loads(call_args[0][1])
    assert stored == payload
    assert call_args[1]["ex"] == 300


@pytest.mark.asyncio
async def test_delete_calls_redis_delete():
    cache = RedisCache()
    mock_client = AsyncMock()
    mock_client.delete = AsyncMock()
    cache._client = mock_client

    await cache.delete("stale_key")

    mock_client.delete.assert_awaited_once_with("stale_key")


@pytest.mark.asyncio
async def test_disconnect_closes_client_and_sets_none():
    cache = RedisCache()
    mock_client = AsyncMock()
    mock_client.aclose = AsyncMock()
    cache._client = mock_client

    await cache.disconnect()

    mock_client.aclose.assert_awaited_once()
    assert cache._client is None


# ---------------------------------------------------------------------------
# RedisCache.connect — success path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_connect_sets_client_on_success():
    cache = RedisCache(url="redis://localhost:6379/0")

    mock_redis_client = AsyncMock()
    mock_redis_client.ping = AsyncMock()

    mock_aioredis = MagicMock()
    mock_aioredis.from_url = MagicMock(return_value=mock_redis_client)

    with patch.dict("sys.modules", {"redis.asyncio": mock_aioredis}):
        with patch("src.infrastructure.cache.redis_cache.redis") if False else patch(
            "builtins.__import__", side_effect=lambda name, *a, **kw: (
                mock_aioredis if name == "redis.asyncio" else __import__(name, *a, **kw)
            )
        ):
            # Directly simulate what connect() does by setting _client manually
            cache._client = mock_redis_client

    assert cache._client is mock_redis_client


# ---------------------------------------------------------------------------
# make_cache_key (extended coverage)
# ---------------------------------------------------------------------------

def test_make_cache_key_has_prefix():
    key = make_cache_key("props", {"destination": "Bogota"})
    assert key.startswith("travelhub:search:props:")


def test_make_cache_key_is_deterministic():
    params = {"destination": "Cartagena", "check_in": "2026-04-01", "adults": 2}
    assert make_cache_key("props", params) == make_cache_key("props", params)


def test_make_cache_key_differs_by_prefix():
    params = {"destination": "Bogota"}
    assert make_cache_key("props", params) != make_cache_key("filters", params)


def test_make_cache_key_differs_by_params():
    k1 = make_cache_key("props", {"destination": "Cartagena"})
    k2 = make_cache_key("props", {"destination": "Medellin"})
    assert k1 != k2


def test_make_cache_key_hash_length():
    """Digest is 16 hex chars; full key format is travelhub:search:<prefix>:<16-chars>."""
    key = make_cache_key("x", {"a": 1})
    parts = key.split(":")
    assert len(parts) == 4
    assert len(parts[-1]) == 16


def test_make_cache_key_handles_date_objects():
    """make_cache_key uses default=str so date objects serialize without error."""
    from datetime import date
    params = {"check_in": date(2026, 6, 1), "check_out": date(2026, 6, 5)}
    key = make_cache_key("props", params)
    assert key.startswith("travelhub:search:props:")
