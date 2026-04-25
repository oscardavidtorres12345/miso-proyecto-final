import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from src.api.auth import resolve_request_user_id

_SECRET = "travelhub-dev-secret"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _jwt(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    h = _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    p = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(
        _SECRET.encode("utf-8"), f"{h}.{p}".encode("utf-8"), hashlib.sha256
    ).digest()
    s = _b64url(sig)
    return f"{h}.{p}.{s}"


def test_resolve_request_user_id_fallback_header() -> None:
    assert resolve_request_user_id(authorization=None, x_user_id=42) == 42


def test_resolve_request_user_id_missing_credentials() -> None:
    with pytest.raises(HTTPException) as exc:
        resolve_request_user_id(authorization=None, x_user_id=None)
    assert exc.value.status_code == 401


def test_resolve_request_user_id_invalid_auth_header_format() -> None:
    with pytest.raises(HTTPException) as exc:
        resolve_request_user_id(authorization="Basic abc", x_user_id=None)
    assert exc.value.status_code == 401


def test_resolve_request_user_id_invalid_token_structure() -> None:
    with pytest.raises(HTTPException) as exc:
        resolve_request_user_id(authorization="Bearer not.a.jwt", x_user_id=None)
    assert exc.value.status_code == 401


def test_resolve_request_user_id_invalid_signature() -> None:
    bad = _jwt(
        {
            "sub": "7",
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        }
    )
    bad = bad[:-1] + ("a" if bad[-1] != "a" else "b")
    with pytest.raises(HTTPException) as exc:
        resolve_request_user_id(authorization=f"Bearer {bad}", x_user_id=None)
    assert exc.value.status_code == 401


def test_resolve_request_user_id_expired_jwt() -> None:
    tok = _jwt(
        {
            "sub": "7",
            "exp": int((datetime.now(timezone.utc) - timedelta(minutes=1)).timestamp()),
        }
    )
    with pytest.raises(HTTPException) as exc:
        resolve_request_user_id(authorization=f"Bearer {tok}", x_user_id=None)
    assert exc.value.status_code == 401


def test_resolve_request_user_id_valid_sub_claim() -> None:
    tok = _jwt(
        {
            "sub": "11",
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        }
    )
    assert resolve_request_user_id(authorization=f"Bearer {tok}", x_user_id=None) == 11


def test_resolve_request_user_id_valid_user_id_claim() -> None:
    tok = _jwt(
        {
            "user_id": 12,
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        }
    )
    assert resolve_request_user_id(authorization=f"Bearer {tok}", x_user_id=None) == 12
