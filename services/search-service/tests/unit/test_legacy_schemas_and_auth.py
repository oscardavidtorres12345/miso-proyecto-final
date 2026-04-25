from __future__ import annotations

import pytest
from fastapi import HTTPException
import importlib.util
from pathlib import Path

from src.api.internal_auth import require_internal_token


def _load_legacy_schemas_module():
    file_path = Path(__file__).resolve().parents[2] / "src" / "domain" / "schemas.py"
    spec = importlib.util.spec_from_file_location("legacy_schemas_module", file_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_legacy_search_schemas_construct() -> None:
    mod = _load_legacy_schemas_module()

    SearchHotelsQuery = mod.SearchHotelsQuery
    SearchResponse = mod.SearchResponse
    PerformanceStatus = mod.PerformanceStatus
    AutoscalingSignalResponse = mod.AutoscalingSignalResponse

    q = SearchHotelsQuery(
        destination="Bogota", check_in="2026-05-01", check_out="2026-05-02", guests=2
    )
    assert q.destination == "Bogota"

    r = SearchResponse(status="ok", sprint=1, hu_id="HU002", results=[])
    p = PerformanceStatus(status="ok", sprint=1, hu_id="HU023", indexed_hotels=1)
    a = AutoscalingSignalResponse(
        status="ok", sprint=2, hu_id="HU022", target_metric="rps", current_value=1.0
    )
    assert r.hu_id == "HU002"
    assert p.indexed_hotels == 1
    assert a.target_metric == "rps"


def test_internal_token_validation() -> None:
    require_internal_token("travelhub-internal-dev-token")
    with pytest.raises(HTTPException):
        require_internal_token(None)
    with pytest.raises(HTTPException):
        require_internal_token("bad")
